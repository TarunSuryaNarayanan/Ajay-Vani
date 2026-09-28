import { LanguageCode } from '../types';
import {
  ASR_MODEL_DIR,
  ASR_MODEL_FILES,
  ASR_MODEL_REPO,
  ASR_MODEL_TOTAL_BYTES,
} from '../generated/asrModelManifest';
import { getEffectiveLanguage, getModelBaseUrlSync } from './modelPackManager';

/**
 * The one local ASR model the whole app shares.
 *
 * A single multilingual Whisper export covers every language in the app
 * (hi/ta/te/mr/bn/en); the Devanagari dialects bho/bun/chg/mai are transcribed
 * with the Hindi Whisper language code, which is what `getEffectiveLanguage`
 * already returns for them.
 */
export const LOCAL_ASR_MODEL_ID = ASR_MODEL_DIR;
export const LOCAL_ASR_MODEL_REPO = ASR_MODEL_REPO;
export const LOCAL_ASR_MODEL_FILES = ASR_MODEL_FILES;
export const LOCAL_ASR_MODEL_TOTAL_BYTES = ASR_MODEL_TOTAL_BYTES;

/** transformers.js resolves the q8 dtype to the `_quantized` ONNX suffix. */
const ASR_DTYPE = 'q8';

export interface LocalAsrResult {
  success: boolean;
  transcript: string;
  error?: string;
}

interface TransformersModule {
  env: Record<string, any>;
  pipeline: (task: string, model: string, options?: Record<string, unknown>) => Promise<any>;
}

let transformersLoaded: Promise<TransformersModule | null> | null = null;
let pipelinePromise: Promise<any> | null = null;

/**
 * Where transformers.js should look for the model files.
 *
 * In the browser that is the `/models/` URL served out of `public/`. The
 * verification harness can force either side of that split:
 *   AJAY_VANI_MODELS_URL  -> serve the model over HTTP (browser code path)
 *   AJAY_VANI_MODELS_DIR  -> read it off the file system (Node default)
 */
