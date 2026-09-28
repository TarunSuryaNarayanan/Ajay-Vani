import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { QRCodeIcon, SpeakerIcon } from '../Icons';
import { getGovText, formatGovText } from '../../services/governanceTranslations';
import { speechService } from '../../services/speech';

const QR_VOICE_EXPLANATIONS: Record<string, string> = {
  'hi-IN': 'यह आपका डिजिटल पंजीकरण टोकन है। इस QR कोड को प्रशिक्षण केंद्र के समन्वयक को दिखाएं। वे इसे स्कैन करके आपका नाम कोर्स में दर्ज कर देंगे। इसे अपने फोन पर सुरक्षित रखें।',
  'en-IN': 'This is your digital enrolment token. Show this QR code to the training centre coordinator. They will scan it to register you for the course. Keep it safe on your phone.',
  'ta-IN': 'இது உங்கள் டிஜிட்டல் பதிவு டோக்கன். இந்த QR குறியீட்டை பயிற்சி மையத்தின் ஒருங்கிணைப்பாளரிடம் காட்டுங்கள். அவர்கள் இதை ஸ்கேன் செய்து உங்களை பாடத்தில் பதிவு செய்வார்கள்.',
  'te-IN': 'ఇది మీ డిజిటల్ నమోదు టోకెన్. ఈ QR కోడ్‌ను శిక్షణ కేంద్రం సమన్వయకర్తకు చూపించండి. వారు దీన్ని స్కాన్ చేసి మీ పేరును కోర్సులో నమోదు చేస్తారు. దీన్ని మీ ఫోన్‌లో సురక్షితంగా ఉంచండి.',
  'mr-IN': 'हे तुमचे डिजिटल नोंदणी टोकन आहे. हा QR कोड प्रशिक्षण केंद्राच्या समन्वयकाला दाखवा. ते स्कॅन करून तुमचे नाव कोर्समध्ये नोंदवतील.',
  'bn-IN': 'এটি আপনার ডিজিটাল নথিভুক্তি টোকেন। এই QR কোডটি প্রশিক্ষণ কেন্দ্রের সমন্বয়কারীকে দেখান। তারা এটি স্ক্যান করে আপনাকে কোর্সে নথিভুক্ত করবে।',
  'bho-IN': 'ई आपका डिजिटल टोकन बा। एह QR कोड के प्रशिक्षण केंद्र के समन्वयक के देखाईं। उ लोग एके स्कैन करके रउवा के कोर्स में दर्ज कर देइहें।',
  'bun-IN': 'ई आपको डिजिटल टोकन है। एह QR कोड को केंद्र समन्वयक को दिखाओ। वो इसे स्कैन करके तुमको कोर्स में दर्ज कर देंगे।',
  'chg-IN': 'ए तुंहर डिजिटल टोकन आय। एह QR कोड ल केंद्र समन्वयक ल देखावव। ओ हर स्कैन करके तुंहला कोर्स म दर्ज कर देहीं।',
  'mai-IN': 'ई अहांक डिजिटल टोकन छी। एहि QR कोड के केंद्र समन्वयक के देखाबी। ओ एकरा स्कैन कए अहांक नाम कोर्समे दर्ज क देताह।',
};

