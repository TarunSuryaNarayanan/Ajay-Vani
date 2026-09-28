import { LanguageCode } from '../types';

export interface AudioCaptureCallbacks {
  onVADSpeechStart: () => void;
  onVADSpeechEnd: () => void;
  onAudioReady: (wavBase64: string, sampleRate: number) => void;
  onError: (error: string) => void;
}

interface VADInstance {
  start: () => Promise<void>;
  pause: () => Promise<void>;
  destroy: () => Promise<void>;
}

const VAD_WORKLET_BASE = '/';
const ORT_WASM_BASE = '/';
const VAD_SR = 16000;

export const REQUIRED_VAD_ASSETS = [
  '/vad.worklet.bundle.min.js',
  '/silero_vad_v5.onnx',
  '/ort-wasm-simd-threaded.wasm',
];

export async function assertVADAssets(): Promise<void> {
  const missing: string[] = [];
  for (const url of REQUIRED_VAD_ASSETS) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (!res.ok) missing.push(url);
    } catch {
      missing.push(url);
    }
  }
  if (missing.length > 0) {
    console.warn('[AudioCapture] Missing VAD assets:', missing.join(', '));
  } else {
    console.info('[AudioCapture] All VAD assets verified.');
  }
}

function floatTo16(floatArr: Float32Array, output: Int16Array | null, offset: number): number {
  if (output === null) return offset;
  let i = 0;
  let o = offset;
  while (i < floatArr.length) {
    let s = Math.max(-1, Math.min(1, floatArr[i]));
    s = s < 0 ? s * 0x8000 : s * 0x7fff;
    output[o] = s;
    o++;
    i++;
  }
  return o;
}

