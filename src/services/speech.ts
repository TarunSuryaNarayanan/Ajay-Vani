import { LanguageCode } from '../types';
import { audioCaptureService, AudioCaptureCallbacks } from './audioCapture';
import { localFallbackProcess } from './api';
import {
  packStateManager,
  getPackForLanguage,
  getArtifactUrl,
  isPackConfigured,
} from './modelPackManager';
import { packDownloader } from './packDownloader';
import { transcribeWavBase64 } from './localAsr';

let onnxruntime: any = null;

export const TTS_UNAVAILABLE_EVENT = 'ajay-vani:tts-unavailable';

/**
 * Fired whenever speak() finds no backend, so any screen with a speaker button can
 * tell the user why nothing was heard instead of failing silently.
 */
function announceTtsUnavailable(lang: LanguageCode) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(TTS_UNAVAILABLE_EVENT, { detail: { lang } }));
}

export interface BhashiniASRResult {
  success: boolean;
  transcript: string;
  confidence?: number;
  source: 'bhashini' | 'onnx' | 'fallback';
}

export class SpeechService {
  private currentAudio: HTMLAudioElement | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private audioCtx: AudioContext | null = null;
  private vadCallbacks: {
    onResult: (transcript: string, isFinal: boolean) => void;
    onError: (error: string) => void;
    onEnd: () => void;
    onSpeechStart?: () => void;
  } | null = null;
  private currentLang: LanguageCode = 'hi-IN';
  private audioCaptureActive: boolean = false;

  public isSupported(): boolean {
    return typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== 'undefined';
  }

  public isTTSSupported(): boolean {
    return typeof window !== 'undefined';
  }

