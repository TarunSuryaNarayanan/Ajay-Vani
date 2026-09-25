import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DialectOption, LanguageCode } from '../types';
import { SpeakerIcon } from '../components/Icons';
import { speechService } from '../services/speech';

const DIALECT_OPTIONS: DialectOption[] = [
  {
    code: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिंदी',
    region: 'उत्तर भारत',
    sampleGreeting: 'नमस्ते! मैं आपका पीएम-अजय ग्राम सहायक हूँ। आप किस काम में आगे बढ़ना चाहते हैं?'
  },
  {
    code: 'bho-IN',
    name: 'Bhojpuri',
    nativeName: 'भोजपुरी',
    region: 'पूर्वांचल एवं बिहार',
    sampleGreeting: 'राम राम भाई! हम आपके पीएम-अजय ग्राम सहायक बानी। रउवा कवन काम सीखल चाहत बानी?'
  },
  {
    code: 'bun-IN',
    name: 'Bundeli',
    nativeName: 'बुंदेली',
    region: 'बुंदेलखंड क्षेत्र',
    sampleGreeting: 'राम राम भइया! हम आपके ग्राम सहायक हैं। आप बताओ कौन सो काम सीखवे की इच्छा है?'
  },
  {
    code: 'chg-IN',
    name: 'Chhattisgarhi',
    nativeName: 'छत्तीसगढ़ी',
    region: 'मध्य भारत',
    sampleGreeting: 'जय जोहार संगी! मैं तोर ग्राम सहायक आंव। तंय कोन काम सीखे बर चाहत हस?'
  },
  {
    code: 'mai-IN',
    name: 'Maithili',
    nativeName: 'मैथिली',
    region: 'मिथिलांचल',
    sampleGreeting: 'प्रणाम! हम अहांक ग्राम सहायक छी। अहां कोन काज मे आगां बढ़य चाहैत छी?'
  },
  {
    code: 'ta-IN',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    region: 'தமிழ்நாடு',
    sampleGreeting: 'வணக்கம்! நான் உங்கள் பிஎம்-அஜய் கிராம உதவியாளர். எந்த தொழில் கற்க விரும்புகிறீர்கள்?'
  },
  {
    code: 'te-IN',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    region: 'ఆంధ్ర & తెలంగాణ',
    sampleGreeting: 'నమస్కారం! నేను మీ పిఎం-అజయ్ గ్రామ సహాయకుడిని. మీరు ఏ పని నేర్చుకోవాలనుకుంటున్నారు?'
  },
  {
    code: 'mr-IN',
    name: 'Marathi',
    nativeName: 'मराठी',
    region: 'महाराष्ट्र',
    sampleGreeting: 'नमस्कार! मी तुमचा पीएम-अजय ग्राम सहाय्यक आहे. तुम्हाला कोणत्या कामाचा अनुभव आहे?'
  },
  {
    code: 'bn-IN',
    name: 'Bengali',
    nativeName: 'বাংলা',
    region: 'পশ্চিমবঙ্গ',
    sampleGreeting: 'নমস্কার! আমি আপনার পিএম-অজয় গ্রাম সহায়ক। আপনি কোন কাজ শিখতে আগ্রহী?'
  }
];

export const LanguageSelectionScreen: React.FC = () => {
  const { setLanguage, setScreen, setPrivacyOpen, setTermsOpen } = useApp();
  const [playingCode, setPlayingCode] = useState<LanguageCode | null>(null);

  const handlePreviewAudio = (e: React.MouseEvent, dialect: DialectOption) => {
    e.stopPropagation();
    if (playingCode === dialect.code) {
      speechService.stopSpeaking();
      setPlayingCode(null);
      return;
    }

    setPlayingCode(dialect.code);
    speechService.speak(
      dialect.sampleGreeting,
      dialect.code,
      undefined,
      () => setPlayingCode(null)
    );
  };

  const handleSelectDialect = (dialect: DialectOption) => {
    speechService.stopSpeaking();
    setLanguage(dialect.code, dialect.nativeName);
    setScreen('voice-chat');
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5">
      <div>
        {/* Screen Title */}
        <div className="mb-6">
          <h1 className="font-display text-ink text-2xl mb-1">
            अपनी भाषा चुनें
          </h1>
          <p className="font-body text-ink-muted text-base">
            बातचीत करने के लिए अपनी मातृभाषा या बोली पर टैप करें।
          </p>
        </div>

        {/* Dialect Tiles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="list">
          {DIALECT_OPTIONS.map((dialect) => {
            const isPlaying = playingCode === dialect.code;
            return (
              <div
                key={dialect.code}
                onClick={() => handleSelectDialect(dialect)}
                className="card-flat hover:border-trust active:bg-black/[0.02] cursor-pointer flex items-center justify-between p-4 transition-colors relative"
                role="listitem"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleSelectDialect(dialect);
                  }
                }}
              >
                <div className="flex flex-col">
                  <span className="text-xl font-semibold text-ink leading-tight">
                    {dialect.nativeName}
                  </span>
                  <span className="font-caption text-ink-muted mt-0.5">
                    {dialect.name} ({dialect.region})
                  </span>
                </div>

                {/* Voice Preview Button */}
                <button
                  onClick={(e) => handlePreviewAudio(e, dialect)}
                  aria-label={`${dialect.nativeName} आवाज सुनें`}
                  className={`w-12 h-12 rounded flex items-center justify-center border transition-colors ${
                    isPlaying 
                      ? 'bg-action text-surface border-action' 
                      : 'bg-surface text-trust border-line hover:border-trust'
                  }`}
                >
                  <SpeakerIcon size={20} color={isPlaying ? '#FFFFFF' : '#009378'} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Legal Links per design.md §10 */}
      <footer className="mt-8 pt-4 border-t border-line flex flex-col items-center justify-center space-y-2 text-xs text-ink-muted">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setPrivacyOpen(true)}
            className="hover:text-trust underline underline-offset-2"
          >
            गोपनीयता नीति (Privacy Policy)
          </button>
          <span>•</span>
          <button
            onClick={() => setTermsOpen(true)}
            className="hover:text-trust underline underline-offset-2"
          >
            नियम एवं शर्तें (Terms)
          </button>
        </div>
        <p className="text-[11px] text-center text-ink-muted">
          सामाजिक न्याय एवं अधिकारिता मंत्रालय, भारत सरकार
        </p>
      </footer>
    </div>
  );
};
