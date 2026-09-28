/**
 * Every supported language must carry the same voice-chat keys, otherwise a
 * beneficiary hears Hindi (or a raw key name) after picking their own language.
 */

import { describe, it, expect } from 'vitest';
import { LanguageCode } from '../types';
import { TRANSLATIONS, getUiText } from '../services/translations';

const LANGUAGE_CODES = Object.keys(TRANSLATIONS) as LanguageCode[];

const VOICE_CHAT_KEYS = [
  'districtAudioPrompt',
  'welcomeGreeting',
  'samplePhrase1',
  'samplePhrase2',
  'samplePhrase3',
  'serverError',
  'voiceUnavailable',
  'noAudioDetected',
  'replayAudio',
  'tapToSpeak',
];

describe('voice-chat localization coverage', () => {
  it('defines a translation table for every offered language', () => {
    for (const code of LANGUAGE_CODES) {
      expect(TRANSLATIONS[code], `missing table for ${code}`).toBeDefined();
    }
  });

  it.each(LANGUAGE_CODES)('%s has every voice-chat key', (code) => {
    const table = TRANSLATIONS[code];
    for (const key of VOICE_CHAT_KEYS) {
      expect(table[key], `${code} is missing ${key}`).toBeTruthy();
    }
  });

  it.each(LANGUAGE_CODES)('%s never falls back to Hindi for voice prompts', (code) => {
    const hi = TRANSLATIONS['hi-IN'];
    const table = TRANSLATIONS[code];
    const leaks = VOICE_CHAT_KEYS.filter(
      (key) => code !== 'hi-IN' && table[key] === hi[key]
    );
    expect(leaks, `${code} still uses the Hindi copy for: ${leaks.join(', ')}`).toEqual([]);
  });

  it('resolves unknown keys to a readable string rather than undefined', () => {
    expect(getUiText('en-IN', 'definitelyMissingKey')).toBe('definitelyMissingKey');
  });
});