export const QrTokenCard: React.FC = () => {
  const { qrToken, generateQRToken, admitToCourse, selectedLanguage } = useApp();
  const lang = selectedLanguage || 'hi-IN';
  const t = (key: string) => getGovText(lang, key);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [admitStatus, setAdmitStatus] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const voiceExplanation = QR_VOICE_EXPLANATIONS[lang] || QR_VOICE_EXPLANATIONS['hi-IN'];

  const playVoiceExplanation = () => {
    speechService.stopSpeaking();
    speechService.speak(
      voiceExplanation,
      lang,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  useEffect(() => {
    if (qrToken?.qrDataUrl && !qrDataUrl) {
      setQrDataUrl(qrToken.qrDataUrl);
      return;
    }

    if (!qrToken) {
      setIsGeneratingQR(true);
      generateQRToken()
        .then((token) => {
          if (token?.qrDataUrl) {
            setQrDataUrl(token.qrDataUrl);
            // Auto-play voice explanation when QR first appears
            setTimeout(() => {
              speechService.speak(
                voiceExplanation,
                lang,
                () => setIsSpeaking(true),
                () => setIsSpeaking(false)
              );
            }, 400);
          }
        })
        .finally(() => setIsGeneratingQR(false));
    }
  }, [qrToken]);

  const handleGenerate = async () => {
    setIsGeneratingQR(true);
    const token = await generateQRToken();
    if (token?.qrDataUrl) {
      setQrDataUrl(token.qrDataUrl);
      setTimeout(playVoiceExplanation, 400);
    }
    setIsGeneratingQR(false);
  };

  const handleAdmitToCourse = async () => {
    if (!qrToken) return;
    const result = await admitToCourse(qrToken.tokenId);
    setAdmitStatus(result.message || (result.success ? t('qrAdmitOk') : t('qrAdmitFail')));
  };

  return (
    <div className="card-flat bg-white border-line p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-trust text-xs font-semibold uppercase tracking-wider">
          <QRCodeIcon size={16} color="#009378" />
          <span>डिजिटल क्यूआर टोकन (Digital QR Token)</span>
        </div>
        {qrDataUrl && (
          <button
            onClick={playVoiceExplanation}
            className={`w-9 h-9 rounded border flex items-center justify-center transition-colors ${
              isSpeaking ? 'bg-action border-action' : 'bg-surface border-line text-trust hover:border-trust'
            }`}
            aria-label="QR के बारे में जानें"
          >
            <SpeakerIcon size={16} color={isSpeaking ? '#FFFFFF' : '#009378'} />
          </button>
        )}
      </div>

      {isGeneratingQR && <p className="text-xs text-ink-muted">{t('qrGenerating')}</p>}

      {qrDataUrl && (
        <div
          className="flex flex-col items-center space-y-3 cursor-pointer"
          onClick={playVoiceExplanation}
          title="टैप करें: QR के बारे में जानें"
        >
          <img
            src={qrDataUrl}
            alt="डिजिटल क्यूआर टोकन"
            className={`w-40 h-40 border-2 rounded bg-white transition-all ${
              isSpeaking ? 'border-action shadow-lg scale-105' : 'border-trust'
            }`}
          />
          <div className="text-center">
            <span className="text-xs text-ink-muted block">{t('qrTokenId')}</span>
            <span className="text-xs font-mono font-bold text-ink block mt-0.5 break-all">
              {qrToken?.tokenId}
            </span>
          </div>
          <div className="text-center text-xs text-trust font-medium flex items-center gap-1">
            <SpeakerIcon size={12} color="#009378" />
            <span>टैप करें — सुनें यह QR क्या है</span>
          </div>
          <div className="text-center text-xs text-ink-muted">
            <span>{t('qrScanHint')}</span>
          </div>
          {qrToken?.isUsed ? (
            <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
              ✅ {formatGovText(lang, 'qrAdmitted', qrToken.beneficiaryName)}
            </div>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); handleAdmitToCourse(); }} className="btn-primary w-full text-xs">
              {t('qrAdmit')}
            </button>
          )}
          {admitStatus && (
            <p className={`text-xs ${admitStatus.includes('सफल') || admitStatus.includes('successful') || admitStatus.includes('విజయ') || admitStatus.includes('வெற்றி') ? 'text-emerald-700' : 'text-alert'}`}>
              {admitStatus}
            </p>
          )}
        </div>
      )}

      {!qrDataUrl && !isGeneratingQR && (
        <button onClick={handleGenerate} className="btn-secondary w-full space-x-2 text-xs">
          <QRCodeIcon size={16} color="#009378" />
          <span>{t('qrGenerate')}</span>
        </button>
      )}
    </div>
  );
};
