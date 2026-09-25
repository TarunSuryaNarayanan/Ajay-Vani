import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SpeakerIcon, DocumentIcon, CheckIcon } from '../components/Icons';
import { speechService } from '../services/speech';
import { generateBusinessProposalPDF } from '../services/pdfGenerator';

export const MicroFinanceScreen: React.FC = () => {
  const { currentResult, selectedDistrict, selectedLanguage, setScreen } = useApp();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);

  const profile = currentResult?.profile || {
    beneficiaryName: "रमेश कुमार",
    educationLevel: "8वीं पास",
    traditionalOccupation: "सोलर पीवी एवं बिजली कार्य",
    employmentPreference: "स्वरोजगार (Self-Employment)",
    mobilityRadius: "जिले के अंदर (15 किमी दायरा)"
  };

  const nsqf = currentResult?.recommendedNSQF || {
    qpCode: "ELE/Q5901",
    roleName: "Solar PV Installer & Electrician",
    roleNameHi: "सोलर पीवी इंस्टॉलर एवं तकनीशियन",
    nsqfLevel: 4,
    sector: "Green Jobs",
    matchScore: 92,
    estimatedIncome: "₹18,000 - ₹26,000 / माह"
  };

  const audioGuideText = `पीएम-अजय विशेष सहायता घटक के अंतर्गत अनुसूचित जाति के लाभार्थियों को स्वरोजगार शुरू करने हेतु अधिकतम ₹50,000 तक की प्रत्यक्ष सरकारी सब्सिडी (GIA) प्रदान की जाती है। शेष राशि मुद्रा योजना के तहत आसान किस्तों पर बैंक द्वारा स्वीकृत होती है। इसके लिए केवल आधार, जाति प्रमाण पत्र और हमारा यह 1-पृष्ठ प्रस्ताव ब्लॉक विकास अधिकारी (BDO) को जमा करना होता है।`;

  const handlePlayVoice = () => {
    speechService.speak(
      audioGuideText,
      selectedLanguage,
      () => setIsPlayingAudio(true),
      () => setIsPlayingAudio(false)
    );
  };

  const handleGeneratePDF = () => {
    setIsGeneratingPDF(true);
    setTimeout(() => {
      generateBusinessProposalPDF(profile, nsqf, selectedDistrict);
      setIsGeneratingPDF(false);
      setPdfGenerated(true);
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5">
      <div className="space-y-4">
        {/* Screen Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl text-ink">
              ऋण एवं ₹50,000 सरकारी सब्सिडी
            </h1>
            <p className="font-caption text-sm text-ink-muted mt-1">
              पीएम-अजय अनुदान (GIA) एवं मुद्रा ऋण सहायता
            </p>
          </div>
          <button
            onClick={handlePlayVoice}
            className={`w-11 h-11 rounded border flex items-center justify-center transition-colors ${
              isPlayingAudio ? 'bg-action text-white border-action' : 'bg-surface border-line text-trust'
            }`}
            aria-label="सब्सिडी की जानकारी सुनें"
          >
            <SpeakerIcon size={20} color={isPlayingAudio ? '#FFFFFF' : '#009378'} />
          </button>
        </div>

        {/* Audio Explanation Player Card */}
        <div className="card-flat bg-trust/5 border-trust/20 p-4">
          <div className="flex items-center space-x-2 text-trust text-xs font-semibold uppercase tracking-wider mb-2">
            <SpeakerIcon size={16} color="#009378" />
            <span>ऑडियो सहायता (Audio Scheme Guidance)</span>
          </div>
          <p className="text-sm font-medium text-ink leading-relaxed">
            "पीएम-अजय योजना में अनुसूचित जाति के उद्यमियों को मुद्रा ऋण के साथ अधिकतम <strong>₹50,000 की सीधी सरकारी सब्सिडी</strong> मिलती है।"
          </p>
          <button
            onClick={handlePlayVoice}
            className="mt-3 inline-flex items-center space-x-2 text-xs font-semibold text-trust hover:underline"
          >
            <span>{isPlayingAudio ? "रोकें (Stop Audio)" : "विस्तार से सुनें (Listen to Guide)"}</span>
          </button>
        </div>

        {/* Subsidy Calculation Breakdown Card */}
        <div className="card-flat bg-white border-line p-4 space-y-2.5">
          <span className="font-caption text-xs text-ink-muted uppercase font-bold tracking-wide block">
            अनुमानित परियोजना लागत एवं सहायता ढांचा:
          </span>
          
          <div className="flex items-center justify-between text-xs py-1 border-b border-line/60">
            <span className="text-ink-muted">कुल अनुमानित परियोजना लागत:</span>
            <span className="font-bold text-ink text-sm">₹1,50,000</span>
          </div>

          <div className="flex items-center justify-between text-xs py-1 border-b border-line/60">
            <span className="text-trust font-medium">पीएम-अजय सीधा सरकारी अनुदान (GIA):</span>
            <span className="font-bold text-trust text-sm">₹50,000 (निःशुल्क)</span>
          </div>

          <div className="flex items-center justify-between text-xs py-1 border-b border-line/60">
            <span className="text-ink-muted">बैंक मुद्रा ऋण (PMMY Shishu Loan):</span>
            <span className="font-bold text-ink text-sm">₹92,500</span>
          </div>

          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-ink-muted">लाभार्थी का स्वयं का अंशदान (5%):</span>
            <span className="font-bold text-ink text-sm">₹7,500</span>
          </div>
        </div>

        {/* 3-Step Process Checklist */}
        <div className="space-y-2">
          <span className="font-caption text-xs text-ink-muted uppercase font-semibold block">
            आवेदन के 3 सरल चरण (Step-by-Step Checklist):
          </span>

          <div className="card-flat bg-white border-line p-3 flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-trust/10 text-trust flex items-center justify-center shrink-0 mt-0.5">
              <CheckIcon size={14} color="#009378" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-ink block text-sm">चरण 1: पहचान सत्यापन</span>
              <p className="text-ink-muted mt-0.5">
                आधार कार्ड एवं वैध अनुसूचित जाति (SC) प्रमाण पत्र तैयार रखें।
              </p>
            </div>
          </div>

          <div className="card-flat bg-white border-line p-3 flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-trust/10 text-trust flex items-center justify-center shrink-0 mt-0.5">
              <CheckIcon size={14} color="#009378" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-ink block text-sm">चरण 2: 1-पृष्ठ व्यापार प्रस्ताव</span>
              <p className="text-ink-muted mt-0.5">
                नीचे दिए गए बटन से एआई-जनरेटेड आधिकारिक प्रस्ताव डाउनलोड करें।
              </p>
            </div>
          </div>

          <div className="card-flat bg-white border-line p-3 flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-trust/10 text-trust flex items-center justify-center shrink-0 mt-0.5">
              <CheckIcon size={14} color="#009378" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-ink block text-sm">चरण 3: बीडीओ कार्यालय में जमा</span>
              <p className="text-ink-muted mt-0.5">
                ग्राम सहायक या खंड विकास अधिकारी (BDO) को अनुमोदन हेतु प्रस्तुत करें।
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons: Generate PDF & Back to Home */}
      <div className="mt-6 pt-4 border-t border-line space-y-3">
        <button
          onClick={handleGeneratePDF}
          disabled={isGeneratingPDF}
          className="btn-primary w-full space-x-2"
        >
          <DocumentIcon size={20} color="#FFFFFF" />
          <span>
            {isGeneratingPDF 
              ? "दस्तावेज तैयार हो रहा है..." 
              : pdfGenerated 
              ? "प्रस्ताव बन गया (पुनः डाउनलोड करें)" 
              : "1-पृष्ठ व्यापार प्रस्ताव बनाएं (Generate PDF)"}
          </span>
        </button>

        <button
          onClick={() => setScreen('voice-chat')}
          className="btn-secondary w-full"
        >
          नई बातचीत शुरू करें
        </button>
      </div>
    </div>
  );
};
