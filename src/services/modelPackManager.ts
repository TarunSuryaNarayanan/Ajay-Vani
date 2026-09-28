import { LanguageCode } from '../types';
import {
  ASR_MODEL_DIR,
  ASR_MODEL_FILES,
  ASR_MODEL_REPO,
  ASR_MODEL_TOTAL_BYTES,
} from '../generated/asrModelManifest';

export type QualityTier = 'tiny' | 'base';

export type PackState =
  | 'unavailable'
  | 'not_downloaded'
  | 'downloading'
  | 'ready'
  | 'failed';

export interface PackArtifact {
  readonly path: string;
  readonly size: number;
  readonly sha256: string;
}

/**
 * ASR is one shared multilingual Whisper model, not one model per language.
 * A language picks the shared directory plus the Whisper language code that
 * its speech is decoded with.
 */
export interface AsrModelPack {
  /** Directory under the model base URL, also the transformers.js model id. */
  readonly modelId: string;
  /** Hugging Face repo the files were fetched from (provenance only). */
  readonly source: string;
  /** dtype passed to transformers.js; q8 selects the `_quantized` files. */
  readonly dtype: 'q8';
  /** Every file transformers.js requests, with its real size and sha256. */
  readonly files: readonly PackArtifact[];
  readonly totalBytes: number;
}

export interface LanguagePack {
  readonly languageCode: LanguageCode;
  readonly effectiveLanguage: string;
  readonly displayName: string;
  readonly displayNameNative: string;
  readonly asr: AsrModelPack;
  readonly tts: PackArtifact | null;
  readonly note?: string;
}

export interface PackRecord {
  state: PackState;
  downloadedBytes: number;
  totalBytes: number;
  error?: string;
}

const MODEL_BASE_URL = '/models/';
let runtimeModelBaseUrl: string | null = null;

export async function getModelBaseUrl(): Promise<string> {
  if (runtimeModelBaseUrl !== null) return runtimeModelBaseUrl;

  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      runtimeModelBaseUrl = data.modelBaseUrl || MODEL_BASE_URL;
    }
  } catch {
    runtimeModelBaseUrl = MODEL_BASE_URL;
  }

  if (runtimeModelBaseUrl === null) {
    runtimeModelBaseUrl = MODEL_BASE_URL;
  }
  return runtimeModelBaseUrl;
}

export function getModelBaseUrlSync(): string {
  return runtimeModelBaseUrl || MODEL_BASE_URL;
}

/** A manifest is usable only when every hash is a real, full-length sha256. */
export function isPackConfigured(pack: LanguagePack | undefined): boolean {
  if (!pack) return false;
  return (
    pack.asr.files.length > 0 &&
    pack.asr.files.every(
      (f) => /^[0-9a-f]{64}$/.test(f.sha256) && f.size > 0 && typeof f.path === 'string' && f.path.length > 0
    )
  );
}

const ASR_FILES: readonly PackArtifact[] = ASR_MODEL_FILES.map((f) => ({
  path: f.path,
  size: f.size,
  sha256: f.sha256,
}));

/**
 * Every language shares the same on-disk model. Only `effectiveLanguage`
 * differs, which is what makes hi/ta/te/mr/bn/en work out of one download
 * (and bho/bun/chg/mai work as Devanagari via the 'hi' code).
 */
const SHARED_ASR: AsrModelPack = {
  modelId: ASR_MODEL_DIR,
  source: ASR_MODEL_REPO,
  dtype: 'q8',
  files: ASR_FILES,
  totalBytes: ASR_MODEL_TOTAL_BYTES,
};

const DEVANAGARI_ALIAS_NOTE =
  'Aliased to Hindi pack — no dedicated offline model exists; Devanagari speech is transcribed with the multilingual Whisper "hi" code.';

