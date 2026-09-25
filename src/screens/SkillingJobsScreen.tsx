import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapPinIcon, PhoneIcon, GraduationCapIcon, SpeakerIcon } from '../components/Icons';
import { speechService } from '../services/speech';

export const SkillingJobsScreen: React.FC = () => {
  const { currentResult, selectedDistrict, selectedLanguage, setScreen } = useApp();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const districtMarket = currentResult?.districtMarket || {
    district: selectedDistrict || "Varanasi",
    state: "Uttar Pradesh",
    odopSector: "Green Energy & ODOP Traditional Trades",
    odopSectorHi: "सोलर ऊर्जा एवं पारंपरिक ओडीओपी उद्योग (वाराणसी)",
    vacanciesCount: 120,
    centers: [
      {
        id: "ctr-vns-1",
        name: "Government ITI Varanasi PM-AJAY Skill Center",
        nameHi: "राजकीय आईटीआई वाराणसी कौशल केंद्र (पीएम-अजय)",
        district: "Varanasi",
        distanceKm: 5.2,
        courseName: "Short-Term Solar PV Maintenance (ELE/Q5901)",
        courseNameHi: "सोलर पीवी इंस्टॉलर एवं रखरखाव कोर्स",
        durationHours: 300,
        benefits: ["Free Tuition", "Free Uniform & Tool Kit", "Daily Food & Travel Allowance (₹150/day)"],
        benefitsHi: ["निःशुल्क प्रशिक्षण", "मुफ्त टूलकिट एवं यूनिफॉर्म", "दैनिक भोजन व यात्रा भत्ता (₹150/दिन)"],
        coordinatorName: "श्री राजेश कुमार मिश्र",
        coordinatorPhone: "+919452018290",
        address: "करौंदी, बीएचयू परिसर के समीप, वाराणसी",
        addressHi: "करौंदी, बीएचयू परिसर के समीप, वाराणसी"
      }
    ]
  };

  const spokenCenters = `आपके जिले ${districtMarket.district} में ओडीओपी योजना के तहत ${districtMarket.vacanciesCount} पद उपलब्ध हैं। निकटतम प्रशिक्षण केंद्र राजकीय आईटीआई केवल 5.2 किलोमीटर दूर है, जहां 300 घंटे का निःशुल्क प्रशिक्षण एवं भोजन भत्ता उपलब्ध है।`;

  const handlePlayVoice = () => {
    speechService.speak(
      spokenCenters,
      selectedLanguage,
      () => setIsPlayingAudio(true),
      () => setIsPlayingAudio(false)
    );
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5">
      <div className="space-y-4">
        {/* Screen Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl text-ink">
              प्रशिक्षण केंद्र एवं रिक्तियां
            </h1>
            <p className="font-caption text-sm text-ink-muted mt-1">
              जिले में उपलब्ध वास्तविक अवसर एवं केंद्र संपर्क
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

        {/* Center Locator Cards */}
        <div className="space-y-3">
          <span className="font-caption text-xs text-ink-muted uppercase tracking-wide block font-semibold">
            निकटतम पीएम-अजय कौशल केंद्र (Nearby Centers):
          </span>

          {districtMarket.centers.map((center) => (
            <div key={center.id} className="card-flat bg-white border-line p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base text-ink leading-tight">
                    {center.nameHi}
                  </h3>
                  <div className="flex items-center space-x-1.5 text-xs text-ink-muted mt-1">
                    <MapPinIcon size={14} color="#009378" />
                    <span>{center.addressHi}</span>
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
                  {center.courseNameHi}
                </span>
                <span className="text-trust font-medium mt-1 block">
                  अवधि: {center.durationHours} घंटे (निःशुल्क प्रशिक्षण + ₹150 दैनिक भोजन व यात्रा भत्ता)
                </span>
              </div>

              {/* Coordinator & Direct Call Button */}
              <div className="pt-2 border-t border-line flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-ink-muted block">केंद्र समन्वयक:</span>
                  <span className="font-medium text-ink">{center.coordinatorName}</span>
                </div>
                <a
                  href={`tel:${center.coordinatorPhone.replace(/\s+/g, '')}`}
                  className="btn-primary text-xs !min-h-[44px] !py-2 !px-3 inline-flex items-center space-x-1.5"
                  aria-label="समन्वयक को कॉल करें"
                >
                  <PhoneIcon size={14} color="#FFFFFF" />
                  <span>कॉल करें</span>
                </a>
              </div>
            </div>
          ))}
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
