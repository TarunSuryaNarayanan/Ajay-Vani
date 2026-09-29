import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SpeakerIcon, MicIcon } from '../components/Icons';
import { speechService } from '../services/speech';
import { getAadhaarText } from '../services/translations';

export const AadhaarLoginScreen: React.FC = () => {
  const { submitAadhaarNumber, loginDemoBeneficiary, selectedLanguage } = useApp();
  const [aadhaarInput, setAadhaarInput] = useState<string>('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);

  const t = (key: string) => getAadhaarText(selectedLanguage || 'hi-IN', key);

  const guideText = t('aadhaarPrompt');

  const handlePlayVoice = () => {
    speechService.speak(
      guideText,
      selectedLanguage,
      () => setIsPlayingAudio(true),
      () => setIsPlayingAudio(false)
    );
  };

  useEffect(() => {
    handlePlayVoice();
    return () => speechService.stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyPress = (val: string) => {
    if (aadhaarInput.length < 12) {
      setAadhaarInput(prev => prev + val);
    }
  };

  const handleBackspace = () => {
    setAadhaarInput(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setAadhaarInput('');
  };

  const handleVoiceInput = () => {
    console.log('[AadhaarScreen] Mic button clicked! isListeningVoice=', isListeningVoice, '| lang=', selectedLanguage);
    if (isListeningVoice) {
      speechService.stopDirectListening();
      setIsListeningVoice(false);
      return;
    }

    setIsListeningVoice(true);
    const initialInput = aadhaarInput;
    speechService.recognizeDirectly(
      selectedLanguage || 'hi-IN',
      (transcript, isFinal) => {
        // Convert common spoken words and native digits to Arabic numerals for supported languages
        const map: Record<string, string> = {
          // English & Hindi
          'zero': '0', 'शून्य': '0', 'सुन्ना': '0', '०': '0',
          'one': '1', 'एक': '1', '१': '1',
          'two': '2', 'दो': '2', '२': '2',
          'three': '3', 'तीन': '3', '३': '3',
          'four': '4', 'चार': '4', '४': '4',
          'five': '5', 'पांच': '5', 'पाँच': '5', '५': '5',
          'six': '6', 'छह': '6', 'छै': '6', '६': '6',
          'seven': '7', 'सात': '7', '७': '7',
          'eight': '8', 'आठ': '8', '८': '8',
          'nine': '9', 'नौ': '9', '९': '9',
          
          // Telugu
          'సున్నా': '0', '౦': '0',
          'ఒకటి': '1', '౧': '1',
          'రెండు': '2', '౨': '2',
          'మూడు': '3', '౩': '3',
          'నాలుగు': '4', '౪': '4',
          'ఐదు': '5', '౫': '5',
          'ఆరు': '6', '౬': '6',
          'ఏడు': '7', '౭': '7',
          'ఎనిమిది': '8', '౮': '8',
          'తొమ్మిది': '9', '౯': '9',
          
          // Tamil
          'சுழியம்': '0', 'பூஜ்ஜியம்': '0', '௦': '0',
          'ஒன்று': '1', '௧': '1',
          'இரண்டு': '2', '௨': '2',
          'மூன்று': '3', '௩': '3',
          'நான்கு': '4', '௪': '4',
          'ஐந்து': '5', '௫': '5',
          'ஆறு': '6', '௬': '6',
          'ஏழு': '7', '௭': '7',
          'எட்டு': '8', '௮': '8',
          'ஒன்பது': '9', '௯': '9',
          
          // Bengali
          'শূন্য': '0', '০': '0',
          'এক': '1', '১': '1',
          'দুই': '2', '২': '2',
          'তিন': '3', '৩': '3',
          'চার': '4', '৪': '4',
          'পাঁচ': '5', '৫': '5',
          'ছয়': '6', '৬': '6',
          'সাত': '7', '৭': '7',
          'আট': '8', '৮': '8',
          'নয়': '9', '৯': '9',
          
          // Marathi specific (others share with Hindi)
          'दोन': '2',
          'पाच': '5',
          'सहा': '6',
          'नऊ': '9'
        };
        let parsed = transcript.toLowerCase();
        Object.keys(map).forEach(key => {
          parsed = parsed.split(key).join(map[key]);
        });
        
        const digits = parsed.replace(/\D/g, '');
        if (digits) {
          setAadhaarInput((initialInput + digits).slice(0, 12));
        }
      },
      (error) => {
        console.warn('Voice input error:', error);
      },
      () => {
        setIsListeningVoice(false);
      },
      true // Pass continuous = true so the mic stays open until stopped
    );
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (aadhaarInput.length === 12 || aadhaarInput.length === 4) {
      submitAadhaarNumber(aadhaarInput);
    }
  };

  const formatAadhaar = (num: string) => {
    const parts = [];
    for (let i = 0; i < num.length; i += 4) {
      parts.push(num.substring(i, i + 4));
    }
    return parts.join(' ');
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5 space-y-4">
      <div className="space-y-4">
        {/* Screen Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl text-ink">
              {t('aadhaarTitle')}
            </h1>
            <p className="font-caption text-sm text-ink-muted mt-1">
              {t('aadhaarSubtitle')}
            </p>
          </div>
          <button
            onClick={handlePlayVoice}
            className={`w-11 h-11 rounded border flex items-center justify-center transition-colors ${
              isPlayingAudio ? 'bg-action text-white border-action' : 'bg-surface border-line text-trust'
            }`}
            aria-label={t('aadhaarListenGuide')}
          >
            <SpeakerIcon size={20} color={isPlayingAudio ? '#FFFFFF' : '#009378'} />
          </button>
        </div>

        {/* Audio Banner */}
        <div className="card-flat bg-trust/5 border-trust/20 p-3.5 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-trust/10 text-trust flex items-center justify-center shrink-0">
            <SpeakerIcon size={16} color="#009378" />
          </div>
          <p className="text-xs text-ink leading-relaxed font-medium">
            "{t('aadhaarPrompt')}"
          </p>
        </div>

        {/* Aadhaar Number Display Box */}
        <div className="bg-white border-2 border-trust rounded-xl p-4 text-center shadow-sm">
          <span className="text-xs text-ink-muted uppercase font-bold tracking-wider block mb-1">
            {t('aadhaarNumberLabel')}
          </span>
          <div className="text-2xl font-mono font-bold tracking-widest text-ink min-h-[36px]">
            {aadhaarInput ? formatAadhaar(aadhaarInput) : <span className="text-ink-muted opacity-40">____ ____ ____</span>}
          </div>
          <span className="text-[11px] text-ink-muted mt-1 block">
            {aadhaarInput.length}/12 {t('aadhaarDigitsEntered')}
          </span>
        </div>

        {/* Big Touch Keypad & Voice Mic Input */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                onClick={() => handleKeyPress(digit)}
                className="btn-secondary !min-h-[50px] text-xl font-bold font-mono active:scale-95 transition-transform"
              >
                {digit}
              </button>
            ))}
            <button
              onClick={handleClear}
              className="bg-surface border border-line text-ink-muted rounded-lg text-xs font-bold hover:bg-black/5"
            >
              {t('aadhaarClear')}
            </button>
            <button
              onClick={() => handleKeyPress('0')}
              className="btn-secondary !min-h-[50px] text-xl font-bold font-mono active:scale-95 transition-transform"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="bg-surface border border-line text-alert rounded-lg text-xs font-bold hover:bg-alert/10"
            >
              ⌫ {t('aadhaarBackspace')}
            </button>
          </div>

          {/* Voice Input Mic Button */}
          <button
            onClick={handleVoiceInput}
            disabled={isListeningVoice}
            className={`w-full py-3 px-4 rounded-lg border flex items-center justify-center space-x-2 text-xs font-bold transition-colors ${
              isListeningVoice 
                ? 'bg-action text-white border-action animate-pulse' 
                : 'bg-surface border-line text-trust hover:bg-trust/10'
            }`}
          >
            <MicIcon size={18} color={isListeningVoice ? '#FFFFFF' : '#009378'} />
            <span>{isListeningVoice ? t('aadhaarListening') : t('aadhaarSpeak')}</span>
          </button>
        </div>

        {/* SIH Judge / Demo Beneficiary Quick Shortcut */}
        <div className="card-flat bg-amber-50 border-amber-200 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-900">⚡ SIH Judge Demo Shortcut</span>
            <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-mono">9999 8888 7777</span>
          </div>
          <button
            onClick={loginDemoBeneficiary}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-3 rounded text-xs transition-colors shadow-sm"
          >
            1-Click "Demo Beneficiary" Login (Bypass OTP)
          </button>
        </div>
      </div>

      {/* Main Action Button */}
      <div className="pt-3 border-t border-line">
        <button
          onClick={() => handleSubmit()}
          disabled={aadhaarInput.length < 4}
          className={`btn-primary w-full ${aadhaarInput.length < 4 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {t('aadhaarSendOtp')}
        </button>
      </div>
    </div>
  );
};
