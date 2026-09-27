import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapPinIcon, PhoneIcon, GraduationCapIcon, SpeakerIcon } from '../components/Icons';
import { speechService } from '../services/speech';
import { CenterMap } from '../components/Map/CenterMap';
import { DISTRICT_MARKET_REGISTRY } from '../../server/data/districtJobs';
import { SkillingCenter } from '../types';

export const SkillingJobsScreen: React.FC = () => {
  const { currentResult, selectedDistrict, selectedLanguage, setScreen } = useApp();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedCenterId, setSelectedCenterId] = useState<string | undefined>(undefined);

  const defaultRegistry = DISTRICT_MARKET_REGISTRY[selectedDistrict || "Varanasi"] || DISTRICT_MARKET_REGISTRY["Varanasi"];

  const districtMarket = currentResult?.districtMarket || {
    district: defaultRegistry.district,
    state: defaultRegistry.state,
    odopSector: defaultRegistry.odopSector,
    odopSectorHi: defaultRegistry.odopSectorHi,
    vacanciesCount: defaultRegistry.openingsCount,
    centers: defaultRegistry.centers
  };

  const spokenCenters = `आपके जिले ${districtMarket.district} में ओडीओपी योजना के तहत ${districtMarket.vacanciesCount} पद उपलब्ध हैं। निकटतम प्रशिक्षण केंद्र ${districtMarket.centers[0]?.nameHi || 'राजकीय आईटीआई'} केवल ${districtMarket.centers[0]?.distanceKm || 5.2} किलोमीटर दूर है, जहां 300 घंटे का निःशुल्क प्रशिक्षण एवं भोजन भत्ता उपलब्ध है।`;

  const handlePlayVoice = () => {
    speechService.speak(
      spokenCenters,
      selectedLanguage,
      () => setIsPlayingAudio(true),
      () => setIsPlayingAudio(false)
    );
  };

  const activeSelectedCenter = districtMarket.centers.find(c => c.id === selectedCenterId) || districtMarket.centers[0];

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
            {districtMarket.odopSectorHi}
          </h2>
          <div className="mt-2 inline-flex items-center space-x-2 bg-trust text-surface px-3 py-1.5 rounded text-xs font-bold">
            <span>{districtMarket.vacanciesCount} सक्रिय रिक्तियां उपलब्ध</span>
          </div>
          <p className="text-xs text-ink-muted mt-2">
            पीएम-अजय योजना के तहत पंजीकृत स्थानीय सूक्ष्म उद्यमों में सीधी आवश्यकता।
          </p>
        </div>

        {/* Interactive Map Tracking Component */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-caption text-xs text-ink-muted uppercase tracking-wide font-semibold flex items-center space-x-1">
              <MapPinIcon size={14} color="#009378" />
              <span>नक्शे पर केंद्र ट्रैक करें (Live Map Tracking):</span>
            </span>
            <span className="text-[11px] text-trust font-bold">
              {districtMarket.centers.length} वास्तविक केंद्र मिले
            </span>
          </div>

          <CenterMap
            centers={districtMarket.centers}
            selectedCenterId={selectedCenterId || activeSelectedCenter?.id}
            onSelectCenter={(center: SkillingCenter) => setSelectedCenterId(center.id)}
          />
        </div>

        {/* Center Locator Cards */}
        <div className="space-y-3 pt-2">
          <span className="font-caption text-xs text-ink-muted uppercase tracking-wide block font-semibold">
            पीएम-अजय कौशल केंद्रों की सूची (Skill Centers List):
          </span>

          {districtMarket.centers.map((center) => {
            const isSelected = (selectedCenterId || activeSelectedCenter?.id) === center.id;
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
                      <span>{center.nameHi || center.name}</span>
                    </h3>
                    <div className="flex items-center space-x-1.5 text-xs text-ink-muted mt-1">
                      <MapPinIcon size={14} color="#009378" />
                      <span>{center.addressHi || center.address}</span>
                    </div>
                  </div>
                  <span className="shrink-0 bg-surface border border-line text-ink font-semibold text-xs px-2 py-1 rounded">
                    {center.distanceKm} किमी दूर
                  </span>
                </div>

                {/* Course Detail */}
                <div className="bg-surface/60 rounded p-2.5 text-xs border border-line/60">
                  <span className="text-ink-muted block">प्रशिक्षण पाठ्यक्रम:</span>
                  <span className="font-semibold text-ink text-sm block mt-0.5">
                    {center.courseNameHi || center.courseName}
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
      </div>

      {/* Single Clear Action CTA per design.md §1 & §5 */}
      <div className="mt-6 pt-4 border-t border-line">
        <button
          onClick={() => {
            speechService.stopSpeaking();
            setScreen('micro-finance');
          }}
          className="btn-primary w-full"
        >
          ऋण एवं सब्सिडी की जानकारी देखें
        </button>
      </div>
    </div>
  );
};
