import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  SpeakerIcon, 
  DocumentIcon, 
  CheckIcon, 
  GraduationCapIcon, 
  MapPinIcon,
  QRCodeIcon
} from '../components/Icons';
import { speechService } from '../services/speech';
import { generateBusinessProposalPDF } from '../services/pdfGenerator';
import { GrievanceReporter } from '../components/Governance/GrievanceReporter';
import { LifecycleNudgePanel } from '../components/Governance/LifecycleNudgePanel';
import {
  daysSinceCompletion,
  daysUntilPostTraining,
  formatPostTrainingElapsed,
} from '../services/governance';
import QRCode from 'qrcode';

export const BeneficiaryDashboardScreen: React.FC = () => {
  const { 
    aadhaarSession, 
    currentResult, 
    selectedDistrict, 
    selectedLanguage, 
    setScreen, 
    logoutAadhaar,
    qrToken,
    generateQRToken,
    admitToCourse,
    completeCourse,
    simulatePostTrainingWindow,
    resetGovernanceState
  } = useApp();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [admitStatus, setAdmitStatus] = useState<string | null>(null);
  const [completionStatus, setCompletionStatus] = useState<string | null>(null);

  const completedAt = aadhaarSession?.completedAt ?? null;
  const elapsedDays = daysSinceCompletion(completedAt);
  const daysRemaining = daysUntilPostTraining(aadhaarSession);

  const profile = currentResult?.profile || {
    beneficiaryName: aadhaarSession?.beneficiaryName || "रमेश कुमार",
    educationLevel: "8वीं पास",
    traditionalOccupation: "सोलर पीवी एवं बिजली कार्य",
    employmentPreference: "स्वरोजगार (Self-Employment)",
    mobilityRadius: "जिले के अंदर (15 किमी)"
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

  const dashboardAudioText = `नमस्ते ${profile.beneficiaryName} जी! आपका आधार सत्यापन सफल रहा। आपके 50,000 रुपये के पीएम-अजय अनुदान का प्रस्ताव बीडीओ कार्यालय में प्रक्रियाधीन है। प्रशिक्षण केंद्र में आपकी 30 दिनों की उपस्थिति दर्ज है और 4,500 रुपये का भोजन भत्ता आपके बैंक खाते में स्थानांतरित किया जा रहा है।`;

  const handlePlayVoice = () => {
    speechService.speak(
      dashboardAudioText,
      selectedLanguage,
      () => setIsPlayingAudio(true),
      () => setIsPlayingAudio(false)
    );
  };

  const handleDownloadPDF = () => {
    setIsDownloadingPDF(true);
    setTimeout(() => {
      generateBusinessProposalPDF(profile, nsqf, selectedDistrict);
      setIsDownloadingPDF(false);
    }, 500);
  };

  // Fix #8: Auto-generate QR token on dashboard load
  useEffect(() => {
    if (aadhaarSession && currentResult && !qrToken) {
      setIsGeneratingQR(true);
      generateQRToken()
        .then((token) => {
          if (token) {
            const payload = JSON.stringify({
              tokenId: token.tokenId,
              beneficiaryName: token.beneficiaryName,
              aadhaarMasked: token.aadhaarMasked,
              nsqfQpCode: token.nsqfQpCode,
              nsqfRoleNameHi: token.nsqfRoleNameHi,
              district: token.district,
              generatedAt: token.generatedAt,
            });
            QRCode.toDataURL(payload, {
              errorCorrectionLevel: 'M',
              width: 256,
              margin: 2,
              color: { dark: '#000000', light: '#FFFFFF' },
            }).then(setQrDataUrl);
          }
        })
        .finally(() => setIsGeneratingQR(false));
    } else if (qrToken && !qrDataUrl) {
      const payload = JSON.stringify({
        tokenId: qrToken.tokenId,
        beneficiaryName: qrToken.beneficiaryName,
        aadhaarMasked: qrToken.aadhaarMasked,
        nsqfQpCode: qrToken.nsqfQpCode,
        nsqfRoleNameHi: qrToken.nsqfRoleNameHi,
        district: qrToken.district,
        generatedAt: qrToken.generatedAt,
      });
      QRCode.toDataURL(payload, {
        errorCorrectionLevel: 'M',
        width: 256,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      }).then(setQrDataUrl);
    }
  }, [aadhaarSession, currentResult, qrToken]);

  const handleAdmitToCourse = async () => {
    if (!qrToken) return;
    const result = await admitToCourse(qrToken.tokenId);
    setAdmitStatus(result.message || (result.success ? 'प्रवेश सफल' : 'प्रवेश असफल'));
  };

  const handleCompleteCourse = async () => {
    const result = await completeCourse();
    setCompletionStatus(result.message);
    speechService.speak(result.message, selectedLanguage);
  };

  const handleSimulateDay90 = async () => {
    await simulatePostTrainingWindow();
    setCompletionStatus('डेमो: 90 दिन की अवधि पूरी मान ली गई। प्रशिक्षणोत्तर मार्गदर्शन अब खुला है।');
  };

  const handleResetDemo = () => {
    resetGovernanceState();
    setCompletionStatus('डेमो स्थिति रीसेट कर दी गई। प्रशिक्षण फिर से "जारी" अवस्था में है।');
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5 space-y-4">
      <div className="space-y-4">
        {/* Dashboard Title & Voice Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl text-ink">
              व्यक्तिगत लाभार्थी डैशबोर्ड
            </h1>
            <p className="font-caption text-sm text-ink-muted mt-0.5">
              पीएम-अजय विशेष सहायता एवं वजीफा ट्रैकर
            </p>
          </div>
          <button
            onClick={handlePlayVoice}
            className={`w-11 h-11 rounded border flex items-center justify-center transition-colors ${
              isPlayingAudio ? 'bg-action text-white border-action' : 'bg-surface border-line text-trust'
            }`}
            aria-label="डैशबोर्ड स्थिति सुनें"
          >
            <SpeakerIcon size={20} color={isPlayingAudio ? '#FFFFFF' : '#009378'} />
          </button>
        </div>

        {/* Profile Card */}
        <div className="card-flat bg-white border-line p-4 space-y-3">
          <div className="flex items-start justify-between border-b border-line/60 pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-full bg-trust/10 border border-trust/30 text-trust flex items-center justify-center font-bold text-lg">
                👤
              </div>
              <div>
                <h2 className="font-bold text-base text-ink leading-tight">
                  {aadhaarSession?.beneficiaryName || profile.beneficiaryName}
                </h2>
                <div className="flex items-center space-x-2 mt-0.5 text-xs text-ink-muted">
                  <span className="font-mono bg-surface border border-line px-1.5 py-0.5 rounded text-[11px]">
                    {aadhaarSession?.maskedAadhaar || 'XXXX XXXX 7777'}
                  </span>
                  <span className="flex items-center text-trust font-semibold">
                    <MapPinIcon size={12} color="#009378" />
                    <span className="ml-0.5">{selectedDistrict}, UP</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-bold">
              <CheckIcon size={13} color="#064e3b" />
              <span>अनुसूचित जाति (SC) सब्सिडी पात्र</span>
            </div>
            <span className="text-ink-muted text-[11px]">आधार सत्यापन: <strong>सफल (Verified)</strong></span>
          </div>
        </div>

        {/* active Trade Match */}
        <div className="card-flat bg-surface/80 border-line p-3.5 space-y-2">
          <div className="flex items-center space-x-2 text-trust text-xs font-semibold uppercase tracking-wider">
            <GraduationCapIcon size={16} color="#009378" />
            <span>सक्रिय NSQF ट्रेड (Assigned Qualification)</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-ink">{nsqf.roleNameHi}</h3>
              <p className="text-xs text-ink-muted">{nsqf.qpCode} • NSQF लेवल {nsqf.nsqfLevel}</p>
            </div>
            <span className="bg-trust text-surface text-xs font-bold px-2 py-1 rounded">
              {nsqf.matchScore}% मैच
            </span>
          </div>
        </div>

        {/* ₹50,000 PM-AJAY GIA Grant Tracker */}
        <div className="card-flat bg-white border-line p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-line/60 pb-2">
            <span className="font-caption text-xs uppercase font-bold tracking-wide text-ink">
              💰 ₹50,000 पीएम-अजय अनुदान स्थिति (Grant Tracker)
            </span>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              बीडीओ स्तर पर लंबित
            </span>
          </div>

          {/* 4-Step Live Visual Timeline */}
          <div className="space-y-3 pt-1">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs">
                ✓
              </div>
              <div className="text-xs">
                <span className="font-bold text-ink block">चरण 1: वॉयस प्रोफाइलिंग संपन्न</span>
                <span className="text-ink-muted text-[11px]">एआई द्वारा NSQF ट्रेड एवं पात्रता निर्धारित</span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs">
                ✓
              </div>
              <div className="text-xs">
                <span className="font-bold text-ink block">चरण 2: 1-पृष्ठ व्यापार प्रस्ताव निर्मित</span>
                <span className="text-ink-muted text-[11px]">माइक्रो-एंटरप्राइज GIA दस्तावेज तैयार</span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                ⏳
              </div>
              <div className="text-xs">
                <span className="font-bold text-amber-900 block">चरण 3: बीडीओ सरकारी अनुदान स्वीकृति</span>
                <span className="text-amber-800 text-[11px]">खंड विकास अधिकारी (BDO) द्वारा भौतिक सत्यापन जारी</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 opacity-50">
              <div className="w-5 h-5 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                4
              </div>
              <div className="text-xs">
                <span className="font-bold text-ink block">चरण 4: मुद्रा बैंक ऋण एवं सब्सिडी वितरण</span>
                <span className="text-ink-muted text-[11px]">₹50,000 GIA अनुदान खाता हस्तांतरण</span>
              </div>
            </div>
          </div>
        </div>

        {/* Training Center Stipend Tracker */}
        <div className="card-flat bg-trust/5 border-trust/20 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-caption text-xs font-bold text-trust uppercase">
              🏫 प्रशिक्षण केंद्र दैनिक वजीफा (Stipend Tracker)
            </span>
            <span className="text-xs font-bold text-trust bg-trust/10 px-2 py-0.5 rounded">
              ₹150 / दिन
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="bg-white border border-line rounded p-2 text-center">
              <span className="text-ink-muted text-[11px] block">कुल उपस्थिति:</span>
              <strong className="text-base text-ink block mt-0.5">30 / 30 दिन</strong>
            </div>
            <div className="bg-white border border-line rounded p-2 text-center">
              <span className="text-ink-muted text-[11px] block">अर्जित भोजन व यात्रा भत्ता:</span>
              <strong className="text-base text-trust block mt-0.5">₹4,500</strong>
            </div>
          </div>
        </div>

        {/* 1-Click Proposal PDF Re-download */}
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloadingPDF}
          className="btn-primary w-full space-x-2"
        >
          <DocumentIcon size={18} color="#FFFFFF" />
          <span>
            {isDownloadingPDF ? "दस्तावेज़ डाउनलोड हो रहा है..." : "1-पृष्ठ व्यापार प्रस्ताव पुनः डाउनलोड करें"}
          </span>
        </button>

        {/* F1 · Grievance Redressal */}
        <GrievanceReporter />

        {/* F2 · WhatsApp Lifecycle Nudges */}
        <LifecycleNudgePanel />

        {/* F3 · Training completion → Post-Course AI Guidance */}
        <div className="card-flat bg-white border-line p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-caption text-xs text-trust uppercase font-bold">
              🎓 प्रशिक्षण पूर्णता एवं पोस्ट-कोर्स मार्गदर्शन
            </span>
            {aadhaarSession?.courseCompleted && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                प्रशिक्षण पूर्ण
              </span>
            )}
          </div>

          {!aadhaarSession?.courseCompleted ? (
            <>
              <p className="text-xs text-ink-muted leading-relaxed">
                कोर्स पूरा होने पर यहाँ "प्रशिक्षण पूर्ण" दर्ज करें। दर्ज करने के 90 दिन बाद प्रशिक्षणोत्तर
                एआई मार्गदर्शन (स्वरोजगार / नौकरी / मुद्रा ऋण) अपने आप खुल जाएगा।
              </p>
              <button onClick={handleCompleteCourse} className="btn-primary w-full text-xs">
                प्रशिक्षण पूर्ण दर्ज करें (Complete Training)
              </button>
            </>
          ) : (
            <>
              <div className="text-xs text-ink-muted space-y-1">
                <p>
                  पूर्णता तिथि:{' '}
                  <strong className="text-ink">
                    {completedAt ? new Date(completedAt).toLocaleDateString('hi-IN') : '—'}
                  </strong>
                </p>
                <p>
                  अवधि: <strong className="text-ink">{elapsedDays !== null ? formatPostTrainingElapsed(elapsedDays) : '—'}</strong>
                </p>
              </div>

              {daysRemaining > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2.5 py-2">
                    पोस्ट-कोर्स मार्गदर्शन हेतु अभी {daysRemaining} दिन शेष हैं (कुल 90 दिन)।
                  </div>
                  <button onClick={handleSimulateDay90} className="btn-secondary w-full text-[11px]">
                    डेमो: दिन 90 सिम्युलेट करें
                  </button>
                </div>
              ) : (
                <button onClick={() => setScreen('post-training-guidance')} className="btn-primary w-full text-xs">
                  प्रशिक्षणोत्तर एआई मार्गदर्शन शुरू करें →
                </button>
              )}
            </>
          )}

          {completionStatus && <p className="text-[11px] text-trust">{completionStatus}</p>}

          {aadhaarSession?.courseCompleted && (
            <button onClick={handleResetDemo} className="w-full text-[11px] text-ink-muted hover:underline">
              डेमो स्थिति रीसेट करें (प्रशिक्षण जारी करें)
            </button>
          )}
        </div>
      </div>

      {/* Fix #8: Digital QR Token Display for Paperless Enrollment */}
      <div className="mt-6 pt-4 border-t border-line space-y-3">
        <div className="card-flat bg-white border-line p-4">
          <div className="flex items-center space-x-2 text-trust text-xs font-semibold uppercase tracking-wider mb-3">
            <QRCodeIcon size={16} color="#009378" />
            <span>डिजिटल क्यूआर टोकन (Digital QR Token)</span>
          </div>

          {isGeneratingQR && (
            <p className="text-xs text-ink-muted">टोकन जेनरेट हो रहा है...</p>
          )}

          {qrDataUrl && (
            <div className="flex flex-col items-center space-y-3">
              <img src={qrDataUrl} alt="डिजिटल क्यूआर टोकन" className="w-40 h-40 border border-line rounded" />
              <div className="text-center">
                <span className="text-xs text-ink-muted block">टोकन ID:</span>
                <span className="text-xs font-mono font-bold text-ink block mt-0.5">
                  {qrToken?.tokenId}
                </span>
              </div>
              <div className="text-center text-xs text-ink-muted">
                <span>केंद्र समन्वयक इसे स्कैन करके सत्यापन करें</span>
              </div>
              {qrToken?.isUsed && (
                <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
                  ✅ {qrToken.beneficiaryName} को कोर्स में प्रवेश दे दिया गया है
                </div>
              )}
              {!qrToken?.isUsed && (
                <button
                  onClick={handleAdmitToCourse}
                  className="btn-primary w-full text-xs"
                >
                  कोर्स में प्रवेश दें (Admit to Course)
                </button>
              )}
              {admitStatus && (
                <p className={`text-xs ${admitStatus.includes('सफल') ? 'text-emerald-700' : 'text-alert'}`}>
                  {admitStatus}
                </p>
              )}
            </div>
          )}

          {!qrDataUrl && !isGeneratingQR && (
            <button
              onClick={async () => {
                const token = await generateQRToken();
                if (token) {
                  const payload = JSON.stringify({
                    tokenId: token.tokenId,
                    beneficiaryName: token.beneficiaryName,
                    aadhaarMasked: token.aadhaarMasked,
                    nsqfQpCode: token.nsqfQpCode,
                    nsqfRoleNameHi: token.nsqfRoleNameHi,
                    district: token.district,
                    generatedAt: token.generatedAt,
                  });
                  const dataUrl = await QRCode.toDataURL(payload, {
                    errorCorrectionLevel: 'M',
                    width: 256,
                    margin: 2,
                  });
                  setQrDataUrl(dataUrl);
                }
              }}
              className="btn-secondary w-full space-x-2 text-xs"
            >
              <QRCodeIcon size={16} color="#009378" />
              <span>क्यूआर टोकन जेनरेट करें</span>
            </button>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
        <div className="mt-4 pt-3 border-t border-line space-y-2">
          <button
            onClick={() => setScreen('voice-chat')}
            className="btn-secondary w-full text-xs font-bold"
          >
            नया वॉयस इंटरव्यू / सहायता शुरू करें
          </button>

        <button
          onClick={logoutAadhaar}
          className="w-full py-2 text-center text-xs font-bold text-alert hover:underline"
        >
          डैशबोर्ड से लॉगआउट करें (Logout)
        </button>
      </div>
    </div>
  );
};
