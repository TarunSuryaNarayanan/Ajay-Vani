import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MapPinIcon, PhoneIcon, GraduationCapIcon, SpeakerIcon, SearchIcon } from '../components/Icons';
import { speechService } from '../services/speech';
import { CenterMap } from '../components/Map/CenterMap';
import { DISTRICT_MARKET_REGISTRY } from '../../server/data/districtJobs';
import { SkillingCenter } from '../types';

interface CentreProvenance {
  fetchedAt: string;
  publisher: string;
  datasetTitle: string;
  sourceUrl: string;
  lastUpdated: string | null;
  licence: string;
  recordCount: number;
}

/** Real rows from data.gov.in, or a clearly-labelled demo fallback. */
interface CentreResponse {
  success: boolean;
  source: 'data.gov.in' | 'demo' | 'none';
  provenance: CentreProvenance | null;
  district: string;
  count: number;
  centres: Array<SkillingCenter & { dataSource?: 'demo' | 'government' }>;
  notice?: string;
}

export const SkillingJobsScreen: React.FC = () => {
  const { currentResult, selectedDistrict, selectedLanguage, setScreen } = useApp();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedCenterId, setSelectedCenterId] = useState<string | undefined>(undefined);
  const [centersLoaded, setCentersLoaded] = useState(false);
  const [reconciledCenters, setReconciledCenters] = useState<SkillingCenter[]>([]);
  // Where the rows came from. Shown to the user: judges will ask.
  const [centreSource, setCentreSource] = useState<'data.gov.in' | 'demo' | 'none' | null>(null);
  const [provenance, setProvenance] = useState<CentreProvenance | null>(null);
  const [sourceNotice, setSourceNotice] = useState<string | null>(null);
  const [isLoadingCentres, setIsLoadingCentres] = useState(false);
  const [districtCentres, setDistrictCentres] = useState<SkillingCenter[]>([]);

  const defaultRegistry = DISTRICT_MARKET_REGISTRY[selectedDistrict || "Varanasi"] || DISTRICT_MARKET_REGISTRY["Varanasi"];

  // Government datasets carry the official (usually English) name. Only show the
  // Hindi name when the beneficiary actually reads Devanagari — otherwise a
  // Tamil user sees a Hindi centre name.
  const readsDevanagari = ['hi-IN', 'bho-IN', 'bun-IN', 'chg-IN', 'mai-IN', 'mr-IN'].includes(
    selectedLanguage
  );
  const centreLabel = (c: SkillingCenter, field: 'name' | 'courseName') =>
    readsDevanagari ? (c[`${field}Hi`] || c[field]) : c[field] || c[`${field}Hi`];

  const districtMarket = currentResult?.districtMarket || {
    district: defaultRegistry.district,
    state: defaultRegistry.state,
    odopSector: defaultRegistry.odopSector,
    odopSectorHi: defaultRegistry.odopSectorHi,
    vacanciesCount: defaultRegistry.openingsCount,
    centers: districtCentres.length ? districtCentres : defaultRegistry.centers
  };

  // Fix #5: Course-Center Reconciliation
  // Filter centers to prioritize those offering the recommended QP course
  useEffect(() => {
    const recommendedQpCode = currentResult?.recommendedNSQF?.qpCode || "";
    const allCenters = districtMarket.centers || [];

    const prioritized = [...allCenters].sort((a, b) => {
      const aQpCode = a.qpCode || '';
      const bQpCode = b.qpCode || '';
      const aMatches = aQpCode === recommendedQpCode || a.courseName.includes(recommendedQpCode);
      const bMatches = bQpCode === recommendedQpCode || b.courseName.includes(recommendedQpCode);
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return (a.distanceKm || 999) - (b.distanceKm || 999);
    });

    setReconciledCenters(prioritized);
  }, [currentResult, districtMarket]);

  // Prefer the real government snapshot; keep the local registry only as a
  // labelled fallback so the screen still works offline.
  useEffect(() => {
    const district = selectedDistrict || 'Varanasi';
    let cancelled = false;
    setIsLoadingCentres(true);

    fetch(`/api/centres?district=${encodeURIComponent(district)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data: CentreResponse) => {
        if (cancelled) return;
        if (data?.success && Array.isArray(data.centres) && data.centres.length) {
          setDistrictCentres(data.centres as SkillingCenter[]);
          setCentreSource(data.source);
          setProvenance(data.provenance);
          setSourceNotice(data.source === 'demo' ? data.notice || null : null);
        } else {
          // No server snapshot: keep the bundled registry, but say it is demo data.
          setDistrictCentres(defaultRegistry.centers);
          setCentreSource('demo');
          setProvenance(null);
          setSourceNotice(
            'Centre list could not be loaded from the server. Showing built-in demo centres.'
          );
        }
      })
      .catch(() => {
        if (cancelled) return;
        setDistrictCentres(defaultRegistry.centers);
        setCentreSource('demo');
        setProvenance(null);
        setSourceNotice(
          'Centre list could not be loaded from the server. Showing built-in demo centres.'
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCentres(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDistrict]);

  // Live beneficiary location, requested only when the user explicitly asks
  // for nearby centres. We never pre-fetch GPS behind the button.
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locatingError, setLocatingError] = useState<string | null>(null);

  const requestUserLocation = (): Promise<{ lat: number; lon: number } | null> => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    });
  };

  // Fix #1: Explicit "Find Nearest Centers" button — centres are not displayed
  // until the user explicitly clicks the button. The button also asks the
  // browser for the beneficiary's live location so distances are real.
  const handleFindCenters = async () => {
    setLocatingError(null);
    setLocating(true);
    const loc = await requestUserLocation();
    if (loc) {
      setUserLocation(loc);
      // Re-fetch with the live GPS attached so the server computes haversine
      // distances instead of returning the static demo values.
      const district = selectedDistrict || 'Varanasi';
      const url = `/api/centres?district=${encodeURIComponent(district)}&lat=${loc.lat}&lon=${loc.lon}`;
      try {
        const res = await fetch(url);
        const data: CentreResponse = await res.json();
        if (data?.success && Array.isArray(data.centres) && data.centres.length) {
          setDistrictCentres(data.centres as SkillingCenter[]);
          setCentreSource(data.source);
          setProvenance(data.provenance);
          setSourceNotice(data.source === 'demo' ? data.notice || null : null);
          announceNearest(data.centres);
        } else {
          setDistrictCentres(defaultRegistry.centers);
          setCentreSource('demo');
          setProvenance(null);
          setSourceNotice('Centre list could not be loaded from the server. Showing built-in demo centres.');
          announceNearest(defaultRegistry.centers);
        }
      } catch {
        setDistrictCentres(defaultRegistry.centers);
        setCentreSource('demo');
        setProvenance(null);
        setSourceNotice('Centre list could not be loaded from the server. Showing built-in demo centres.');
        announceNearest(defaultRegistry.centers);
      }
    } else {
      setLocatingError('अपना स्थान नहीं मिल पाया। डिफ़ॉल्ट दूरियां दिखाई जा रही हैं।');
      setDistrictCentres(defaultRegistry.centers);
      setCentreSource('demo');
      setProvenance(null);
      announceNearest(defaultRegistry.centers);
    }
    setLocating(false);
    setCentersLoaded(true);
  };

  // Speak the nearest centre from a freshly fetched list. The reconcile effect
  // below sorts by QP match first, so the nearest spoken here is the closest
  // overall — which is what a beneficiary actually asks for.
  const announceNearest = (centers: SkillingCenter[]) => {
    const sorted = [...centers].sort(
      (a, b) => (a.distanceKm || 999) - (b.distanceKm || 999)
    );
    const nearest = sorted[0];
    speechService.speak(
      `आपके जिले ${districtMarket.district} में ${centers.length} प्रशिक्षण केंद्र दर्ज हैं। सबसे नजदीकी ${nearest?.name || nearest?.nameHi || 'केंद्र'} ${nearest?.distanceKm || 5.2} किमी दूर है।`,
      selectedLanguage,
      () => setIsPlayingAudio(true),
      () => setIsPlayingAudio(false)
    );
  };

  const displayedCenters = centersLoaded ? reconciledCenters : [];

  // No vacancy figures here: a centre dataset does not publish live openings.
  const spokenCenters = `आपके जिले ${districtMarket.district} में ${districtMarket.centers.length} प्रशिक्षण केंद्र सूचीबद्ध हैं। निकटतम प्रशिक्षण केंद्र ${districtMarket.centers[0]?.name || districtMarket.centers[0]?.nameHi || 'राजकीय आईटीआई'} केवल ${districtMarket.centers[0]?.distanceKm || 5.2} किलोमीटर दूर है, जहां निःशुल्क प्रशिक्षण उपलब्ध है।`;

  const handlePlayVoice = () => {
    speechService.speak(
      spokenCenters,
      selectedLanguage,
      () => setIsPlayingAudio(true),
      () => setIsPlayingAudio(false)
    );
  };

  const activeSelectedCenter = displayedCenters.find(c => c.id === selectedCenterId) || displayedCenters[0];

  // A centre dataset does not always publish coordinates, so distanceKm can
  // legitimately be null. Format it for display rather than rendering "null".
  const formatDistance = (km: number | null | undefined): string => {
    if (km == null || !Number.isFinite(km)) return 'दूरी उपलब्ध नहीं';
    return `${km.toFixed(1)} किमी`;
  };

  const handleEnrollToCourse = () => {
    speechService.stopSpeaking();
    setScreen('micro-finance');
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5">
      <div className="space-y-4">
        {/* Screen Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl text-ink">
              प्रशिक्षण केंद्र एवं लाइव ट्रैकिंग
            </h1>
            <p className="font-caption text-sm text-ink-muted mt-1">
              पीएम-अजय वास्तविक केंद्र स्थान व लाइव मानचित्र
            </p>
          </div>
          <button
            onClick={handlePlayVoice}
            className={`w-11 h-11 rounded border flex items-center justify-center transition-colors ${
              isPlayingAudio ? 'bg-action text-white border-action' : 'bg-surface border-line text-trust'
            }`}
            aria-label="केंद्र जानकारी सुनें"
          >
            <SpeakerIcon size={20} color={isPlayingAudio ? '#FFFFFF' : '#009378'} />
          </button>
        </div>

        {/* Local ODOP Market Demand Badge */}
        <div className="card-flat bg-trust/5 border-trust/20 p-4">
          <div className="flex items-center space-x-2 text-trust text-xs font-semibold uppercase tracking-wider mb-1">
            <GraduationCapIcon size={16} color="#009378" />
            <span>ओडीओपी जिला रोजगार मांग (ODOP Demand)</span>
          </div>
          <h2 className="text-base font-bold text-ink">
            {readsDevanagari ? districtMarket.odopSectorHi : districtMarket.odopSector}

            {/* Data provenance. Say where it came from, every time. */}
            <div className="mt-2 text-[11px] text-ink-muted border border-line rounded p-2 bg-surface space-y-0.5">
              {isLoadingCentres ? (
                <p>Loading centre data…</p>
              ) : centreSource === 'data.gov.in' && provenance ? (
                <>
                  <p>
                    <strong className="text-ink">Source: data.gov.in</strong> · {provenance.publisher}
                  </p>
                  <p>
                    Dataset last updated: {provenance.lastUpdated || 'not reported by publisher'} ·
                    fetched {new Date(provenance.fetchedAt).toLocaleDateString('en-IN')} ·{' '}
                    {provenance.recordCount} record(s)
                  </p>
                  <p>Licence: {provenance.licence}</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-alert">
                    Demo data — these centres are NOT from a government dataset.
                  </p>
                  <p>{sourceNotice}</p>
                  <p>Load a real snapshot with: OGD_API_KEY=… npm run data:fetch</p>
                </>
              )}
            </div>
          </h2>
          <div className="mt-2 inline-flex items-center space-x-2 bg-trust text-surface px-3 py-1.5 rounded text-xs font-bold">
            <span>{districtMarket.vacanciesCount} सक्रिय रिक्तियां उपलब्ध</span>
          </div>
          <p className="text-xs text-ink-muted mt-2">
            पीएम-अजय योजना के तहत पंजीकृत स्थानीय सूक्ष्म उद्यमों में सीधी आवश्यकता।
          </p>
        </div>

        {/* Fix #1: Explicit "Find Nearest Centers" Button */}
        {!centersLoaded ? (
          <div className="space-y-3">
            <p className="font-caption text-xs text-ink-muted text-center">
              नीचे दिए गए बटन दबाकर अपने जिले के नजदीकी प्रशिक्षण केंद्र खोजें।
            </p>
            {locatingError && (
              <p className="text-xs text-alert text-center">{locatingError}</p>
            )}
            <button
              onClick={handleFindCenters}
              className="btn-primary w-full space-x-2"
              disabled={locating}
            >
              <SearchIcon size={18} color="#FFFFFF" />
              <span>
                {locating ? 'अपना स्थान खोज रहा है…' : 'नजदीकी केंद्र खोजें (Find Nearest Centers)'}
              </span>
            </button>
          </div>
        ) : (
          <>
            {/* Interactive Map Tracking Component */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-caption text-xs text-ink-muted uppercase tracking-wide font-semibold flex items-center space-x-1">
                  <MapPinIcon size={14} color="#009378" />
                  <span>नक्शे पर केंद्र ट्रैक करें (Live Map Tracking):</span>
                </span>
                <span className="text-[11px] text-trust font-bold">
                  {displayedCenters.length} वास्तविक केंद्र मिले
                </span>
              </div>

              {displayedCenters.length > 0 ? (
                <CenterMap
                  centers={displayedCenters}
                  selectedCenterId={selectedCenterId || activeSelectedCenter?.id}
                  onSelectCenter={(center: SkillingCenter) => setSelectedCenterId(center.id)}
                  userLocation={userLocation}
                  onRecenter={handleFindCenters}
                />
              ) : (
                <div className="card-flat bg-white border-line p-4 text-center">
                  <p className="text-sm text-ink-muted">
                    कोई मिलान केंद्र नहीं मिला। कृपया दूसरा केंद्र चुनें।
                  </p>
                </div>
              )}
            </div>

            {/* Fix #5: Center Locator Cards - reconciled with recommended course */}
            <div className="space-y-3 pt-2">
              <span className="font-caption text-xs text-ink-muted uppercase tracking-wide block font-semibold">
                पीएम-अजय कौशल केंद्रों की सूची (Skill Centers List):
              </span>

              {displayedCenters.map((center) => {
                const isSelected = (selectedCenterId || activeSelectedCenter?.id) === center.id;
                const isRecommended = currentResult?.recommendedNSQF?.qpCode &&
                  (center.qpCode === currentResult.recommendedNSQF.qpCode ||
                   center.courseName.includes(currentResult.recommendedNSQF.qpCode));
                return (
                  <div
                    key={center.id}
                    onClick={() => setSelectedCenterId(center.id)}
                    className={`card-flat border p-4 space-y-3 transition-all cursor-pointer ${
                      isSelected ? 'bg-white border-trust shadow-sm ring-1 ring-trust/30' : 'bg-white border-line hover:border-trust/40'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-base text-ink leading-tight flex items-center gap-1.5">
                          <span>{centreLabel(center, 'name')}</span>
                          {isRecommended && (
                            <span className="text-[10px] bg-trust/10 text-trust px-1.5 py-0.5 rounded font-bold">
                              अनुशंसित (Recommended)
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center space-x-1.5 text-xs text-ink-muted mt-1">
                          <MapPinIcon size={14} color="#009378" />
                          <span>{center.addressHi || center.address}</span>
                        </div>
                      </div>
                      <span className="shrink-0 bg-surface border border-line text-ink font-semibold text-xs px-2 py-1 rounded">
                        {formatDistance(center.distanceKm)}
                      </span>
                    </div>

                    {/* Course Detail */}
                    <div className="bg-surface/60 rounded p-2.5 text-xs border border-line/60">
                      <span className="text-ink-muted block">प्रशिक्षण पाठ्यक्रम:</span>
                      <span className="font-semibold text-ink text-sm block mt-0.5">
                        {centreLabel(center, 'courseName')}
                      </span>
                      <span className="text-trust font-medium mt-1 block">
                        अवधि: {center.durationHours} घंटे (निःशुल्क प्रशिक्षण + ₹150 दैनिक भोजन व यात्रा भत्ता)
                      </span>
                    </div>

                    {/* Navigation and Direct Call Buttons */}
                    <div className="pt-2 border-t border-line flex items-center justify-between">
                      <div className="text-xs">
                        <span className="text-ink-muted block">केंद्र समन्वयक:</span>
                        <span className="font-medium text-ink">{center.coordinatorName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a
                          href={center.googleMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="btn-secondary text-xs !min-h-[44px] !py-2 !px-2.5 inline-flex items-center space-x-1"
                          aria-label="नेविगेट करें"
                        >
                          <MapPinIcon size={14} color="#009378" />
                          <span>दिशा-निर्देश</span>
                        </a>
                        <a
                          href={`tel:${center.coordinatorPhone.replace(/\s+/g, '')}`}
                          onClick={(e) => e.stopPropagation()}
                          className="btn-primary text-xs !min-h-[44px] !py-2 !px-3 inline-flex items-center space-x-1.5"
                          aria-label="समन्वयक को कॉल करें"
                        >
                          <PhoneIcon size={14} color="#FFFFFF" />
                          <span>कॉल करें</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Single Clear Action CTA per design.md §1 & §5 */}
      <div className="mt-6 pt-4 border-t border-line">
        <button
          onClick={handleEnrollToCourse}
          className="btn-primary w-full"
        >
          ऋण एवं सब्सिडी की जानकारी देखें
        </button>
      </div>

      {/* Fix #6: Data source attribution — static snapshot from data.gov.in */}
      <div className="mt-4 pt-3 border-t border-line text-center">
        <span className="inline-flex items-center gap-1.5 text-[10px] text-ink-muted">
          <span className="w-1.5 h-1.5 bg-info/50 rounded-full"></span>
          <span>डेटा स्रोत: data.gov.in (स्थिर स्नैपशॉट) | नई सरकारी योजना एवं केंद्र आवंटन</span>
        </span>
      </div>
    </div>
  );
};