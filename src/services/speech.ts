import { LanguageCode } from '../types';

// Check if Speech Recognition is supported
const SpeechRecognitionClass = 
  (typeof window !== 'undefined') &&
  ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

export class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (SpeechRecognitionClass) {
      try {
        this.recognition = new SpeechRecognitionClass();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
      } catch (e) {
        console.warn('SpeechRecognition init error:', e);
      }
    }
  }

  public isSupported(): boolean {
    return !!SpeechRecognitionClass;
  }

  public isTTSSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public startListening(
    lang: LanguageCode = 'hi-IN',
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onEnd: () => void,
    onSpeechStart?: () => void
  ) {
    if (!this.recognition) {
      onError("इस ब्राउज़र में स्पीच पहचान समर्थित नहीं है। (Speech recognition not supported)");
      onEnd();
      return;
    }

    if (this.isListening) {
      try {
        this.recognition.abort();
      } catch (e) {}
    }

    // Set recognition language (maps regional to standard Indic locale if needed)
    let bcp47 = 'hi-IN';
    if (lang === 'ta-IN') bcp47 = 'ta-IN';
    else if (lang === 'te-IN') bcp47 = 'te-IN';
    else if (lang === 'mr-IN') bcp47 = 'mr-IN';
    else if (lang === 'bn-IN') bcp47 = 'bn-IN';
    else bcp47 = 'hi-IN'; // Covers Hindi, Bhojpuri, Bundeli, Chhattisgarhi, Maithili

    this.recognition.lang = bcp47;

    this.recognition.onstart = () => {
      this.isListening = true;
      if (onSpeechStart) onSpeechStart();
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript, true);
      } else if (interimTranscript) {
        onResult(interimTranscript, false);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      this.isListening = false;
      if (event.error !== 'no-speech') {
        onError(`माइक्रोफ़ोन त्रुटि: ${event.error}`);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (err: any) {
      this.isListening = false;
      onError("माइक्रोफ़ोन प्रारंभ करने में त्रुटि।");
      onEnd();
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.isListening = false;
    }
  }

  public speak(
    text: string, 
    lang: LanguageCode = 'hi-IN',
    onStart?: () => void,
    onEnd?: () => void
  ) {
    if (!this.isTTSSupported()) {
      console.warn("SpeechSynthesis not supported.");
      if (onStart) onStart();
      setTimeout(() => { if (onEnd) onEnd(); }, 500);
      return;
    }

    try {
      window.speechSynthesis.cancel();
    } catch (e) {}

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    let bcp47 = 'hi-IN';
    if (lang === 'ta-IN') bcp47 = 'ta-IN';
    else if (lang === 'te-IN') bcp47 = 'te-IN';
    else if (lang === 'mr-IN') bcp47 = 'mr-IN';
    else if (lang === 'bn-IN') bcp47 = 'bn-IN';
    else bcp47 = 'hi-IN';

    utterance.lang = bcp47;
    utterance.pitch = 1.0;
    utterance.rate = 0.9;

    // Pick best Indic voice if available
    const voices = window.speechSynthesis.getVoices();
    const indicVoice = voices.find(v => v.lang.startsWith(bcp47.split('-')[0]) || v.lang.includes('hi'));
    if (indicVoice) {
      utterance.voice = indicVoice;
    }

    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;
    utterance.onerror = (e) => {
      console.warn("TTS error:", e);
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking() {
    if (this.isTTSSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
      this.currentUtterance = null;
    }
  }
}

export const speechService = new SpeechService();
