import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { BriefcaseIcon, MapPinIcon, SpeakerIcon } from '../components/Icons';
import { speechService } from '../services/speech';
import { LanguageCode } from '../types';

// ── i18n label map ────────────────────────────────────────────────────────────
const LABELS: Record<string, Record<string, string>> = {
  'en-IN': {
    title: 'Skill Profile & Certification',
    subtitle: 'Official profile prepared from your conversation',
    spokenBg: 'Spoken Background',
    education: 'Education',
    category: 'Category',
    sc: 'Scheduled Caste (SC)',
    recommended: 'Recommended National Skill Qualification (NSQF)',
    demandMatch: 'Demand Match',
    qpCode: 'Govt. QP Code:',
    nsqfLevel: 'NSQF Level:',
    level: 'Level',
    sector: 'Sector:',
    income: 'Estimated Income:',
    mobility: 'Work Location Preference (Mobility Scope):',
    cta: 'View Training Centres & Jobs',
  },
  'hi-IN': {
    title: 'कौशल प्रोफ़ाइल एवं प्रमाणन',
    subtitle: 'आपकी बातचीत के आधार पर तैयार आधिकारिक प्रोफ़ाइल',
    spokenBg: 'दर्ज अनुभव (Spoken Background)',
    education: 'शिक्षा',
    category: 'श्रेणी',
    sc: 'अनुसूचित जाति (SC)',
    recommended: 'अनुशंसित राष्ट्रीय कौशल योग्यता (NSQF)',
    demandMatch: 'मांग मेल',
    qpCode: 'सरकारी क्यूपी कोड (QP Code):',
    nsqfLevel: 'योग्यता स्तर (NSQF Level):',
    level: 'लेवल',
    sector: 'संबंधित क्षेत्र (Sector):',
    income: 'अनुमानित आय क्षमता:',
    mobility: 'कार्य स्थल वरीयता (Mobility Scope):',
    cta: 'प्रशिक्षण केंद्र और नौकरियां देखें',
  },
  'te-IN': {
    title: 'నైపుణ్య ప్రొఫైల్ & సర్టిఫికేషన్',
    subtitle: 'మీ సంభాషణ ఆధారంగా తయారు చేయబడిన అధికారిక ప్రొఫైల్',
    spokenBg: 'మాట్లాడిన నేపథ్యం',
    education: 'విద్య',
    category: 'వర్గం',
    sc: 'షెడ్యూల్డ్ కులం (SC)',
    recommended: 'సిఫార్సు చేయబడిన జాతీయ నైపుణ్య అర్హత (NSQF)',
    demandMatch: 'డిమాండ్ మ్యాచ్',
    qpCode: 'ప్రభుత్వ QP కోడ్:',
    nsqfLevel: 'NSQF స్థాయి:',
    level: 'స్థాయి',
    sector: 'రంగం:',
    income: 'అంచనా ఆదాయం:',
    mobility: 'పని స్థాన ప్రాధాన్యత:',
    cta: 'శిక్షణ కేంద్రాలు & ఉద్యోగాలు చూడండి',
  },
  'ta-IN': {
    title: 'திறன் சுயவிவரம் & சான்றிதழ்',
    subtitle: 'உங்கள் உரையாடலின் அடிப்படையில் தயாரிக்கப்பட்ட அதிகாரப்பூர்வ சுயவிவரம்',
    spokenBg: 'பேசிய பின்னணி',
    education: 'கல்வி',
    category: 'வகை',
    sc: 'தாழ்த்தப்பட்ட சாதி (SC)',
    recommended: 'பரிந்துரைக்கப்பட்ட தேசிய திறன் தகுதி (NSQF)',
    demandMatch: 'தேவை பொருத்தம்',
    qpCode: 'அரசு QP குறியீடு:',
    nsqfLevel: 'NSQF நிலை:',
    level: 'நிலை',
    sector: 'துறை:',
    income: 'மதிப்பிடப்பட்ட வருமானம்:',
    mobility: 'பணி இட விருப்பம்:',
    cta: 'பயிற்சி மையங்கள் & வேலைகள் காண்க',
  },
  'mr-IN': {
    title: 'कौशल्य प्रोफाइल आणि प्रमाणपत्र',
    subtitle: 'तुमच्या संभाषणाच्या आधारे तयार केलेली अधिकृत प्रोफाइल',
    spokenBg: 'सांगितलेला पार्श्वभूमी',
    education: 'शिक्षण',
    category: 'श्रेणी',
    sc: 'अनुसूचित जाती (SC)',
    recommended: 'शिफारस केलेली राष्ट्रीय कौशल्य पात्रता (NSQF)',
    demandMatch: 'मागणी जुळणी',
    qpCode: 'सरकारी QP कोड:',
    nsqfLevel: 'NSQF पातळी:',
    level: 'पातळी',
    sector: 'क्षेत्र:',
    income: 'अंदाजित उत्पन्न:',
    mobility: 'कामाचे ठिकाण पसंती:',
    cta: 'प्रशिक्षण केंद्रे आणि नोकऱ्या पहा',
  },
  'bn-IN': {
    title: 'দক্ষতা প্রোফাইল এবং সার্টিফিকেশন',
    subtitle: 'আপনার কথোপকথনের ভিত্তিতে তৈরি অফিসিয়াল প্রোফাইল',
    spokenBg: 'কথ্য পটভূমি',
    education: 'শিক্ষা',
    category: 'বিভাগ',
    sc: 'তপশিলি জাতি (SC)',
    recommended: 'প্রস্তাবিত জাতীয় দক্ষতা যোগ্যতা (NSQF)',
    demandMatch: 'চাহিদা মিল',
    qpCode: 'সরকারি QP কোড:',
    nsqfLevel: 'NSQF স্তর:',
    level: 'স্তর',
    sector: 'ক্ষেত্র:',
    income: 'আনুমানিক আয়:',
    mobility: 'কাজের স্থান পছন্দ:',
    cta: 'প্রশিক্ষণ কেন্দ্র এবং চাকরি দেখুন',
  },
  'bho-IN': {
    title: 'कौशल प्रोफाइल एवं प्रमाणपत्र',
    subtitle: 'आपके बातचीत के आधार पर तैयार आधिकारिक प्रोफाइल',
    spokenBg: 'दर्ज अनुभव',
    education: 'शिक्षा',
    category: 'श्रेणी',
    sc: 'अनुसूचित जाति (SC)',
    recommended: 'अनुशंसित राष्ट्रीय कौशल योग्यता (NSQF)',
    demandMatch: 'मांग मेल',
    qpCode: 'सरकारी QP कोड:',
    nsqfLevel: 'योग्यता स्तर (NSQF Level):',
    level: 'लेवल',
    sector: 'संबंधित क्षेत्र:',
    income: 'अनुमानित आय:',
    mobility: 'कार्य स्थल वरीयता:',
    cta: 'प्रशिक्षण केंद्र और नौकरियां देखीं',
  },
  'mai-IN': {
    title: 'कौशल प्रोफाइल एवं प्रमाणपत्र',
    subtitle: 'अहांक बातचीत के आधार पर तैयार आधिकारिक प्रोफाइल',
    spokenBg: 'दर्ज अनुभव',
    education: 'शिक्षा',
    category: 'श्रेणी',
    sc: 'अनुसूचित जाति (SC)',
    recommended: 'अनुशंसित राष्ट्रीय कौशल योग्यता (NSQF)',
    demandMatch: 'मांग मेल',
    qpCode: 'सरकारी QP कोड:',
    nsqfLevel: 'योग्यता स्तर (NSQF Level):',
    level: 'लेवल',
    sector: 'संबंधित क्षेत्र:',
    income: 'अनुमानित आय:',
    mobility: 'कार्य स्थल वरीयता:',
    cta: 'प्रशिक्षण केंद्र और नौकरियां देखीं',
  },
  'bun-IN': {
    title: 'कौशल प्रोफाइल एवं प्रमाणपत्र',
    subtitle: 'आपके बातचीत के आधार पर तैयार आधिकारिक प्रोफाइल',
    spokenBg: 'दर्ज अनुभव',
    education: 'शिक्षा',
    category: 'श्रेणी',
    sc: 'अनुसूचित जाति (SC)',
    recommended: 'अनुशंसित राष्ट्रीय कौशल योग्यता (NSQF)',
    demandMatch: 'मांग मेल',
    qpCode: 'सरकारी QP कोड:',
    nsqfLevel: 'योग्यता स्तर (NSQF Level):',
    level: 'लेवल',
    sector: 'संबंधित क्षेत्र:',
    income: 'अनुमानित आय:',
    mobility: 'कार्य स्थल वरीयता:',
    cta: 'प्रशिक्षण केंद्र और नौकरियां देखो',
  },
  'chg-IN': {
    title: 'कौशल प्रोफाइल एवं प्रमाणपत्र',
    subtitle: 'आपके बातचीत के आधार पर तैयार आधिकारिक प्रोफाइल',
    spokenBg: 'दर्ज अनुभव',
    education: 'शिक्षा',
    category: 'श्रेणी',
    sc: 'अनुसूचित जाति (SC)',
    recommended: 'अनुशंसित राष्ट्रीय कौशल योग्यता (NSQF)',
    demandMatch: 'मांग मेल',
    qpCode: 'सरकारी QP कोड:',
    nsqfLevel: 'योग्यता स्तर (NSQF Level):',
    level: 'लेवल',
    sector: 'संबंधित क्षेत्र:',
    income: 'अनुमानित आय:',
    mobility: 'कार्य स्थल वरीयता:',
    cta: 'प्रशिक्षण केंद्र और नौकरियां देखीं',
  },
};

