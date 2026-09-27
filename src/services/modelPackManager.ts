import { LanguageCode } from '../types';

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

export interface LanguagePack {
  readonly languageCode: LanguageCode;
  readonly effectiveLanguage: string;
  readonly displayName: string;
  readonly displayNameNative: string;
  readonly asr: { tiny: PackArtifact; base: PackArtifact };
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

export const LANGUAGE_PACKS: Record<LanguageCode, LanguagePack> = {
  'hi-IN': {
    languageCode: 'hi-IN',
    effectiveLanguage: 'hi',
    displayName: 'Hindi',
    displayNameNative: 'हिंदी',
    asr: {
      tiny: {
        path: 'whisper-tiny-hi/q8_0/a1b2c3d4.onnx',
        size: 42 * 1024 * 1024,
        sha256: 'a1b2c3d4placeholder_sha256_tiny_hi_placeholder000000000000000',
      },
      base: {
        path: 'whisper-base-hi/q8_0/e5f6g7h8.onnx',
        size: 78 * 1024 * 1024,
        sha256: 'e5f6g7h8placeholder_sha256_base_hi_placeholder0000000000000',
      },
    },
    tts: {
      path: 'piper/hi_IN-pratham-medium.onnx',
      size: 64 * 1024 * 1024,
      sha256: 'piper_hi_placeholder_sha256_placeholder0000000000000',
    },
  },
  'bho-IN': {
    languageCode: 'bho-IN',
    effectiveLanguage: 'hi',
    displayName: 'Bhojpuri',
    displayNameNative: 'भोजपुरी',
    asr: {
      tiny: {
        path: 'whisper-tiny-hi/q8_0/a1b2c3d4.onnx',
        size: 42 * 1024 * 1024,
        sha256: 'a1b2c3d4placeholder_sha256_tiny_hi_placeholder000000000000000',
      },
      base: {
        path: 'whisper-base-hi/q8_0/e5f6g7h8.onnx',
        size: 78 * 1024 * 1024,
        sha256: 'e5f6g7h8placeholder_sha256_base_hi_placeholder0000000000000',
      },
    },
    tts: null,
    note: 'Aliased to Hindi pack — no dedicated offline model exists for Bhojpuri.',
  },
  'bun-IN': {
    languageCode: 'bun-IN',
    effectiveLanguage: 'hi',
    displayName: 'Bundeli',
    displayNameNative: 'बुंदेली',
    asr: {
      tiny: {
        path: 'whisper-tiny-hi/q8_0/a1b2c3d4.onnx',
        size: 42 * 1024 * 1024,
        sha256: 'a1b2c3d4placeholder_sha256_tiny_hi_placeholder000000000000000',
      },
      base: {
        path: 'whisper-base-hi/q8_0/e5f6g7h8.onnx',
        size: 78 * 1024 * 1024,
        sha256: 'e5f6g7h8placeholder_sha256_base_hi_placeholder0000000000000',
      },
    },
    tts: null,
    note: 'Aliased to Hindi pack — no dedicated offline model exists for Bundeli.',
  },
  'chg-IN': {
    languageCode: 'chg-IN',
    effectiveLanguage: 'hi',
    displayName: 'Chhattisgarhi',
    displayNameNative: 'छत्तीसगढ़ी',
    asr: {
      tiny: {
        path: 'whisper-tiny-hi/q8_0/a1b2c3d4.onnx',
        size: 42 * 1024 * 1024,
        sha256: 'a1b2c3d4placeholder_sha256_tiny_hi_placeholder000000000000000',
      },
      base: {
        path: 'whisper-base-hi/q8_0/e5f6g7h8.onnx',
        size: 78 * 1024 * 1024,
        sha256: 'e5f6g7h8placeholder_sha256_base_hi_placeholder0000000000000',
      },
    },
    tts: null,
    note: 'Aliased to Hindi pack — no dedicated offline model exists for Chhattisgarhi.',
  },
  'mai-IN': {
    languageCode: 'mai-IN',
    effectiveLanguage: 'hi',
    displayName: 'Maithili',
    displayNameNative: 'मैथिली',
    asr: {
      tiny: {
        path: 'whisper-tiny-hi/q8_0/a1b2c3d4.onnx',
        size: 42 * 1024 * 1024,
        sha256: 'a1b2c3d4placeholder_sha256_tiny_hi_placeholder000000000000000',
      },
      base: {
        path: 'whisper-base-hi/q8_0/e5f6g7h8.onnx',
        size: 78 * 1024 * 1024,
        sha256: 'e5f6g7h8placeholder_sha256_base_hi_placeholder0000000000000',
      },
    },
    tts: null,
    note: 'Aliased to Hindi pack — no dedicated offline model exists for Maithili.',
  },
  'ta-IN': {
    languageCode: 'ta-IN',
    effectiveLanguage: 'ta',
    displayName: 'Tamil',
    displayNameNative: 'தமிழ்',
    asr: {
      tiny: {
        path: 'whisper-tiny-ta/q8_0/b3c4d5e6.onnx',
        size: 42 * 1024 * 1024,
        sha256: 'b3c4d5e6placeholder_sha256_tiny_ta_placeholder000000000000000',
      },
      base: {
        path: 'whisper-base-ta/q8_0/f7g8h9i0.onnx',
        size: 78 * 1024 * 1024,
        sha256: 'f7g8h9i0placeholder_sha256_base_ta_placeholder0000000000000',
      },
    },
    tts: null,
    note: 'Offline TTS not yet available for Tamil. Uses Bhashini Enhanced mode.',
  },
  'te-IN': {
    languageCode: 'te-IN',
    effectiveLanguage: 'te',
    displayName: 'Telugu',
    displayNameNative: 'తెలుగు',
    asr: {
      tiny: {
        path: 'whisper-tiny-te/q8_0/c5d6e7f8.onnx',
        size: 42 * 1024 * 1024,
        sha256: 'c5d6e7f8placeholder_sha256_tiny_te_placeholder000000000000000',
      },
      base: {
        path: 'whisper-base-te/q8_0/g9h0i1j2.onnx',
        size: 78 * 1024 * 1024,
        sha256: 'g9h0i1j2placeholder_sha256_base_te_placeholder0000000000000',
      },
    },
    tts: null,
    note: 'Offline TTS not yet available for Telugu. Uses Bhashini Enhanced mode.',
  },
  'mr-IN': {
    languageCode: 'mr-IN',
    effectiveLanguage: 'mr',
    displayName: 'Marathi',
    displayNameNative: 'मराठी',
    asr: {
      tiny: {
        path: 'whisper-tiny-mr/q8_0/d7e8f9a0.onnx',
        size: 42 * 1024 * 1024,
        sha256: 'd7e8f9a0placeholder_sha256_tiny_mr_placeholder000000000000000',
      },
      base: {
        path: 'whisper-base-mr/q8_0/h1i2j3k4.onnx',
        size: 78 * 1024 * 1024,
        sha256: 'h1i2j3k4placeholder_sha256_base_mr_placeholder0000000000000',
      },
    },
    tts: null,
    note: 'Offline TTS not yet available for Marathi. Uses Bhashini Enhanced mode.',
  },
  'bn-IN': {
    languageCode: 'bn-IN',
    effectiveLanguage: 'bn',
    displayName: 'Bengali',
    displayNameNative: 'বাংলা',
    asr: {
      tiny: {
        path: 'whisper-tiny-bn/q8_0/e9f0a1b2.onnx',
        size: 42 * 1024 * 1024,
        sha256: 'e9f0a1b2placeholder_sha256_tiny_bn_placeholder000000000000000',
      },
      base: {
        path: 'whisper-base-bn/q8_0/i3j4k5l6.onnx',
        size: 78 * 1024 * 1024,
        sha256: 'i3j4k5l6placeholder_sha256_base_bn_placeholder0000000000000',
      },
    },
    tts: null,
    note: 'Offline TTS not yet available for Bengali. Uses Bhashini Enhanced mode.',
  },
};

export const EFFECTIVE_LANGUAGES = ['hi', 'ta', 'te', 'mr', 'bn'] as const;

export type EffectiveLanguage = (typeof EFFECTIVE_LANGUAGES)[number];

export const ALIASED_LANGUAGES: LanguageCode[] = ['bho-IN', 'bun-IN', 'chg-IN', 'mai-IN'];

export function getPackForLanguage(lang: LanguageCode): LanguagePack {
  return LANGUAGE_PACKS[lang];
}

export function getEffectiveLanguage(lang: LanguageCode): EffectiveLanguage {
  const pack = LANGUAGE_PACKS[lang];
  return pack.effectiveLanguage as EffectiveLanguage;
}

export function getArtifactUrl(artifact: PackArtifact): string {
  const base = getModelBaseUrlSync();
  const trimmed = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${trimmed}/${artifact.path}`;
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
    if (!pack || pack.asr.tiny.sha256.includes('placeholder')) {
      return { state: 'unavailable', downloadedBytes: 0, totalBytes: 0 };
    }
    const rec = this.records.get(lang) ?? {
      state: 'not_downloaded',
      downloadedBytes: 0,
      totalBytes: 0,
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
    this.setState(lang, 'ready', { downloadedBytes: 0, totalBytes: 0 });
    this.promoteToLru(lang);
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

    if (pack.asr.tiny.sha256.includes('placeholder')) {
      return { ok: false, reason: 'Pack not yet configured with real artifacts' };
    }

    const rec = this.getRecord(lang);
    if (rec.state === 'ready') return { ok: true };
    if (rec.state === 'downloading') return { ok: false, reason: 'Download already in progress' };

    if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
      const needed = pack.asr.tiny.size;
      navigator.storage.estimate().then((estimate) => {
        const available = (estimate.quota || 0) - (estimate.usage || 0);
        if (available < needed * 1.5) {
          this.notify(lang);
        }
      });
    }

    return { ok: true };
  }

  async getDownloadUrl(lang: LanguageCode, tier: QualityTier = 'tiny'): Promise<string | null> {
    const can = this.canDownload(lang);
    if (!can.ok) return null;

    const pack = getPackForLanguage(lang);
    const artifact = tier === 'base' ? pack.asr.base : pack.asr.tiny;
    return getArtifactUrl(artifact);
  }
}

export const packStateManager = new PackStateManager();
