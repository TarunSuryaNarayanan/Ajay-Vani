import { describe, it, expect } from 'vitest';
import {
  LANGUAGE_PACKS,
  getPackForLanguage,
  getEffectiveLanguage,
  getArtifactUrl,
  ALIASED_LANGUAGES,
  EFFECTIVE_LANGUAGES,
  packStateManager,
  PackState,
} from './modelPackManager';

describe('LanguagePack manifest', () => {
  it('defines all 9 language codes', () => {
    const codes = Object.keys(LANGUAGE_PACKS);
    expect(codes).toHaveLength(9);
    expect(codes).toContain('hi-IN');
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

  it('ASR packs use content-addressed paths', () => {
    const hi = getPackForLanguage('hi-IN');
    expect(hi.asr.tiny.path).toMatch(/a1b2c3d4\.onnx/);
    expect(hi.asr.base.path).toMatch(/e5f6g7h8\.onnx/);
  });

  it('getEffectiveLanguage maps correctly', () => {
    expect(getEffectiveLanguage('hi-IN')).toBe('hi');
    expect(getEffectiveLanguage('bho-IN')).toBe('hi');
    expect(getEffectiveLanguage('ta-IN')).toBe('ta');
    expect(getEffectiveLanguage('bn-IN')).toBe('bn');
  });

  it('getArtifactUrl constructs full URL', () => {
    const hi = getPackForLanguage('hi-IN');
    const url = getArtifactUrl(hi.asr.tiny);
    expect(url).toContain('/models/');
    expect(url).toContain(hi.asr.tiny.path);
  });

  it('EFFECTIVE_LANGUAGES has 5 entries', () => {
    expect(EFFECTIVE_LANGUAGES).toHaveLength(5);
    expect(EFFECTIVE_LANGUAGES).toContain('hi');
    expect(EFFECTIVE_LANGUAGES).toContain('ta');
  });
});

describe('PackStateManager', () => {
  it('returns unavailable for placeholder packs', () => {
    const rec = packStateManager.getRecord('hi-IN');
    expect(rec.state).toBe('unavailable');
  });

  it('getState returns current state', () => {
    expect(packStateManager.getState('hi-IN')).toBe('unavailable');
  });
});
