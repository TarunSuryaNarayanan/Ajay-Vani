import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ASR_FALLBACK_EVENT } from '../../services/speech';
import { getUiText } from '../../services/translations';

/**
 * App-wide notice for the Web Speech retry. Without it the microphone silently
 * reopens and the app looks frozen while the local and cloud recognisers fail.
 */
export const AsrRetryToast: React.FC = () => {
  const { selectedLanguage } = useApp();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onFallback = () => {
      setVisible(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setVisible(false), 6000);
    };

    window.addEventListener(ASR_FALLBACK_EVENT, onFallback);
    return () => {
      window.removeEventListener(ASR_FALLBACK_EVENT, onFallback);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="absolute bottom-4 left-3 right-3 z-50" role="status" aria-live="polite">
      <div className="card-flat bg-trust/10 border-trust/40 p-3 shadow-lg flex items-start gap-2">
        <span aria-hidden="true">🎤</span>
        <p className="text-[11px] text-ink leading-relaxed">
          {getUiText(selectedLanguage || 'hi-IN', 'voiceRetryPrompt')}
        </p>
      </div>
    </div>
  );
};