export const LANGUAGE_PACKS: Record<LanguageCode, LanguagePack> = {
  'hi-IN': {
    languageCode: 'hi-IN',
    effectiveLanguage: 'hi',
    displayName: 'Hindi',
    displayNameNative: 'हिंदी',
    asr: SHARED_ASR,
    tts: {
      path: 'piper/hi_IN-pratham-medium.onnx',
      size: 64 * 1024 * 1024,
      sha256: 'piper_hi_placeholder_sha256_placeholder0000000000000',
    },
  },
  'en-IN': {
    languageCode: 'en-IN',
    effectiveLanguage: 'en',
    displayName: 'English',
    displayNameNative: 'English',
    asr: SHARED_ASR,
    tts: {
      path: 'piper/en_IN-amy-medium.onnx',
      size: 64 * 1024 * 1024,
      sha256: 'piper_en_placeholder_sha256_placeholder0000000000000',
    },
  },
  'bho-IN': {
    languageCode: 'bho-IN',
    effectiveLanguage: 'hi',
    displayName: 'Bhojpuri',
    displayNameNative: 'भोजपुरी',
    asr: SHARED_ASR,
    tts: null,
    note: DEVANAGARI_ALIAS_NOTE,
  },
  'bun-IN': {
    languageCode: 'bun-IN',
    effectiveLanguage: 'hi',
    displayName: 'Bundeli',
    displayNameNative: 'बुंदेली',
    asr: SHARED_ASR,
    tts: null,
    note: DEVANAGARI_ALIAS_NOTE,
  },
  'chg-IN': {
    languageCode: 'chg-IN',
    effectiveLanguage: 'hi',
    displayName: 'Chhattisgarhi',
    displayNameNative: 'छत्तीसगढ़ी',
    asr: SHARED_ASR,
    tts: null,
    note: DEVANAGARI_ALIAS_NOTE,
  },
  'mai-IN': {
    languageCode: 'mai-IN',
    effectiveLanguage: 'hi',
    displayName: 'Maithili',
    displayNameNative: 'मैथिली',
    asr: SHARED_ASR,
    tts: null,
    note: DEVANAGARI_ALIAS_NOTE,
  },
  'ta-IN': {
    languageCode: 'ta-IN',
    effectiveLanguage: 'ta',
    displayName: 'Tamil',
    displayNameNative: 'தமிழ்',
    asr: SHARED_ASR,
    tts: null,
    note: 'Offline TTS not yet available for Tamil. Uses Bhashini Enhanced mode.',
  },
  'te-IN': {
    languageCode: 'te-IN',
    effectiveLanguage: 'te',
    displayName: 'Telugu',
    displayNameNative: 'తెలుగు',
    asr: SHARED_ASR,
    tts: null,
    note: 'Offline TTS not yet available for Telugu. Uses Bhashini Enhanced mode.',
  },
  'mr-IN': {
    languageCode: 'mr-IN',
    effectiveLanguage: 'mr',
    displayName: 'Marathi',
    displayNameNative: 'मराठी',
    asr: SHARED_ASR,
    tts: null,
    note: 'Offline TTS not yet available for Marathi. Uses Bhashini Enhanced mode.',
  },
  'bn-IN': {
    languageCode: 'bn-IN',
    effectiveLanguage: 'bn',
    displayName: 'Bengali',
    displayNameNative: 'বাংলা',
    asr: SHARED_ASR,
    tts: null,
    note: 'Offline TTS not yet available for Bengali. Uses Bhashini Enhanced mode.',
  },
};

export const EFFECTIVE_LANGUAGES = ['hi', 'en', 'ta', 'te', 'mr', 'bn'] as const;

export type EffectiveLanguage = (typeof EFFECTIVE_LANGUAGES)[number];

export const ALIASED_LANGUAGES: LanguageCode[] = ['bho-IN', 'bun-IN', 'chg-IN', 'mai-IN'];

export function getPackForLanguage(lang: LanguageCode): LanguagePack {
  return LANGUAGE_PACKS[lang];
}

export function getEffectiveLanguage(lang: LanguageCode): EffectiveLanguage {
  const pack = LANGUAGE_PACKS[lang];
  return pack.effectiveLanguage as EffectiveLanguage;
}

/** URL of one file of a pack, e.g. `/models/whisper-tiny/config.json`. */
export function getArtifactUrl(artifact: PackArtifact): string {
  const base = getModelBaseUrlSync();
  const trimmed = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${trimmed}/${artifact.path}`;
}

/**
 * Directory transformers.js is pointed at, e.g. `/models/whisper-tiny`.
 * transformers.js appends `config.json`, `onnx/encoder_model_quantized.onnx`
 * and friends itself, so this is what the pipeline call needs.
 */
export function getAsrModelUrl(pack: LanguagePack): string {
  const base = getModelBaseUrlSync();
  const trimmed = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${trimmed}/${pack.asr.modelId}`;
}

