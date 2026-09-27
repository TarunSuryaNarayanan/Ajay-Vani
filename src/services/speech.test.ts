/**
 * Tests for speech.ts — covers language mapping and the empty-transcript
 * contract (D18).
 */

vi.mock('onnxruntime-web', () => ({}));

import { describe, it, expect } from 'vitest';
import { speechService } from './speech';

describe('toBhashiniLang (via SpeechService)', () => {
  const cases: Array<[string, string]> = [
    ['hi-IN', 'hi'],
    ['hi', 'hi'],
    ['bho-IN', 'bho'],
    ['bho', 'bho'],
    ['bun-IN', 'hi'],
    ['chg-IN', 'hi'],
    ['mai-IN', 'mai'],
    ['ta-IN', 'ta'],
    ['te-IN', 'te'],
    ['mr-IN', 'mr'],
    ['bn-IN', 'bn'],
    ['unknown', 'hi'],
  ];

  it.each(cases)('maps %s -> %s', (input, expected) => {
    const result = (speechService as any).toBhashiniLang(input);
    expect(result).toBe(expected);
  });
});

describe('empty transcript contract (D18)', () => {
  it('returns success:false with empty transcript, not success:true', async () => {
    const result = await (speechService as any).recognizeWithFallback('', 'hi-IN');
    expect(result.success).toBe(false);
    expect(result.transcript).toBe('');
  });
});
