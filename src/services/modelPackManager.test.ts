import { describe, it, expect } from 'vitest';
import {
  LANGUAGE_PACKS,
  getPackForLanguage,
  getEffectiveLanguage,
  getArtifactUrl,
  getAsrModelUrl,
  isPackConfigured,
  ALIASED_LANGUAGES,
  EFFECTIVE_LANGUAGES,
  packStateManager,
  LanguagePack,
  PackState,
} from './modelPackManager';

describe('LanguagePack manifest', () => {
  it('defines all 10 language codes', () => {
    const codes = Object.keys(LANGUAGE_PACKS);
    expect(codes).toHaveLength(10);
    expect(codes).toContain('hi-IN');
    expect(codes).toContain('en-IN');
    expect(codes).toContain('bho-IN');
    expect(codes).toContain('bn-IN');
  });

  it('aliases bho/bun/chg/mai to Hindi', () => {
    for (const lang of ALIASED_LANGUAGES) {
      const pack = getPackForLanguage(lang);
      expect(pack.effectiveLanguage).toBe('hi');
      expect(pack.tts).toBeNull();
      expect(pack.note).toBeTruthy();
    }
  });

  it('Hindi has a TTS pack (Piper)', () => {
    const hi = getPackForLanguage('hi-IN');
    expect(hi.tts).not.toBeNull();
    expect(hi.tts?.path).toContain('pratham');
  });

  it('Other effective languages have no TTS', () => {
    const noTts = ['ta-IN', 'te-IN', 'mr-IN', 'bn-IN'] as const;
    for (const lang of noTts) {
      const pack = getPackForLanguage(lang);
      expect(pack.tts).toBeNull();
    }
  });

  it('ASR packs use the shared local model directory', () => {
    const hi = getPackForLanguage('hi-IN');
    expect(hi.asr.modelId).toBe('whisper-tiny');
    expect(hi.asr.files.map((f) => f.path)).toContain('onnx/encoder_model_quantized.onnx');
    expect(hi.asr.files.map((f) => f.path)).toContain('onnx/decoder_model_merged_quantized.onnx');
  });

  it('every language shares the same ASR model files', () => {
    const reference = getPackForLanguage('hi-IN').asr;
    for (const lang of Object.keys(LANGUAGE_PACKS) as Array<keyof typeof LANGUAGE_PACKS>) {
      expect(getPackForLanguage(lang).asr).toBe(reference);
    }
  });

  it('every ASR artifact has a real size and a full sha256 (no placeholders)', () => {
    for (const lang of Object.keys(LANGUAGE_PACKS) as Array<keyof typeof LANGUAGE_PACKS>) {
      const asr = getPackForLanguage(lang).asr;
      expect(asr.files.length).toBeGreaterThan(0);
      for (const file of asr.files) {
        expect(file.path).not.toContain('placeholder');
        expect(file.sha256).toMatch(/^[0-9a-f]{64}$/);
        expect(file.size).toBeGreaterThan(0);
      }
      const summed = asr.files.reduce((n, f) => n + f.size, 0);
      expect(summed).toBe(asr.totalBytes);
    }
  });

  it('isPackConfigured rejects a manifest that still holds placeholder hashes', () => {
    const placeholderPack: LanguagePack = {
      ...getPackForLanguage('hi-IN'),
      asr: {
        ...getPackForLanguage('hi-IN').asr,
        files: [
          {
            path: 'onnx/encoder_model_quantized.onnx',
            size: 1234,
            sha256: 'a1b2c3d4placeholder_sha256',
          },
        ],
        totalBytes: 1234,
      },
    };
    expect(isPackConfigured(placeholderPack)).toBe(false);
    expect(isPackConfigured(getPackForLanguage('hi-IN'))).toBe(true);
  });

  it('getEffectiveLanguage maps correctly', () => {
    expect(getEffectiveLanguage('hi-IN')).toBe('hi');
    expect(getEffectiveLanguage('bho-IN')).toBe('hi');
    expect(getEffectiveLanguage('ta-IN')).toBe('ta');
    expect(getEffectiveLanguage('bn-IN')).toBe('bn');
  });

  it('getArtifactUrl constructs full URL', () => {
    const hi = getPackForLanguage('hi-IN');
    const url = getArtifactUrl(hi.asr.files[0]);
    expect(url).toContain('/models/');
    expect(url).toContain(hi.asr.files[0].path);
  });

  it('getAsrModelUrl points at the shared model directory', () => {
    const url = getAsrModelUrl(getPackForLanguage('bn-IN'));
    expect(url).toBe('/models/whisper-tiny');
  });

  it('EFFECTIVE_LANGUAGES has 6 entries', () => {
    expect(EFFECTIVE_LANGUAGES).toHaveLength(6);
    expect(EFFECTIVE_LANGUAGES).toContain('hi');
    expect(EFFECTIVE_LANGUAGES).toContain('en');
    expect(EFFECTIVE_LANGUAGES).toContain('ta');
  });
});

describe('PackStateManager', () => {
  it('reports a real manifest as downloadable, never unavailable', () => {
    const rec = packStateManager.getRecord('hi-IN');
    expect(rec.state).not.toBe('unavailable');
    expect(packStateManager.canDownload('hi-IN').ok).toBe(true);
  });

  it('getState returns current state', () => {
    const state: PackState = packStateManager.getState('hi-IN');
    expect(['not_downloaded', 'downloading', 'ready', 'failed']).toContain(state);
  });

  it('setStateReady flips the pack to ready without any download', () => {
    packStateManager.setStateReady('bn-IN');
    expect(packStateManager.getState('bn-IN')).toBe('ready');
  });
});