export type PackObserver = (record: PackRecord, lang: LanguageCode) => void;

const STORAGE_KEY = 'ajay-vani-pack-states';
const MAX_CACHED_PACKS = 3;
const LRU_KEY = 'ajay-vani-pack-lru';

export class PackStateManager {
  private records: Map<LanguageCode, PackRecord> = new Map();
  private observers: Set<PackObserver> = new Set();
  private lru: LanguageCode[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, PackRecord>;
        for (const [lang, rec] of Object.entries(parsed)) {
          this.records.set(lang as LanguageCode, rec);
        }
      }
      const lruRaw = localStorage.getItem(LRU_KEY);
      if (lruRaw) {
        this.lru = JSON.parse(lruRaw) as LanguageCode[];
      }
    } catch {
      this.records.clear();
    }
  }

  private saveToStorage() {
    try {
      const obj: Record<string, PackRecord> = {};
      for (const [lang, rec] of this.records) {
        obj[lang] = rec;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
      localStorage.setItem(LRU_KEY, JSON.stringify(this.lru));
    } catch {}
  }

  getRecord(lang: LanguageCode): PackRecord {
    const pack = getPackForLanguage(lang);
    if (!isPackConfigured(pack)) {
      return { state: 'unavailable', downloadedBytes: 0, totalBytes: 0 };
    }
    const rec = this.records.get(lang) ?? {
      state: 'not_downloaded',
      downloadedBytes: 0,
      totalBytes: pack.asr.totalBytes,
    };
    return rec;
  }

  getState(lang: LanguageCode): PackState {
    return this.getRecord(lang).state;
  }

  subscribe(observer: PackObserver): () => void {
    this.observers.add(observer);
    return () => {
      this.observers.delete(observer);
    };
  }

  private notify(lang: LanguageCode) {
    const rec = this.getRecord(lang);
    for (const obs of this.observers) {
      obs(rec, lang);
    }
  }

  private setState(lang: LanguageCode, state: PackState, extra: Partial<PackRecord> = {}) {
    const rec = this.getRecord(lang);
    this.records.set(lang, { ...rec, state, ...extra });
    this.saveToStorage();
    this.notify(lang);
  }

  setStateDownloading(lang: LanguageCode, totalBytes: number, downloaded: number) {
    this.setState(lang, 'downloading', { totalBytes, downloadedBytes: downloaded });
  }

  setStateReady(lang: LanguageCode) {
    const pack = getPackForLanguage(lang);
    this.setState(lang, 'ready', { downloadedBytes: 0, totalBytes: pack?.asr.totalBytes ?? 0 });
  }

  setStateFailed(lang: LanguageCode, error: string) {
    this.setState(lang, 'failed', { error });
  }

  private promoteToLru(lang: LanguageCode) {
    this.lru = this.lru.filter((l) => l !== lang);
    this.lru.push(lang);
    while (this.lru.length > MAX_CACHED_PACKS) {
      const evicted = this.lru.shift();
      if (evicted) {
        this.setState(evicted, 'not_downloaded');
      }
    }
    this.saveToStorage();
  }

  canDownload(lang: LanguageCode): { ok: boolean; reason?: string } {
    const pack = getPackForLanguage(lang);
    if (!pack) return { ok: false, reason: 'No pack defined for this language' };

    if (!isPackConfigured(pack)) {
      return { ok: false, reason: 'Pack not yet configured with real artifacts' };
    }

    const rec = this.getRecord(lang);
    if (rec.state === 'ready') return { ok: true };
    if (rec.state === 'downloading') return { ok: false, reason: 'Download already in progress' };

    if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
      const needed = pack.asr.totalBytes;
      navigator.storage.estimate().then((estimate) => {
        const available = (estimate.quota || 0) - (estimate.usage || 0);
        if (available < needed * 1.5) {
          this.notify(lang);
        }
      });
    }

    return { ok: true };
  }

  /**
   * URLs of every file the shared ASR model needs. The model ships inside
   * `public/models`, so "downloading" a pack is really verifying that the
   * origin already serves those files.
   */
  async getArtifactUrls(lang: LanguageCode): Promise<string[]> {
    const pack = getPackForLanguage(lang);
    if (!pack) return [];
    return pack.asr.files.map(getArtifactUrl);
  }
}

export const packStateManager = new PackStateManager();