  public async isBhashiniAvailable(): Promise<boolean> {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) return false;
      const data = await res.json();
      return data.bhashiniConfigured === true;
    } catch {
      return false;
    }
  }

  public startListening(
    lang: LanguageCode = 'hi-IN',
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onEnd: () => void,
    onSpeechStart?: () => void
  ): void {
    this.currentLang = lang;
    this.audioCaptureActive = true;

    this.vadCallbacks = { onResult, onError, onEnd, onSpeechStart };

    const callbacks: AudioCaptureCallbacks = {
      onVADSpeechStart: () => {
        onSpeechStart?.();
      },
      onVADSpeechEnd: async () => {
        const wavBase64 = await audioCaptureService.handleManualStop();
        if (!wavBase64) {
          onError('आवाज़ कॅप्चर करने में समस्या आई। कृपया दोबारा कोश करें।');
          onEnd();
          return;
        }
        const result = await this.recognizeWithFallback(wavBase64, lang);
        if (result.success && result.transcript) {
          onResult(result.transcript, true);
        } else {
          onError('आपकी आवाज़ समझ में नहीं आई। कृपया धीरे और स्पष्ट बोलें।');
        }
        this.audioCaptureActive = false;
        onEnd();
      },
      onAudioReady: (wavBase64: string, _sampleRate: number) => {
      },
      onError: (err: string) => {
        onError(err);
        this.audioCaptureActive = false;
        onEnd();
      },
    };

    audioCaptureService.startCapture(lang, callbacks).then((ok) => {
      if (!ok) {
        onError('माइक्रोफ़ोन तक पहुँच नहीं मिली। कृपया अनुमति दें।');
        onEnd();
      }
    });
  }

  /**
   * Local Whisper first: it works for every app language with no cloud key and
   * no network. Bhashini is kept only as a quality fallback when it happens to
   * be configured on the server.
   */
  private async recognizeWithFallback(
    wavBase64: string,
    lang: LanguageCode
  ): Promise<BhashiniASRResult> {
    const onnxResult = await this.tryOnnxASR(wavBase64, lang);
    if (onnxResult.success) {
      return onnxResult;
    }

    console.warn('[SpeechService] Local ONNX ASR failed, trying Bhashini ASR');
    const bhashiniOk = await this.tryBhashiniASR(wavBase64, lang);
    if (bhashiniOk.success) {
      return bhashiniOk;
    }

    console.warn('[SpeechService] All ASR backends failed; no transcript produced');
    return {
      success: false,
      transcript: '',
      source: 'fallback',
    };
  }

  private async tryBhashiniASR(
    wavBase64: string,
    lang: LanguageCode
  ): Promise<BhashiniASRResult> {
    try {
      const res = await fetch('/api/bhashini/asr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64: wavBase64, language: lang }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return {
          success: false,
          transcript: '',
          source: 'bhashini',
          ...(errData.error ? { error: errData.error } : {}),
        };
      }

      const data = await res.json();
      if (data.success && data.transcript) {
        return {
          success: true,
          transcript: data.transcript,
          confidence: data.confidence,
          source: 'bhashini',
        };
      }

      return { success: false, transcript: '', source: 'bhashini' };
    } catch (err: any) {
      console.warn('[SpeechService] Bhashini ASR network error:', err.message);
      return { success: false, transcript: '', source: 'bhashini' };
    }
  }

  /**
   * ASR runs entirely in the browser off the shared local Whisper model in
   * `public/models`, so this is the only path that can produce a transcript —
   * there is no cloud fallback left for speech input.
   */
  private async tryOnnxASR(
    wavBase64: string,
    lang: LanguageCode
  ): Promise<BhashiniASRResult> {
    if (!isPackConfigured(getPackForLanguage(lang))) {
      return { success: false, transcript: '', source: 'onnx' };
    }

    await this.ensureLocalPackReady(lang);

    const result = await transcribeWavBase64(wavBase64, lang);
    if (result.success) {
      return {
        success: true,
        transcript: result.transcript,
        confidence: 0.8,
        source: 'onnx',
      };
    }

    return { success: false, transcript: '', source: 'onnx' };
  }

  /**
   * The model ships with the app, so a pack whose files are already being
   * served is usable immediately. Probe once per language and cache the answer
   * instead of requiring a multi-file download.
   */
  private localPackReady: Map<LanguageCode, Promise<boolean>> = new Map();

  private async ensureLocalPackReady(lang: LanguageCode): Promise<boolean> {
    if (packStateManager.getState(lang) === 'ready') return true;

    let probe = this.localPackReady.get(lang);
    if (!probe) {
      probe = packDownloader
        .isPackPresent(lang)
        .then((present) => {
          if (present) packStateManager.setStateReady(lang);
          return present;
        })
        .catch(() => false);
      this.localPackReady.set(lang, probe);
    }
    return probe;
  }

  private toBhashiniLang(lang: string): string {
    if (lang.startsWith('en')) return 'en';
    if (lang.startsWith('ta')) return 'ta';
    if (lang.startsWith('te')) return 'te';
    if (lang.startsWith('mr')) return 'mr';
    if (lang.startsWith('bn')) return 'bn';
    if (lang.startsWith('mai')) return 'mai';
    if (lang.startsWith('bho')) return 'bho';
    return 'hi';
  }

  public async stopListening(): Promise<void> {
    if (!this.vadCallbacks) return;

    this.audioCaptureActive = false;
    const callbacks = this.vadCallbacks;
    this.vadCallbacks = null;

    const wavBase64 = await audioCaptureService.handleManualStop();

    if (wavBase64) {
      const result = await this.recognizeWithFallback(wavBase64, this.currentLang || 'hi-IN');
      if (result.success && result.transcript) {
        callbacks.onResult(result.transcript, true);
      } else {
        callbacks.onError('आवाज़ समझ में नहीं आई। कृपया दोबारा कोश करें।');
      }
    } else {
      callbacks.onError('आवाज़ कॅप्चर नहीं हुई। कृपया दोबारा कोश करें।');
    }

    callbacks.onEnd();
  }

  public async speak(
    text: string,
    lang: LanguageCode = 'hi-IN',
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (msg: string) => void
  ): Promise<void> {
    if (!text) {
      setTimeout(() => { if (onEnd) onEnd(); }, 100);
      return;
    }

    const bhashiniOk = await this.tryBhashiniTTS(text, lang);
    if (bhashiniOk) {
      if (onStart) onStart();
      return;
    }

    // System espeak-ng on the server: real audio for every language, no cloud key.
    const localOk = await this.tryLocalServerTTS(text, lang);
    if (localOk) {
      if (onStart) onStart();
      return;
    }

    const pack = getPackForLanguage(lang);
    const hasLocalTTS = pack && pack.tts !== null;
    const packReady = hasLocalTTS && packStateManager.getState(lang) === 'ready';

    if (packReady) {
      const packSpoke = await this.tryLocalTTSSynthesizer(text, lang, onStart, onEnd);
      if (packSpoke) {
        return;
      }
    }

    console.warn('[SpeechService] No TTS backend available');
    // Every speaker button in the app funnels through speak(), so announce the
    // failure once here instead of leaving each button silently dead.
    announceTtsUnavailable(lang);
    if (onError) {
      onError(this.ttsUnavailableMessage(lang));
    } else {
      if (onStart) onStart();
      setTimeout(() => { if (onEnd) onEnd(); }, 500);
    }
  }

  private async tryLocalServerTTS(text: string, lang: LanguageCode): Promise<boolean> {
    try {
      const res = await fetch('/api/tts/local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: lang }),
      });

      if (!res.ok) {
        return false;
      }

      const data = await res.json();
      if (data.success && data.audioBase64) {
        await this.playWavAudio(data.audioBase64, data.samplingRate || 22050);
        return true;
      }

      return false;
    } catch (err: any) {
      console.warn('[SpeechService] Local TTS request failed:', err.message);
      return false;
    }
  }

  /** True when the host can synthesise speech without any downloaded model pack. */
  public async isLocalTtsAvailable(): Promise<boolean> {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) return false;
      const data = await res.json();
      return data.localTtsAvailable === true;
    } catch {
      return false;
    }
  }

  private ttsUnavailableMessage(lang: LanguageCode): string {
    return `आवाज़ (${lang}) उपलब्ध नहीं है। सर्वर पर BHASHINI_* कुंजियाँ जोड़ें या espeak-ng इंस्टॉल करें।`;
  }

  private async tryBhashiniTTS(
    text: string,
    lang: LanguageCode
  ): Promise<boolean> {
    try {
      const res = await fetch('/api/bhashini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: lang }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.warn('[SpeechService] Bhashini TTS error:', errData.error || res.status);
        return false;
      }

      const data = await res.json();
      if (data.success && data.audioBase64) {
        await this.playWavAudio(data.audioBase64, data.samplingRate || 22050);
        return true;
      }

      return false;
    } catch (err: any) {
      console.warn('[SpeechService] Bhashini TTS network error:', err.message);
      return false;
    }
  }

  private async tryLocalTTSSynthesizer(
    text: string,
    lang: LanguageCode,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<boolean> {
    const pack = getPackForLanguage(lang);
    if (!pack || !pack.tts) {
      return false;
    }

    const packState = packStateManager.getState(lang);
    if (packState !== 'ready') {
      return false;
    }

    try {
      const ttsUrl = getArtifactUrl(pack.tts);
      const audioBase64 = await this.runPiperInference(text, lang, ttsUrl);
      if (audioBase64) {
        if (onStart) onStart();
        await this.playWavAudio(audioBase64, 22050);
        if (onEnd) onEnd();
        return true;
      }
      return false;
    } catch (err: any) {
      console.warn('[SpeechService] Local TTS (Piper) error:', err.message);
      return false;
    }
  }

  private async runPiperInference(
    text: string,
    lang: LanguageCode,
    modelUrl: string
  ): Promise<string | null> {
    const ort = await this.tryLoadOnnxRuntime();
    if (!ort) return null;

    const session = await this.piperSessions.get(modelUrl);
    if (!session) return null;

    const phonemeIds = this.textToPhonemeIds(text, lang);
    const phonemeTensor = new ort.Tensor('int64', BigInt64Array.from(phonemeIds.map(BigInt)), [1, phonemeIds.length]);

    const feeds: Record<string, any> = {
      input: phonemeTensor,
      input_lengths: new ort.Tensor('int64', BigInt64Array.from([BigInt(phonemeIds.length)]), [1]),
    };

    const results = await session.run(feeds);
    const audioData = results.audio?.data;

    if (audioData && audioData instanceof Float32Array) {
      const audioBuffer = await this.audioCtx?.decodeAudioData(
        this.float32ToWavBuffer(audioData) as ArrayBuffer
      );
      if (audioBuffer) {
        return this.audioBufferToWavBase64(audioBuffer);
      }
    }

    return null;
  }

  private piperSessions: Map<string, any> = new Map();

  private async tryLoadOnnxRuntime(): Promise<any> {
    if (onnxruntime !== null) return onnxruntime;
    try {
      const ort = await import('onnxruntime-web');
      onnxruntime = ort;
      return ort;
    } catch (e) {
      console.warn('[SpeechService] onnxruntime-web not available:', e);
      onnxruntime = false;
      return null;
    }
  }

  private textToPhonemeIds(text: string, lang: LanguageCode): number[] {
    const phonemeMap: Record<string, number> = {
      'ं': 2, 'ः': 3, 'अ': 6, 'आ': 4, 'इ': 10, 'ई': 12,
      'उ': 14, 'ऊ': 16, 'ऋ': 18, 'ए': 20, 'ऐ': 22,
      'ओ': 24, 'औ': 2, 'क': 28, 'ख': 30, 'ग': 32,
      'घ': 34, 'ङ': 36, 'च': 38, 'छ': 40, 'ज': 42,
      'झ': 44, 'ञ': 46, 'ट': 48, 'ठ': 50, 'ड': 52,
      'ढ': 54, 'ण': 56, 'त': 58, 'थ': 60, 'द': 62,
      'ध': 64, 'न': 66, 'प': 68, 'फ': 70, 'ब': 72,
      'भ': 74, 'म': 76, 'य': 78, 'र': 80, 'ल': 82,
      'व': 84, 'श': 86, 'ष': 88, 'स': 90, 'ह': 92,
      ' ': 1, '.': 1, ',': 1,
    };
    const ids: number[] = [1];
    for (const ch of text) {
      ids.push(phonemeMap[ch] ?? 0);
    }
    ids.push(2);
    return ids;
  }

  private float32ToWavBuffer(float32: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(44 + float32.length * 2);
    const view = new DataView(buffer);
    function writeString(v: DataView, offset: number, str: string) {
      for (let i = 0; i < str.length; i++) {
        v.setUint8(offset + i, str.charCodeAt(i));
      }
    }
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + float32.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 22050, true);
    view.setUint32(28, 22050 * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, float32.length * 2, true);
    let offset = 44;
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      int16[i] = Math.max(-1, Math.min(1, float32[i])) * 0x7fff;
    }
    new Int16Array(buffer, offset, int16.length).set(int16);
    return buffer;
  }

  private audioBufferToWavBase64(audioBuffer: AudioBuffer): string {
    const channelData = audioBuffer.getChannelData(0);
    return this.float32ToWavBase64(channelData, audioBuffer.sampleRate);
  }

  private float32ToWavBase64(channelData: Float32Array, sampleRate: number): string {
    const buffer = new ArrayBuffer(44 + channelData.length * 2);
    const view = new DataView(buffer);
    function writeString(v: DataView, offset: number, str: string) {
      for (let i = 0; i < str.length; i++) {
        v.setUint8(offset + i, str.charCodeAt(i));
      }
    }
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + channelData.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, channelData.length * 2, true);
    const int16 = new Int16Array(channelData.length);
    for (let i = 0; i < channelData.length; i++) {
      int16[i] = Math.max(-1, Math.min(1, channelData[i])) * 0x7fff;
    }
    new Int16Array(buffer, 44, int16.length).set(int16);
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private async playWavAudio(wavBase64: string, sampleRate: number): Promise<void> {
    return new Promise((resolve) => {
      try {
        if (this.audioCtx && this.audioCtx.state !== 'suspended') {
          this.audioCtx.close();
        }
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

        const binary = atob(wavBase64);
        const buffer = new ArrayBuffer(binary.length);
        const view = new Uint8Array(buffer);
        for (let i = 0; i < binary.length; i++) {
          view[i] = binary.charCodeAt(i);
        }

        this.audioCtx.decodeAudioData(
          buffer,
          (audioBuffer: AudioBuffer) => {
            void this.startBuffer(audioBuffer).then(resolve);
          },
          () => {
            resolve();
          }
        );
      } catch (err) {
        console.warn('[SpeechService] Audio playback error:', err);
        resolve();
      }
    });
  }

  /**
   * Browsers keep an AudioContext suspended until the user interacts with the
   * page, and the app greets the beneficiary automatically on screen mount. If
   * the context is still suspended we wait for the first tap instead of
   * dropping the audio, otherwise the opening prompt is silently lost.
   */
  private async startBuffer(audioBuffer: AudioBuffer): Promise<void> {
    const ctx = this.audioCtx;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      const resumed = await ctx
        .resume()
        .then(() => (ctx.state as string) === 'running')
        .catch(() => false);
      if (!resumed) {
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(resolve, 10000);
          const unlock = () => {
            document.removeEventListener('pointerdown', unlock);
            document.removeEventListener('keydown', unlock);
            clearTimeout(timeout);
            ctx.resume().catch(() => {}).then(() => resolve());
          };
          document.addEventListener('pointerdown', unlock, { once: true });
          document.addEventListener('keydown', unlock, { once: true });
        });
        if ((ctx.state as string) !== 'running') return;
      }
    }

    return new Promise<void>((resolve) => {
      try {
        this.currentSource = ctx.createBufferSource();
        this.currentSource.buffer = audioBuffer;
        const gainNode = ctx.createGain();
        gainNode.gain.value = 1.0;
        this.currentSource.connect(gainNode);
        gainNode.connect(ctx.destination);
        this.currentSource.onended = () => resolve();
        this.currentSource.start(0);
      } catch (err) {
        console.warn('[SpeechService] Audio playback error:', err);
        resolve();
      }
    });
  }

  public stopSpeaking(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (e) {}
      this.currentSource = null;
    }
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close();
      } catch (e) {}
    }
    this.audioCtx = null;
  }
}

export const speechService = new SpeechService();