function isBrowserRuntime(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

function modelBase(): { base: string; fromWeb: boolean } {
  const env = typeof process !== 'undefined' ? process.env : undefined;
  const url = env?.AJAY_VANI_MODELS_URL;
  if (url) return { base: url, fromWeb: true };
  const dir = env?.AJAY_VANI_MODELS_DIR;
  if (dir) return { base: dir, fromWeb: false };
  if (isBrowserRuntime()) {
    return { base: getModelBaseUrlSync(), fromWeb: true };
  }
  return { base: `${process.cwd()}/public/models`, fromWeb: false };
}

export function getLocalAsrModelPath(): string {
  const { base } = modelBase();
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

async function loadTransformers(): Promise<TransformersModule | null> {
  if (transformersLoaded) return transformersLoaded;

  transformersLoaded = import('@huggingface/transformers')
    .then((mod) => {
      const transformers = mod as unknown as TransformersModule;
      // The model ships with the app: never let a bare repo id fall through to
      // the Hugging Face CDN, and never let a missing file be silently fetched
      // from the network.
      transformers.env.allowRemoteModels = false;
      transformers.env.allowLocalModels = true;
      transformers.env.localModelPath = getLocalAsrModelPath();
      // The app already caches /models/ through its service worker, and Node
      // would otherwise copy ~40 MB into node_modules/transformers/.cache.
      transformers.env.useBrowserCache = false;
      transformers.env.useFSCache = false;
      return transformers;
    })
    .catch((err) => {
      console.warn('[LocalAsr] transformers.js not available:', err);
      return null;
    });

  return transformersLoaded;
}

/**
 * Loads (once) the ASR pipeline for the shared local model.
 */
export async function getLocalAsrPipeline(): Promise<any | null> {
  if (pipelinePromise) return pipelinePromise;

  pipelinePromise = (async () => {
    const transformers = await loadTransformers();
    if (!transformers) return null;

    const modelPath = `${getLocalAsrModelPath()}/${LOCAL_ASR_MODEL_ID}`;
    const { fromWeb } = modelBase();
    try {
      return await transformers.pipeline('automatic-speech-recognition', modelPath, {
        dtype: ASR_DTYPE,
        // Browsers run on the wasm execution provider; on a plain Node
        // filesystem load the wasm EP is not registered, so use CPU there.
        device: fromWeb ? 'wasm' : 'cpu',
        local_files_only: true,
      });
    } catch (err: any) {
      console.warn(`[LocalAsr] Failed to load ${LOCAL_ASR_MODEL_REPO} from ${modelPath}:`, err?.message ?? err);
      pipelinePromise = null;
      return null;
    }
  })();

  return pipelinePromise;
}

/** Minimal 16-bit PCM mono WAV decoder for the base64 blobs the VAD produces. */
export function decodeWavBase64(wavBase64: string): { samples: Float32Array; sampleRate: number } {
  const binary = typeof atob === 'function' ? atob(wavBase64) : Buffer.from(wavBase64, 'base64').toString('binary');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const view = new DataView(bytes.buffer);

  let offset = 12;
  let sampleRate = 16000;
  let channels = 1;
  let bitsPerSample = 16;
  let dataStart = -1;
  let dataLength = 0;

  while (offset + 8 <= bytes.length) {
    const id = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
    const size = view.getUint32(offset + 4, true);
    const body = offset + 8;
    if (id === 'fmt ') {
      channels = view.getUint16(body + 2, true);
      sampleRate = view.getUint32(body + 4, true);
      bitsPerSample = view.getUint16(body + 14, true);
    } else if (id === 'data') {
      dataStart = body;
      dataLength = Math.min(size, bytes.length - body);
    }
    offset = body + size + (size % 2);
  }

  if (dataStart < 0) throw new Error('WAV payload has no data chunk');
  if (bitsPerSample !== 16) throw new Error(`Expected 16-bit PCM WAV, got ${bitsPerSample}-bit`);

  const frames = Math.floor(dataLength / 2 / channels);
  const samples = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    let acc = 0;
    for (let c = 0; c < channels; c++) {
      acc += view.getInt16(dataStart + (i * channels + c) * 2, true) / 32768;
    }
    samples[i] = acc / channels;
  }
  return { samples, sampleRate };
}

function resample(samples: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return samples;
  const ratio = to / from;
  const out = new Float32Array(Math.floor(samples.length * ratio));
  for (let i = 0; i < out.length; i++) {
    const pos = i / ratio;
    const i0 = Math.floor(pos);
    const i1 = Math.min(i0 + 1, samples.length - 1);
    const frac = pos - i0;
    out[i] = samples[i0] * (1 - frac) + samples[i1] * frac;
  }
  return out;
}

/** Whisper always wants 16 kHz mono. */
const WHISPER_SAMPLE_RATE = 16000;

/**
 * Transcribes a 16-bit PCM WAV (base64) in the app's language.
 * This is the single entry point shared by the app and the verify harness.
 */
export async function transcribeWavBase64(
  wavBase64: string,
  lang: LanguageCode
): Promise<LocalAsrResult> {
  if (!wavBase64) {
    return { success: false, transcript: '', error: 'empty audio' };
  }

  const asr = await getLocalAsrPipeline();
  if (!asr) {
    return { success: false, transcript: '', error: 'ASR pipeline unavailable' };
  }

  try {
    const { samples, sampleRate } = decodeWavBase64(wavBase64);
    const audio = resample(samples, sampleRate, WHISPER_SAMPLE_RATE);
    if (audio.length === 0) {
      return { success: false, transcript: '', error: 'no audio samples' };
    }

    const result = await asr(audio, {
      language: getEffectiveLanguage(lang),
      task: 'transcribe',
      // Whisper falls into degenerate loops on noisy/synthetic Indic audio
      // ("4.5 kr. 4.5 kr. 4.5 kr."), which is what this blocks.
      no_repeat_ngram_size: 3,
    });

    const transcript = typeof result === 'string'
      ? result
      : (result?.[0]?.text || result?.text || result?.generated_text || '');

    const trimmed = (transcript || '').trim();
    if (!trimmed) {
      return { success: false, transcript: '', error: 'empty transcript' };
    }
    return { success: true, transcript: trimmed };
  } catch (err: any) {
    console.warn('[LocalAsr] transcription failed:', err?.message ?? err);
    return { success: false, transcript: '', error: String(err?.message ?? err) };
  }
}
