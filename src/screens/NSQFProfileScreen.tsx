import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { BriefcaseIcon, GraduationCapIcon, MapPinIcon, SpeakerIcon } from '../components/Icons';
import { speechService } from '../services/speech';

export const NSQFProfileScreen: React.FC = () => {
  const { currentResult, selectedLanguage, setScreen } = useApp();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const profile = currentResult?.profile || {
    beneficiaryName: "रमेश कुमार",
    educationLevel: "8वीं पास",
    traditionalOccupation: "पारंपरिक कार्य: बिजली एवं ट्रैक्टर मरम्मत",
    employmentPreference: "स्वरोजगार (Self-Employment)",
    mobilityRadius: "जिले के अंदर (15 किमी दायरा)"
  };

  const nsqf = currentResult?.recommendedNSQF || {
    qpCode: "ELE/Q5901",
    roleName: "Solar PV Installer & Electrician",
    roleNameHi: "सोलर पीवी इंस्टॉलर एवं तकनीशियन",
    nsqfLevel: 4,
    sector: "नवीकरणीय ऊर्जा (Green Jobs)",
    matchScore: 92,
    estimatedIncome: "₹18,000 - ₹26,000 / माह"
  };

  const spokenSummary = `${profile.beneficiaryName} जी, आपके अनुभव के अनुसार ${nsqf.roleNameHi} का चयन किया गया है। सरकारी कोड ${nsqf.qpCode} है और इसका जिला मांग मेल ${nsqf.matchScore} प्रतिशत है।`;

  useEffect(() => {
    // Speak profile summary gently
    const timer = setTimeout(() => {
      speechService.speak(
        spokenSummary,
        selectedLanguage,
        () => setIsPlayingAudio(true),
        () => setIsPlayingAudio(false)
      );
    }, 400);

    return () => {
      clearTimeout(timer);
      speechService.stopSpeaking();
    };
  }, [spokenSummary, selectedLanguage]);

  const handlePlayVoice = () => {
    speechService.speak(
      spokenSummary,
      selectedLanguage,
      () => setIsPlayingAudio(true),
      () => setIsPlayingAudio(false)
    );
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5">
      <div className="space-y-4">
        {/* Screen Title */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl text-ink">
              कौशल प्रोफ़ाइल एवं प्रमाणन
            </h1>
            <p className="font-caption text-sm text-ink-muted mt-1">
              आपकी बातचीत के आधार पर तैयार आधिकारिक प्रोफ़ाइल
            </p>
          </div>
          <button
            onClick={handlePlayVoice}
            className={`w-11 h-11 rounded border flex items-center justify-center transition-colors ${
              isPlayingAudio ? 'bg-action text-white border-action' : 'bg-surface border-line text-trust'
            }`}
            aria-label="प्रोफ़ाइल सुनें"
          >
            <SpeakerIcon size={20} color={isPlayingAudio ? '#FFFFFF' : '#009378'} />
          </button>
        </div>

        {/* Informal Experience Badge */}
        <div className="card-flat bg-surface/70 border-line">
          <div className="flex items-center space-x-2 text-ink-muted text-xs mb-1">
            <BriefcaseIcon size={16} color="#009378" />
            <span className="font-medium">दर्ज अनुभव (Spoken Background)</span>
          </div>
          <p className="text-base font-semibold text-ink">
            {profile.traditionalOccupation}
          </p>
          <div className="flex items-center space-x-4 mt-2 text-xs text-ink-muted">
            <span>शिक्षा: <strong className="text-ink">{profile.educationLevel}</strong></span>
            <span>श्रेणी: <strong className="text-ink">अनुसूचित जाति (SC)</strong></span>
          </div>
        </div>

        {/* Matched Official NSQF Role Card (Strict flat card per design.md §5) */}
        <div className="card-flat border-line relative overflow-hidden bg-white">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <span className="text-xs font-semibold text-trust bg-trust/10 px-2.5 py-1 rounded">
              अनुशंसित राष्ट्रीय कौशल योग्यता (NSQF)
            </span>
            <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded text-xs font-bold">
              <span>{nsqf.matchScore}% मांग मेल</span>
            </div>
          </div>

          <div className="pt-3">
            <h2 className="text-xl font-bold text-ink leading-snug">
              {nsqf.roleNameHi}
            </h2>
            <p className="text-xs text-ink-muted font-normal mt-0.5">
              {nsqf.roleName}
            </p>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-line text-xs">
              <div>
                <span className="text-ink-muted block">सरकारी क्यूपी कोड (QP Code):</span>
                <span className="font-mono text-sm font-bold text-ink mt-0.5 block">
                  {nsqf.qpCode}
                </span>
              </div>
              <div>
                <span className="text-ink-muted block">योग्यता स्तर (NSQF Level):</span>
                <span className="text-sm font-bold text-ink mt-0.5 block">
                  लेवल {nsqf.nsqfLevel} (Level {nsqf.nsqfLevel})
                </span>
              </div>
              <div>
                <span className="text-ink-muted block">संबंधित क्षेत्र (Sector):</span>
                <span className="text-xs font-medium text-ink mt-0.5 block">
                  {nsqf.sector}
                </span>
              </div>
              <div>
                <span className="text-ink-muted block">अनुमानित आय क्षमता:</span>
                <span className="text-xs font-semibold text-emerald-700 mt-0.5 block">
                  {nsqf.estimatedIncome}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobility Preference Badge */}
        <div className="card-flat bg-surface/50 border-line flex items-center space-x-3 p-3">
          <div className="w-8 h-8 rounded bg-trust/10 text-trust flex items-center justify-center shrink-0">
            <MapPinIcon size={18} color="#009378" />
          </div>
          <div className="text-xs">
            <span className="text-ink-muted block">कार्य स्थल वरीयता (Mobility Scope):</span>
            <span className="font-semibold text-ink text-sm">
              {profile.mobilityRadius}
            </span>
          </div>
        </div>
      </div>

      {/* Single Clear Action CTA per design.md §1 & §5: 8px radius rectangle */}
      <div className="mt-6 pt-4 border-t border-line">
        <button
          onClick={() => {
            speechService.stopSpeaking();
            setScreen('skilling-jobs');
          }}
          className="btn-primary w-full"
        >
          प्रशिक्षण केंद्र और नौकरियां देखें
        </button>
      </div>
    </div>
  );
};