function t(lang: LanguageCode, key: string): string {
  return LABELS[lang]?.[key] ?? LABELS['hi-IN'][key] ?? key;
}

export const NSQFProfileScreen: React.FC = () => {
  const { currentResult, selectedLanguage, setScreen } = useApp();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const lang = selectedLanguage as LanguageCode;

  const profile = currentResult?.profile || {
    beneficiaryName: "Ramesh Kumar",
    educationLevel: "Class 8",
    traditionalOccupation: "Traditional Work: Electrical & Tractor Repair",
    employmentPreference: "Self-Employment",
    mobilityRadius: "Within District (15 km radius)"
  };

  const nsqf = currentResult?.recommendedNSQF || {
    qpCode: "ELE/Q5901",
    roleName: "Solar PV Installer & Electrician",
    roleNameHi: "Solar PV Installer & Electrician",
    nsqfLevel: 4,
    sector: "Renewable Energy (Green Jobs)",
    matchScore: 92,
    estimatedIncome: "₹18,000 - ₹26,000 / month"
  };

  // Use the language-appropriate role name: for Hindi/Indic dialects use roleNameHi, else roleName
  const displayRoleName = ['hi-IN','bho-IN','bun-IN','chg-IN','mai-IN'].includes(lang)
    ? (nsqf.roleNameHi || nsqf.roleName)
    : nsqf.roleName;

  const spokenSummary = currentResult?.friendlyAudioResponse || `${profile.beneficiaryName}, ${nsqf.roleName} has been recommended for you. QP Code ${nsqf.qpCode}, demand match ${nsqf.matchScore}%.`;

  useEffect(() => {
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
              {t(lang, 'title')}
            </h1>
            <p className="font-caption text-sm text-ink-muted mt-1">
              {t(lang, 'subtitle')}
            </p>
          </div>
          <button
            onClick={handlePlayVoice}
            className={`w-11 h-11 rounded border flex items-center justify-center transition-colors ${
              isPlayingAudio ? 'bg-action text-white border-action' : 'bg-surface border-line text-trust'
            }`}
            aria-label="Listen to profile"
          >
            <SpeakerIcon size={20} color={isPlayingAudio ? '#FFFFFF' : '#009378'} />
          </button>
        </div>

        {/* Informal Experience Badge */}
        <div className="card-flat bg-surface/70 border-line">
          <div className="flex items-center space-x-2 text-ink-muted text-xs mb-1">
            <BriefcaseIcon size={16} color="#009378" />
            <span className="font-medium">{t(lang, 'spokenBg')}</span>
          </div>
          <p className="text-base font-semibold text-ink">
            {profile.traditionalOccupation}
          </p>
          <div className="flex items-center space-x-4 mt-2 text-xs text-ink-muted">
            <span>{t(lang, 'education')}: <strong className="text-ink">{profile.educationLevel}</strong></span>
            <span>{t(lang, 'category')}: <strong className="text-ink">{t(lang, 'sc')}</strong></span>
          </div>
        </div>

        {/* Matched Official NSQF Role Card */}
        <div className="card-flat border-line relative overflow-hidden bg-white">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <span className="text-xs font-semibold text-trust bg-trust/10 px-2.5 py-1 rounded">
              {t(lang, 'recommended')}
            </span>
            <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded text-xs font-bold">
              <span>{nsqf.matchScore}% {t(lang, 'demandMatch')}</span>
            </div>
          </div>

          <div className="pt-3">
            <h2 className="text-xl font-bold text-ink leading-snug">
              {displayRoleName}
            </h2>
            <p className="text-xs text-ink-muted font-normal mt-0.5">
              {nsqf.roleName}
            </p>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-line text-xs">
              <div>
                <span className="text-ink-muted block">{t(lang, 'qpCode')}</span>
                <span className="font-mono text-sm font-bold text-ink mt-0.5 block">
                  {nsqf.qpCode}
                </span>
              </div>
              <div>
                <span className="text-ink-muted block">{t(lang, 'nsqfLevel')}</span>
                <span className="text-sm font-bold text-ink mt-0.5 block">
                  {t(lang, 'level')} {nsqf.nsqfLevel}
                </span>
              </div>
              <div>
                <span className="text-ink-muted block">{t(lang, 'sector')}</span>
                <span className="text-xs font-medium text-ink mt-0.5 block">
                  {nsqf.sector}
                </span>
              </div>
              <div>
                <span className="text-ink-muted block">{t(lang, 'income')}</span>
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
            <span className="text-ink-muted block">{t(lang, 'mobility')}</span>
            <span className="font-semibold text-ink text-sm">
              {profile.mobilityRadius}
            </span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6 pt-4 border-t border-line">
        <button
          onClick={() => {
            speechService.stopSpeaking();
            setScreen('skilling-jobs');
          }}
          className="btn-primary w-full"
        >
          {t(lang, 'cta')}
        </button>
      </div>
    </div>
  );
};
