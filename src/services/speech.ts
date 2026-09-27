import { MicVAD } from '@ricky0123/vad-web';
import { LanguageCode } from '../types';

// ─── WAV Encoder ─────────────────────────────────────────────────────────────

/**
 * Encodes a Float32Array of 16kHz mono PCM samples into a base64 WAV string
 * suitable for Bhashini ASR (expects 16-bit PCM WAV).
 */
function float32ToBase64Wav(float32Array: Float32Array, sampleRate = 16000): string {
  const numSamples = float32Array.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  // RIFF WAV header
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);           // PCM subchunk size
  view.setUint16(20, 1, true);            // PCM format
  view.setUint16(22, 1, true);            // Mono
  view.setUint32(24, sampleRate, true);   // Sample rate
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true);            // Block align
  view.setUint16(34, 16, true);           // Bits per sample
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Convert Float32 → Int16 PCM
  let offset = 44;
  for (let i = 0; i < numSamples; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  // Convert ArrayBuffer → base64
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

// ─── Audio Playback from Base64 WAV ──────────────────────────────────────────

async function playBase64Wav(
  base64Audio: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  const binaryStr = atob(base64Audio);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

  const audioCtx = new AudioContext();
  const audioBuffer = await audioCtx.decodeAudioData(bytes.buffer.slice(0));

  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioCtx.destination);

  if (onStart) onStart();
  source.start(0);
  source.onended = () => {
    audioCtx.close();
    if (onEnd) onEnd();
  };
}

// ─── SpeechService ────────────────────────────────────────────────────────────

export class SpeechService {
  private vad: Awaited<ReturnType<typeof MicVAD.new>> | null = null;
  private isSpeaking = false;

  public isSupported(): boolean {
    // Silero VAD requires AudioContext + navigator.mediaDevices
    return !!(window.AudioContext && navigator.mediaDevices?.getUserMedia);
  }

  public isTTSSupported(): boolean {
    // Bhashini TTS works everywhere; we always have AudioContext fallback
    return true;
  }

  /**
   * Start listening using Silero VAD.
   * - onSpeechStart fires when VAD detects the user started speaking.
   * - onResult fires with the final transcript once the utterance ends.
   * - onError fires if mic access or ASR fails.
   * - onEnd fires after each utterance is processed.
   */
  public async startListening(
    lang: LanguageCode = 'hi-IN',
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onEnd: () => void,
    onSpeechStart?: () => void
  ): Promise<void> {
    // Destroy any existing session
    await this.stopListening();

    try {
      this.vad = await MicVAD.new({
        onSpeechStart: () => {
          if (onSpeechStart) onSpeechStart();
        },

        onSpeechEnd: async (audio: Float32Array) => {
          // Silero VAD auto-stops when silence is detected.
          // audio = Float32Array of 16kHz mono PCM for the full utterance.
          try {
            const base64Wav = float32ToBase64Wav(audio, 16000);
            const res = await fetch('/api/bhashini/asr', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioBase64: base64Wav, language: lang }),
            });

            if (!res.ok) throw new Error(`ASR proxy error: ${res.status}`);
            const data = await res.json();

            if (data.success && data.transcript) {
              onResult(data.transcript, true);
            } else {
              onError('ASR did not return a transcript. Please try again.');
            }
          } catch (err: any) {
            console.error('[Bhashini ASR] Error:', err);
            onError('आवाज पहचानने में समस्या। कृपया दोबारा प्रयास करें।');
          } finally {
            onEnd();
          }
        },

        onVADMisfire: () => {
          // Too short to be real speech — ignore silently
          console.debug('[VAD] Misfire detected — utterance too short.');
        },
      });

      this.vad.start();
    } catch (err: any) {
      console.error('[VAD] Init error:', err);
      // Common case: user denied mic permission
      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission')) {
        onError('माइक्रोफ़ोन की अनुमति नहीं मिली। कृपया ब्राउज़र में माइक्रोफ़ोन एक्सेस दें।');
      } else {
        onError('माइक्रोफ़ोन प्रारंभ करने में त्रुटि। कृपया पुनः प्रयास करें।');
      }
    }
  }

  public async stopListening(): Promise<void> {
    if (this.vad) {
      try {
        this.vad.destroy();
      } catch (e) {
        // Ignore errors on destroy
      }
      this.vad = null;
    }
  }

  /**
   * Speak text using Bhashini TTS.
   * Falls back to browser SpeechSynthesis if Bhashini TTS fails.
   */
  public async speak(
    text: string,
    lang: LanguageCode = 'hi-IN',
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    if (this.isSpeaking) this.stopSpeaking();
    this.isSpeaking = true;

    try {
      const res = await fetch('/api/bhashini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: lang, gender: 'female' }),
      });

      if (!res.ok) throw new Error(`TTS proxy error: ${res.status}`);
      const data = await res.json();

      if (!data.success || !data.audioBase64) throw new Error('Empty TTS response');

      await playBase64Wav(
        data.audioBase64,
        onStart,
        () => {
          this.isSpeaking = false;
          if (onEnd) onEnd();
        }
      );
    } catch (err: any) {
      console.warn('[Bhashini TTS] Failed, falling back to browser SpeechSynthesis:', err.message);
      this._speakFallback(text, lang, onStart, () => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
      });
    }
  }

  /** Browser SpeechSynthesis fallback (used only when Bhashini TTS is unavailable) */
  private _speakFallback(
    text: string,
    lang: LanguageCode,
    onStart?: () => void,
    onEnd?: () => void
  ): void {
    if (!('speechSynthesis' in window)) {
      if (onStart) onStart();
      setTimeout(() => { if (onEnd) onEnd(); }, 500);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang.startsWith('bho') || lang.startsWith('bun') || lang.startsWith('chg') ? 'hi-IN' : lang;
    utterance.pitch = 1.0;
    utterance.rate = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const indicVoice = voices.find(v => v.lang.startsWith('hi') || v.lang.includes('IN'));
    if (indicVoice) utterance.voice = indicVoice;

    if (onStart) utterance.onstart = onStart;
    utterance.onend = () => { if (onEnd) onEnd(); };
    utterance.onerror = () => { if (onEnd) onEnd(); };

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking(): void {
    this.isSpeaking = false;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    // Note: AudioContext-based playback cannot be cancelled from here without
    // a ref to the source node — in practice, speaking is auto-stopped by
    // the next call to speak() or by the audio ending naturally.
  }
}

export const speechService = new SpeechService();
