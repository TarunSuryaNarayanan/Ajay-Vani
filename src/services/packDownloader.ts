import { LanguageCode } from '../types';
import {
  packStateManager,
  getPackForLanguage,
  getArtifactUrl,
  getAsrModelUrl,
  PackArtifact,
  QualityTier,
  isPackConfigured,
} from './modelPackManager';

export interface DownloadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface DownloadOptions {
  onProgress?: (progress: DownloadProgress) => void;
  signal?: AbortSignal;
}

export class PackDownloader {
  /**
   * ASR is one shared model directory served by the app itself, so this
   * "download" verifies that every required file is actually present on the
   * origin and flips the pack to `ready`. The `tier` argument is accepted for
   * call-site compatibility; there is only one local ASR model.
   */
  async downloadPack(
    lang: LanguageCode,
    _tier: QualityTier = 'tiny',
    options?: DownloadOptions
  ): Promise<{ success: boolean; error?: string }> {
    const can = packStateManager.canDownload(lang);
    if (!can.ok) {
      return { success: false, error: can.reason || 'Cannot download' };
    }

    const pack = getPackForLanguage(lang);
    if (!pack || !isPackConfigured(pack)) {
      return { success: false, error: 'Pack not configured with real artifacts' };
    }

    const files = pack.asr.files;
    const total = files.reduce((sum, f) => sum + f.size, 0);
    packStateManager.setStateDownloading(lang, total, 0);

    let loaded = 0;
    try {
      for (const file of files) {
        if (options?.signal?.aborted) {
          return { success: false, error: 'Download aborted' };
        }
        const url = getArtifactUrl(file);
        const res = await fetch(url, { method: 'HEAD', signal: options?.signal });
        if (!res.ok) {
          packStateManager.setStateFailed(lang, `Missing model file: ${file.path} (HTTP ${res.status})`);
          return { success: false, error: `Missing model file: ${file.path}` };
        }
        loaded += file.size;
        options?.onProgress?.({
          loaded,
          total,
          percentage: Math.round((loaded / total) * 100),
        });
      }
    } catch (err: any) {
      packStateManager.setStateFailed(lang, err.message || 'Download failed');
      return { success: false, error: err.message };
    }

    packStateManager.setStateReady(lang);
    return { success: true };
  }

  /**
   * Cheap offline check used before the first transcription: does the origin
   * serve the shared model directory? Lets a pack that already ships inside
   * `public/models` reach `ready` with no network download at all.
   */
  async isPackPresent(lang: LanguageCode): Promise<boolean> {
    const pack = getPackForLanguage(lang);
    if (!pack || !isPackConfigured(pack)) return false;
    const [config, ...rest] = pack.asr.files;
    try {
      const configRes = await fetch(getArtifactUrl(config), { method: 'HEAD' });
      if (!configRes.ok) return false;
      for (const file of rest) {
        const res = await fetch(getArtifactUrl(file), { method: 'HEAD' });
        if (!res.ok) return false;
      }
    } catch {
      return false;
    }
    return true;
  }

  isPackCached(lang: LanguageCode): boolean {
    return packStateManager.getRecord(lang).state === 'ready';
  }

  /** Directory transformers.js should load, e.g. `/models/whisper-tiny`. */
  getPackUrl(lang: LanguageCode, _tier: QualityTier = 'tiny'): string | null {
    try {
      const pack = getPackForLanguage(lang);
      if (!pack) return null;
      return getAsrModelUrl(pack);
    } catch {
      return null;
    }
  }

  /** All artifact URLs, for callers that need the individual files. */
  getArtifactUrls(lang: LanguageCode): string[] {
    try {
      const pack = getPackForLanguage(lang);
      if (!pack) return [];
      return pack.asr.files.map((f: PackArtifact) => getArtifactUrl(f));
    } catch {
      return [];
    }
  }
}

export const packDownloader = new PackDownloader();
