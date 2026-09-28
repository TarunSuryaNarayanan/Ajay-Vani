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

  return null;
};
