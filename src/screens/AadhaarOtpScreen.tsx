import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SpeakerIcon, CheckIcon } from '../components/Icons';
import { speechService } from '../services/speech';
import { getAadhaarText } from '../services/translations';

export const AadhaarOtpScreen: React.FC = () => {
  const { aadhaarNumber, verifyAadhaarOtp, selectedLanguage, setScreen } = useApp();
  const [otp, setOtp] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const t = (key: string) => getAadhaarText(selectedLanguage || 'hi-IN', key);

  const masked = aadhaarNumber 
    ? `XXXX XXXX ${aadhaarNumber.slice(-4)}`
    : 'XXXX XXXX 7777';

  const spokenPrompt = t('otpPrompt');

  const handlePlayVoice = () => {
    speechService.speak(
      spokenPrompt,
      selectedLanguage,
      () => setIsPlayingAudio(true),
      () => setIsPlayingAudio(false)
    );
  };

  const handleKeyPress = (digit: string) => {
    if (otp.length < 4) {
      const nextOtp = otp + digit;
      setOtp(nextOtp);
      setErrorMessage(null);
      if (nextOtp.length === 4) {
        setTimeout(() => handleVerify(nextOtp), 300);
      }
    }
  };

  const handleBackspace = () => {
    setOtp(prev => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handleVerify = (codeToTest?: string) => {
    const code = codeToTest || otp;
    const success = verifyAadhaarOtp(code);
    if (!success) {
      setErrorMessage(t('otpInvalid'));
    }
  };

  const handleAutoFillDemoOtp = () => {
    setOtp('1234');
    handleVerify('1234');
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5 space-y-4">
      <div className="space-y-4">
        {/* Screen Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl text-ink">
              {t('otpTitle')}
            </h1>
            <p className="font-caption text-sm text-ink-muted mt-1">
              {t('otpAadhaarLabel')} <strong className="font-mono text-ink">{masked}</strong>
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

        {/* Info Card */}
        <div className="card-flat bg-emerald-50 border-emerald-200 p-4 space-y-1">
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs">
            <CheckIcon size={16} color="#064e3b" />
            <span>{t('otpSentBadge')}</span>
          </div>
          <p className="text-xs text-emerald-900 mt-1">
            {t('otpSentBody')}
          </p>
        </div>

        {/* 4-Digit Display Boxes */}
        <div className="py-2">
          <div className="flex justify-center space-x-3">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-13 h-14 rounded-lg border-2 flex items-center justify-center text-2xl font-bold font-mono transition-all ${
                  otp[index]
                    ? 'border-trust bg-trust/5 text-trust shadow-sm'
                    : 'border-line bg-white text-ink-muted'
                }`}
                style={{ width: '56px', height: '60px' }}
              >
                {otp[index] || ''}
              </div>
            ))}
          </div>

          {errorMessage && (
            <p className="text-xs text-alert font-bold text-center mt-3">
              ⚠️ {errorMessage}
            </p>
          )}
        </div>

        {/* Demo Bypass Helper */}
        <div className="text-center space-y-2 pt-1">
          <button
            onClick={handleAutoFillDemoOtp}
            className="inline-flex items-center space-x-1 text-xs font-bold text-trust hover:underline bg-trust/10 px-3 py-1.5 rounded-full"
          >
            <span>✨ {t('otpAutoFill')}</span>
          </button>
        </div>

        {/* 3x4 Touch Keypad */}
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleKeyPress(digit)}
              className="btn-secondary !min-h-[48px] text-xl font-bold font-mono active:scale-95 transition-transform"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={() => setOtp('')}
            className="bg-surface border border-line text-ink-muted rounded-lg text-xs font-bold hover:bg-black/5"
          >
            {t('aadhaarClear')}
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="btn-secondary !min-h-[48px] text-xl font-bold font-mono active:scale-95 transition-transform"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="bg-surface border border-line text-alert rounded-lg text-xs font-bold hover:bg-alert/10"
          >
            ⌫
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-line space-y-2">
        <button
          onClick={() => handleVerify()}
          disabled={otp.length < 4}
          className={`btn-primary w-full ${otp.length < 4 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {t('otpVerify')}
        </button>

        <button
          onClick={() => setScreen('aadhaar-login')}
          className="btn-secondary w-full text-xs"
        >
          {t('otpChangeNumber')}
        </button>
      </div>
    </div>
  );
};
