import React, { useState } from 'react';
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
    setIsListeningVoice(true);
    // Simulate speech recognition for 12-digit Aadhaar
    setTimeout(() => {
      setAadhaarInput('999988887777');
      setIsListeningVoice(false);
    }, 1800);
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
