/**
 * The spoken sentence has to be in the script the selected language is
 * synthesised from: espeak-style engines read the text, not a language tag, so
 * Hindi text pushed through a Tamil voice is noise.
 */

import { describe, it, expect } from 'vitest';
import { buildSpokenResponse, localTradeName, normaliseSpokenName } from '../services/spokenResponse';
import { LanguageCode } from '../types';

const base = {
  beneficiaryName: 'रमेश',
  qpCode: 'ELE/Q5901',
  roleName: 'Solar PV Installer & Electrician',
  roleNameHi: 'सोलर पीवी इंस्टॉलर एवं तकनीशियन',
  district: 'Varanasi',
  centreCount: 120,
};

const SCRIPT_RANGES: Record<string, RegExp> = {
  devanagari: /[ऀ-ॿ]/,
  tamil: /[஀-௿]/,
  telugu: /[ఀ-౿]/,
  bengali: /[ঀ-৿]/,
};

describe('buildSpokenResponse', () => {
  it('speaks Devanagari for the Hindi-family languages', () => {
    for (const lang of ['hi-IN', 'bho-IN', 'bun-IN', 'chg-IN', 'mai-IN'] as LanguageCode[]) {
      const text = buildSpokenResponse(lang, base);
      expect(text, lang).toMatch(SCRIPT_RANGES.devanagari);
      expect(text, lang).toContain('Varanasi');
      expect(text, lang).toContain('120');
    }
  });

  it('speaks the script the beneficiary actually selected', () => {
    expect(buildSpokenResponse('ta-IN', base)).toMatch(SCRIPT_RANGES.tamil);
    expect(buildSpokenResponse('te-IN', base)).toMatch(SCRIPT_RANGES.telugu);
    expect(buildSpokenResponse('bn-IN', base)).toMatch(SCRIPT_RANGES.bengali);
    // Marathi shares Devanagari but has its own wording.
    expect(buildSpokenResponse('mr-IN', base)).toContain('नमस्कार');
    expect(buildSpokenResponse('en-IN', base)).toMatch(/^Hello/);
  });

  it('never mixes Devanagari into non-Devanagari languages', () => {
    // Marathi is excluded on purpose: it is written in Devanagari. The danda
    // (।) is a sentence terminator Bengali also uses, so only letters count.
    const hindiLetters = (text: string) => text.replace(/[^ऀ-ॿ]/g, '').replace(/।/g, '');
    for (const lang of ['ta-IN', 'te-IN', 'bn-IN', 'en-IN'] as LanguageCode[]) {
      const text = buildSpokenResponse(lang, base);
      expect(hindiLetters(text), `${lang} leaks Hindi script`).toBe('');
    }
  });

  it('drops a name the selected voice cannot pronounce instead of mangling it', () => {
    const tamil = buildSpokenResponse('ta-IN', base); // base name is Devanagari
    expect(tamil).toMatch(SCRIPT_RANGES.tamil);
    expect(tamil).toContain('தோழர்');
    // A Latin name survives for non-Latin voices.
    expect(buildSpokenResponse('ta-IN', { ...base, beneficiaryName: 'Ramesh' })).toContain('Ramesh');
  });

  it('states the listed-centre count, never a live vacancy count', () => {
    // The number we actually have is how many centres are listed, not how many
    // jobs are open. Saying "12 vacancies" would be a fact the dataset cannot
    // support, so the wording must attach the number to centres instead.
    for (const lang of ['hi-IN', 'en-IN', 'ta-IN', 'te-IN', 'mr-IN', 'bn-IN'] as LanguageCode[]) {
      const text = buildSpokenResponse(lang, { ...base, centreCount: 12 });
      expect(text, `${lang} must carry the count`).toMatch(/12/);
      expect(text, `${lang} must not claim openings`).not.toMatch(
        /openings|vacanc|पद उपलब्ध/i
      );
    }
  });

  it('uses a trade name the target voice can pronounce', () => {
    expect(localTradeName(base, 'hi-IN')).toBe(base.roleNameHi);
    expect(localTradeName(base, 'en-IN')).toBe(base.roleName);
    expect(localTradeName(base, 'ta-IN')).toContain('சோலார்');
    expect(localTradeName(base, 'bn-IN')).toContain('সোলার');
  });

  it('falls back to the English trade name for an unknown QP code', () => {
    expect(localTradeName({ ...base, qpCode: 'ZZ/Q0000' }, 'ta-IN')).toBe(base.roleName);
  });
});

describe('normaliseSpokenName', () => {
  it('drops sentence glue from the spoken name', () => {
    expect(normaliseSpokenName('रमेश है', 'hi-IN')).toBe('रमेश');
    expect(normaliseSpokenName('श्यामू बा', 'bho-IN')).toBe('श्यामू');
    expect(normaliseSpokenName('मैं रमेश', 'hi-IN')).toBe('रमेश');
    expect(normaliseSpokenName('रमेश कुमार हैं', 'hi-IN')).toBe('रमेश कुमार');
  });

  it('falls back to a greeting in the selected language', () => {
    expect(normaliseSpokenName(undefined, 'hi-IN')).toBe('साथी');
    expect(normaliseSpokenName('', 'ta-IN')).toMatch(SCRIPT_RANGES.tamil);
    expect(normaliseSpokenName('है', 'en-IN')).toBe('friend');
  });
});
