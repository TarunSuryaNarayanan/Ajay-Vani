/**
 * Tests for speech.ts — covers language mapping and the empty-transcript
 * contract (D18).
 */

vi.mock('onnxruntime-web', () => ({}));

import { describe, it, expect, afterEach, vi } from 'vitest';
import { speechService, TTS_UNAVAILABLE_EVENT } from './speech';

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

describe('TTS backend fallback chain', () => {
  const lang = 'ta-IN' as any;

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('plays local espeak-ng audio when Bhashini is not configured', async () => {
    const played: string[] = [];
    vi.spyOn((speechService as any), 'tryBhashiniTTS').mockResolvedValue(false);
    vi.spyOn((speechService as any), 'playWavAudio').mockImplementation(async (...args: unknown[]) => {
      played.push(args[0] as string);
    });

    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('/api/tts/local')) {
        return { ok: true, json: async () => ({ success: true, audioBase64: 'd2F2', samplingRate: 22050 }) };
      }
      throw new Error('unexpected fetch ' + url);
    }));

    await (speechService as any).tryLocalServerTTS('வணக்கம்', lang);
    expect(played).toEqual(['d2F2']);
  });

  it('returns false when the host has no espeak-ng', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false,
      json: async () => ({ success: false, error: 'espeak-ng is not installed on this host.' }),
    })));

    const result = await (speechService as any).tryLocalServerTTS('नमस्ते', 'hi-IN');
    expect(result).toBe(false);
  });

  it('reports availability from /api/health', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ localTtsAvailable: true }) })));
    await expect(speechService.isLocalTtsAvailable()).resolves.toBe(true);
  });

  it('announces the failure instead of failing silently when nothing is available', async () => {    const seen: any[] = [];
    const listener = (e: Event) => seen.push((e as CustomEvent).detail);
    window.addEventListener(TTS_UNAVAILABLE_EVENT, listener);

    vi.spyOn((speechService as any), 'tryBhashiniTTS').mockResolvedValue(false);
    vi.spyOn((speechService as any), 'tryLocalServerTTS').mockResolvedValue(false);

    const onError = vi.fn();
    await (speechService as any).speak('नमस्ते', 'hi-IN', undefined, undefined, onError);

    expect(seen).toEqual([{ lang: 'hi-IN' }]);
    expect(onError).toHaveBeenCalledOnce();

    window.removeEventListener(TTS_UNAVAILABLE_EVENT, listener);
  });
});

describe('browser autoplay unlock', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  /** Minimal AudioContext double: starts suspended, resumes on a real gesture. */
  function makeSuspendedCtx() {
    const source = {
      onended: null as any,
      connect: vi.fn(),
      // A real AudioBufferSource fires onended when playback finishes.
      start: vi.fn(() => setTimeout(() => source.onended?.(), 0)),
    };
    const ctx: any = {
      state: 'suspended' as string,
      unlocked: false,
      // Browsers reject resume() until the page has been interacted with.
      resume: vi.fn(async function (this: any) {
        if (!this.unlocked) throw new Error('AudioContext was not allowed to start');
        this.state = 'running';
      }),
      createBufferSource: () => source,
      createGain: () => ({ gain: { value: 1 }, connect: vi.fn() }),
      destination: {},
      close: vi.fn(),
      decodeAudioData: (_buf: ArrayBuffer, ok: (b: any) => void) => ok({ id: 'buffer' }),
    };
    return ctx;
  }

  it('waits for the first user gesture instead of dropping the opening prompt', async () => {
    const ctx = makeSuspendedCtx();
    vi.stubGlobal('AudioContext', vi.fn(() => ctx));
    (speechService as any).audioCtx = null;

    // 1x1 silent PCM in a WAV container, base64 encoded.
    const wav = btoa(
      'RIFF' +
        String.fromCharCode(36, 0, 0, 0) +
        'WAVEfmt ' +
        String.fromCharCode(16, 0, 0, 0, 1, 0, 1, 0, 0x44, 0xac, 0, 0, 0x88, 0x58, 1, 0, 2, 0, 16, 0) +
        'data' +
        String.fromCharCode(2, 0, 0, 0, 0, 0)
    );

    let done = false;
    const playing = (speechService as any)
      .playWavAudio(wav, 22050)
      .then(() => { done = true; });

    await new Promise((r) => setTimeout(r, 10));
    expect(done).toBe(false); // still waiting: nothing has been heard yet

    // The user taps: from here on the browser allows audio.
    ctx.unlocked = true;
    document.dispatchEvent(new Event('pointerdown'));
    await playing;
    expect(done).toBe(true);
    expect(ctx.resume).toHaveBeenCalled();
  });
});