export function toWavBase64(
  audioBuffer: AudioBuffer,
  numChannels: number = 1
): string {
  const channelData = audioBuffer.getChannelData(0);
  const buffer = new ArrayBuffer(44 + channelData.length * 2);
  const view = new DataView(buffer);

  function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + channelData.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, audioBuffer.sampleRate, true);
  view.setUint32(28, audioBuffer.sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, channelData.length * 2, true);

  let offset = 44;
  const len = floatTo16(channelData, new Int16Array(buffer, offset), 0);

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export class AudioCaptureService {
  private vad: VADInstance | null = null;
  private vadReady: Promise<any> | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private isCapturing: boolean = false;
  private vadActive: boolean = false;
  private silenceTimeout: ReturnType<typeof setTimeout> | null = null;
  private speechStarted: boolean = false;

  private readonly SILENCE_TIMEOUT_MS = 1500;
  private readonly MIN_RECORDING_MS = 500;

  async loadVAD(): Promise<any> {
    if (this.vadReady) return this.vadReady;

    this.vadReady = import('@ricky0123/vad-web').then(mod => {
      return mod.MicVAD;
    }).catch(err => {
      console.warn('[AudioCapture] Silero VAD unavailable, using fallback detection:', err);
      return null;
    });

    return this.vadReady;
  }

  private async initVAD(callbacks: AudioCaptureCallbacks) {
    try {
      const MicVAD = await this.loadVAD();
      if (!MicVAD) {
        return this.initFallbackVAD(callbacks);
      }

      this.vad = await MicVAD.new({
        baseAssetPath: VAD_WORKLET_BASE,
        model: 'v5',
        onnxWASMBasePath: ORT_WASM_BASE,
        audioContext: this.audioContext!,
        getStream: async () => this.mediaStream!,
        onSpeechStart: () => {
          this.speechStarted = true;
          if (this.silenceTimeout) clearTimeout(this.silenceTimeout);
          callbacks.onVADSpeechStart();
        },
        onSpeechEnd: () => {
          if (this.silenceTimeout) clearTimeout(this.silenceTimeout);
          this.silenceTimeout = setTimeout(() => {
            if (this.speechStarted) {
              callbacks.onVADSpeechEnd();
            }
          }, this.SILENCE_TIMEOUT_MS);
        },
         onVADMisfire: () => {},
        onFrameProcessed: () => {},
        startOnLoad: false,
      }) as unknown as VADInstance;
    } catch (err) {
      console.warn('[AudioCapture] VAD init failed, using fallback:', err);
      this.initFallbackVAD(callbacks);
    }
  }

  private initFallbackVAD(callbacks: AudioCaptureCallbacks) {
    this.vad = null;
    this.vadActive = false;
  }

  async startCapture(
    language: LanguageCode,
    callbacks: AudioCaptureCallbacks
  ): Promise<boolean> {
    try {
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(t => t.stop());
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: VAD_SR,
        },
      });

      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: VAD_SR,
      });

      this.audioChunks = [];
      this.speechStarted = false;

      await this.initVAD(callbacks);

      if (this.vad) {
        await this.vad.start();
        this.vadActive = true;
      }

      const options: MediaRecorderOptions | undefined = {
        mimeType: 'audio/webm;codecs=opus',
      };

      this.mediaRecorder = new MediaRecorder(this.mediaStream, options);
      this.mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      this.mediaRecorder.start(200);
      this.isCapturing = true;

      return true;
    } catch (err: any) {
      console.error('[AudioCapture] Failed to start:', err);
      callbacks.onError('माइक्रोफ़ोन प्रारंभ करने में त्रुटि। (Microphone access failed)');
      return false;
    }
  }

  handleManualStop = async (): Promise<string | null> => {
    if (!this.mediaRecorder || !this.isCapturing) return null;

    const chunks = [...this.audioChunks];

    try {
      this.mediaRecorder.ondataavailable = null;
      this.mediaRecorder.requestData();
      await new Promise<void>((resolve) => {
        const handler = () => {
          clearTimeout(timeout);
          resolve();
        };
        const timeout = setTimeout(handler, 1000);
        this.mediaRecorder!.ondataavailable = (e: BlobEvent) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data);
          }
          handler();
        };
      });
    } catch (e) {
      console.warn('[AudioCapture] Error during manual stop flush:', e);
    }

    if (chunks.length === 0) {
      this.stopCapture();
      return null;
    }

    const blob = new Blob(chunks, { type: 'audio/webm' });

    // Decode the blob into a WAV base64 string BEFORE tearing down the
    // context — blobToWavBase64 needs this.audioContext to decode the
    // audio data. Calling stopCapture() first nulls the context and
    // makes decodeAudioData throw (B1 defect).
    const wavBase64 = await this.blobToWavBase64(blob);

    this.stopCapture();

    return wavBase64;
  }

  stopCapture() {
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }

    if (this.vad) {
      try {
        this.vad.destroy();
      } catch (e) {}
      this.vad = null;
    }
    this.vadActive = false;

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
        this.mediaRecorder.ondataavailable = null;
      } catch (e) {}
    }
    this.mediaRecorder = null;
    this.isCapturing = false;

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {}
    }
    this.audioContext = null;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
  }

  private async blobToWavBase64(blob: Blob): Promise<string | null> {
    const ctx = this.audioContext;
    if (!ctx) return null;

    return new Promise((resolve) => {
      const fileReader = new FileReader();
      fileReader.onload = async () => {
        try {
          const arrayBuffer = fileReader.result as ArrayBuffer;
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
          resolve(toWavBase64(audioBuffer, 1));
        } catch (decodeErr) {
          resolve(this.decodeMediaRecorderBlob(blob));
        }
      };
      fileReader.onerror = () => resolve(null);
      fileReader.readAsArrayBuffer(blob);
    });
  }

  private async decodeMediaRecorderBlob(blob: Blob): Promise<string | null> {
    const ctx = this.audioContext;
    if (!ctx) return null;

    const arrayBuffer = await blob.arrayBuffer();
    try {
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      return toWavBase64(audioBuffer, 1);
    } catch (e) {
      return null;
    }
  }
}

export const audioCaptureService = new AudioCaptureService();
