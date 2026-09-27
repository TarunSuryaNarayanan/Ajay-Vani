import { LanguageCode } from '../types';
import { QualityTier } from './modelPackManager';
import { packStateManager, getPackForLanguage, getArtifactUrl, getModelBaseUrlSync } from './modelPackManager';

const PACK_CACHE_NAME = 'ajay-vani-pack-cache-v1';

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
  async downloadPack(
    lang: LanguageCode,
    tier: QualityTier = 'tiny',
    options?: DownloadOptions
  ): Promise<{ success: boolean; error?: string }> {
    const can = packStateManager.canDownload(lang);
    if (!can.ok) {
      return { success: false, error: can.reason || 'Cannot download' };
    }

    const pack = getPackForLanguage(lang);
    const artifact = tier === 'base' ? pack.asr.base : pack.asr.tiny;
    const url = getArtifactUrl(artifact);

    if (!this.supportsStreaming()) {
      return this.downloadSimple(lang, artifact, url, options);
    }

    return this.downloadWithResume(lang, artifact, url, options);
  }

  private supportsStreaming(): boolean {
    return typeof ReadableStream !== 'undefined' && typeof fetch !== 'undefined';
  }

  private async downloadWithResume(
    lang: LanguageCode,
    artifact: { path: string; size: number; sha256: string },
    url: string,
    options?: DownloadOptions
  ): Promise<{ success: boolean; error?: string }> {
    packStateManager.setStateDownloading(lang, artifact.size, 0);

    try {
      let start = 0;
      const resumeHeaders: Record<string, string> = {};

      const saved = await this.resumeOffset(lang);
      if (saved > 0 && saved < artifact.size) {
        start = saved;
        resumeHeaders['Range'] = `bytes=${start}-`;
      }

      const response = await fetch(url, {
        headers: resumeHeaders,
        signal: options?.signal,
      });

      if (!response.ok) {
        if (start > 0) {
          return this.downloadSimple(lang, artifact, url, options);
        }
        return { success: false, error: `HTTP ${response.status}` };
      }

      const contentLength = response.headers.get('Content-Length');
      const total = contentLength
        ? start + parseInt(contentLength, 10)
        : artifact.size;

      if (!response.body) {
        return this.downloadSimple(lang, artifact, url, options);
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let loaded = start;

      try {
        // Read existing partial if resuming
        if (start > 0) {
          const existing = await this.getPartial(lang);
          if (existing && existing.length === start) {
            chunks.push(existing);
          } else {
            start = 0;
            chunks.length = 0;
          }
        }

        while (true) {
          if (options?.signal?.aborted) {
            await this.savePartial(lang, chunks);
            return { success: false, error: 'Download aborted' };
          }

          const { done, value } = await reader.read();
          if (done) break;

          if (value && value.length > 0) {
            chunks.push(value);
            loaded += value.length;
            options?.onProgress?.({
              loaded,
              total,
              percentage: Math.round((loaded / total) * 100),
            });
            await this.savePartial(lang, chunks);
          }
        }
      } finally {
        reader.releaseLock();
      }

      const blob = new Blob(chunks as unknown as BlobPart[]);
      await this.clearPartial(lang);

      const hashValid = await this.verifySha256(blob, artifact.sha256);
      if (!hashValid) {
        packStateManager.setStateFailed(lang, 'Integrity check failed (sha256 mismatch)');
        return { success: false, error: 'Integrity check failed' };
      }

      await this.cachePack(lang, blob, url);
      packStateManager.setStateReady(lang);

      return { success: true };
    } catch (err: any) {
      packStateManager.setStateFailed(lang, err.message || 'Download failed');
      return { success: false, error: err.message };
    }
  }

  private async downloadSimple(
    lang: LanguageCode,
    artifact: { path: string; size: number; sha256: string },
    url: string,
    options?: DownloadOptions
  ): Promise<{ success: boolean; error?: string }> {
    packStateManager.setStateDownloading(lang, artifact.size, 0);

    try {
      const response = await fetch(url, { signal: options?.signal });
      if (!response.ok) {
        packStateManager.setStateFailed(lang, `HTTP ${response.status}`);
        return { success: false, error: `HTTP ${response.status}` };
      }

      const contentLength = response.headers.get('Content-Length');
      const total = contentLength ? parseInt(contentLength, 10) : artifact.size;
      const reader = response.body?.getReader();

      if (!reader) {
        const blob = await response.blob();
        await this.completeDownload(lang, artifact, url, blob, options);
        return { success: true };
      }

      const chunks: Uint8Array[] = [];
      let loaded = 0;

      try {
        while (true) {
          if (options?.signal?.aborted) {
            return { success: false, error: 'Download aborted' };
          }
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            loaded += value.length;
            options?.onProgress?.({
              loaded,
              total,
              percentage: Math.round((loaded / total) * 100),
            });
          }
        }
      } finally {
        reader.releaseLock();
      }

      const blob = new Blob(chunks as unknown as BlobPart[]);
      await this.completeDownload(lang, artifact, url, blob, options);
      return { success: true };
    } catch (err: any) {
      packStateManager.setStateFailed(lang, err.message || 'Download failed');
      return { success: false, error: err.message };
    }
  }

  private async completeDownload(
    lang: LanguageCode,
    artifact: { path: string; size: number; sha256: string },
    url: string,
    blob: Blob,
    options?: DownloadOptions
  ): Promise<void> {
    const hashValid = await this.verifySha256(blob, artifact.sha256);
    if (!hashValid) {
      packStateManager.setStateFailed(lang, 'Integrity check failed (sha256 mismatch)');
      throw new Error('Integrity check failed');
    }
    await this.cachePack(lang, blob, url);
    packStateManager.setStateReady(lang);
  }

  private async verifySha256(blob: Blob, expectedHash: string): Promise<boolean> {
    if (expectedHash.startsWith('placeholder') || expectedHash.length < 32) {
      return true;
    }

    try {
      const buffer = await blob.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      return hashHex.toLowerCase() === expectedHash.toLowerCase();
    } catch {
      return false;
    }
  }

  private partialKey(lang: LanguageCode): string {
    return `ajay-vani-partial-${lang}`;
  }

  private async resumeOffset(lang: LanguageCode): Promise<number> {
    try {
      const raw = localStorage.getItem(this.partialKey(lang));
      return raw ? parseInt(raw, 10) : 0;
    } catch {
      return 0;
    }
  }

  private async savePartial(lang: LanguageCode, chunks: Uint8Array[]): Promise<void> {
    try {
      const blob = new Blob(chunks as unknown as BlobPart[]);
      const base64 = await this.toBase64(blob);
      localStorage.setItem(this.partialKey(lang), base64.length.toString());
    } catch {}
  }

  private async getPartial(lang: LanguageCode): Promise<Uint8Array | null> {
    return null;
  }

  private async clearPartial(lang: LanguageCode): Promise<void> {
    try {
      localStorage.removeItem(this.partialKey(lang));
    } catch {}
  }

  private async toBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private async cachePack(lang: LanguageCode, blob: Blob, url: string): Promise<void> {
    packStateManager.setStateDownloading(lang, 0, 0);

    try {
      const cache = await caches.open(PACK_CACHE_NAME);
      await cache.put(url, new Response(blob));
    } catch (err) {
      console.warn('[PackDownloader] Direct cache failed, falling back to SW message:', err);
    }

    const sw = navigator.serviceWorker?.controller;
    if (sw) {
      await new Promise<void>((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = () => resolve();
        sw.postMessage(
          { type: 'CACHE_PACK', lang, baseUrl: getModelBaseUrlSync(), url, blob },
          [channel.port2]
        );
        setTimeout(() => resolve(), 5000);
      });
    }
  }

  async isPackCached(lang: LanguageCode): Promise<boolean> {
    const record = packStateManager.getRecord(lang);
    return record.state === 'ready';
  }

  getPackUrl(lang: LanguageCode, tier: QualityTier = 'tiny'): string | null {
    try {
      const pack = getPackForLanguage(lang);
      const artifact = tier === 'base' ? pack.asr.base : pack.asr.tiny;
      return getArtifactUrl(artifact);
    } catch {
      return null;
    }
  }
}

export const packDownloader = new PackDownloader();