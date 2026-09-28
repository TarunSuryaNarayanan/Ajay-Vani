import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TTS_UNAVAILABLE_EVENT } from '../../services/speech';
import { getUiText } from '../../services/translations';

/**
 * App-wide notice for the single most confusing failure in the app: a speaker
 * button that makes no sound because no TTS backend is configured.
 */
export const TtsUnavailableToast: React.FC = () => {
  const { selectedLanguage } = useApp();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onUnavailable = () => {
      setVisible(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setVisible(false), 6000);
    };

    window.addEventListener(TTS_UNAVAILABLE_EVENT, onUnavailable);
    return () => {
      window.removeEventListener(TTS_UNAVAILABLE_EVENT, onUnavailable);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="absolute bottom-4 left-3 right-3 z-50" role="status" aria-live="polite">
      <div className="card-flat bg-amber-50 border-amber-300 p-3 shadow-lg flex items-start gap-2">
        <span aria-hidden="true">🔇</span>
        <p className="text-[11px] text-amber-900 leading-relaxed">
          {getUiText(selectedLanguage || 'hi-IN', 'voiceUnavailable')}
        </p>
      </div>
    </div>
  );
};
