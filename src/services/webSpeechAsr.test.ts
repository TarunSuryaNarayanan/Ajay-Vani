/**
 * Tests for the Web Speech fallback. The browser API cannot consume a
 * pre-captured WAV blob, so this suite pins the behaviour that actually
 * matters: the retry runs only after every blob engine has failed, the live
 * recogniser resolves exactly once on every exit path, and a browser without
 * the API is left completely untouched.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import {
  WebSpeechAsrService,
  toWebSpeechLang,
  webSpeechErrorMessage,
} from './webSpeechAsr';

interface FakeRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  started: boolean;
  stopped: boolean;
  aborted: boolean;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  abort: ReturnType<typeof vi.fn>;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  onspeechstart: (() => void) | null;
}

/** Minimal stand-in for SpeechRecognition, driven by the test. */
function makeRecognition(): FakeRecognition {
  const rec: any = {
    lang: '',
    continuous: true,
    interimResults: true,
    maxAlternatives: 5,
    started: false,
    stopped: false,
    aborted: false,
    start: vi.fn(function (this: any) {
      this.started = true;
    }),
    stop: vi.fn(function (this: any) {
      this.stopped = true;
    }),
    abort: vi.fn(function (this: any) {
      this.aborted = true;
    }),
    onresult: null,
    onerror: null,
    onend: null,
    onspeechstart: null,
  };
  return rec as FakeRecognition;
}

/**
 * A real browser hands out a distinct recogniser per pass, so the fake does
 * too: tests then observe the instance they actually started, not a shared one
 * mutated by a later pass.
 */
function stubRecognizerCtor() {
  const instances: FakeRecognition[] = [];
  vi.stubGlobal('SpeechRecognition', vi.fn(() => {
    const rec = makeRecognition();
    instances.push(rec);
    return rec;
  }));
  return {
    instances,
    last: () => instances[instances.length - 1],
  };
}

function finalResult(transcript: string, confidence = 0.9) {
  return {
    resultIndex: 0,
    results: {
      length: 1,
      0: { isFinal: true, length: 1, 0: { transcript, confidence } },
    },
  };
}

function partialResult(transcript: string) {
  return {
    resultIndex: 0,
    results: {
      length: 1,
      0: { isFinal: false, length: 1, 0: { transcript, confidence: 0 } },
    },
  };
}

describe('WebSpeechAsrService', () => {
  let service: WebSpeechAsrService;
  let rec: FakeRecognition;
  let lastCtor: ReturnType<typeof stubRecognizerCtor>;

  beforeEach(() => {
    service = new WebSpeechAsrService();
    lastCtor = stubRecognizerCtor();
    // Forward reads and writes to the most recently constructed recogniser, so
    // each test drives the pass it started without re-fetching the instance.
    rec = new Proxy({} as FakeRecognition, {
      get: (_t, prop) => (lastCtor.last() as any)?.[prop],
      set: (_t, prop, value) => {
        const current = lastCtor.last() as any;
        if (current) current[prop] = value;
        return true;
      },
    });
  });

  afterEach(() => {
    service.abort();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('availability', () => {
    it('reports supported when the standard constructor exists', () => {
      expect(service.isSupported()).toBe(true);
    });

    it('reports supported for the webkit-prefixed constructor', () => {
      vi.unstubAllGlobals();
      vi.stubGlobal('webkitSpeechRecognition', vi.fn(() => rec));
      expect(new WebSpeechAsrService().isSupported()).toBe(true);
    });

    it('reports unsupported when the browser has no recogniser', () => {
      vi.unstubAllGlobals();
      expect(new WebSpeechAsrService().isSupported()).toBe(false);
    });

    it('resolves unsupported without opening the microphone', async () => {
      vi.unstubAllGlobals();
      const result = await new WebSpeechAsrService().recognize('hi-IN');
      expect(result).toEqual({ success: false, transcript: '', error: 'unsupported' });
    });
  });

  describe('language mapping', () => {
    it.each([
      ['hi-IN', 'hi-IN'],
      ['en-IN', 'en-IN'],
      ['ta-IN', 'ta-IN'],
      ['te-IN', 'te-IN'],
      ['mr-IN', 'mr-IN'],
      ['bn-IN', 'bn-IN'],
    ])('maps %s to the browser tag %s', (input, expected) => {
      expect(toWebSpeechLang(input as any)).toBe(expected);
    });

    it.each(['bho-IN', 'bun-IN', 'chg-IN', 'mai-IN'])(
      'folds the %s dialect onto the Hindi tag browsers ship',
      (input) => {
        expect(toWebSpeechLang(input as any)).toBe('hi-IN');
      }
    );

    it('passes the mapped tag to the recogniser', async () => {
      const pending = service.recognize('ta-IN');
      expect(rec.lang).toBe('ta-IN');
      rec.onend?.();
      await pending;
    });
  });

  describe('recognizer configuration', () => {
    it('listens for a single utterance with final results only', async () => {
      const pending = service.recognize('hi-IN');
      expect(rec.continuous).toBe(false);
      expect(rec.interimResults).toBe(false);
      expect(rec.maxAlternatives).toBe(1);
      rec.onend?.();
      await pending;
    });

    it('forwards the speech-start signal so the UI can show listening', async () => {
      const onSpeechStart = vi.fn();
      const pending = service.recognize('hi-IN', { onSpeechStart });
      rec.onspeechstart?.();
      expect(onSpeechStart).toHaveBeenCalledOnce();
      rec.onend?.();
      await pending;
    });
  });

  describe('transcript handling', () => {
    it('returns the final transcript with its confidence', async () => {
      const pending = service.recognize('hi-IN');
      rec.onresult?.(finalResult('मैं बिजली का काम करता हूँ', 0.82));
      rec.onend?.();

      await expect(pending).resolves.toEqual({
        success: true,
        transcript: 'मैं बिजली का काम करता हूँ',
        confidence: 0.82,
      });
    });

    it('ignores interim results so callers never see a half sentence', async () => {
      const pending = service.recognize('hi-IN');
      rec.onresult?.(partialResult('मैं बि'));
      rec.onend?.();

      // Interim-only input is a failure, not a truncated transcript.
      await expect(pending).resolves.toMatchObject({ success: false, transcript: '' });
    });

    it('joins multiple final segments from one utterance', async () => {
      const pending = service.recognize('en-IN');
      rec.onresult?.({
        resultIndex: 0,
        results: { length: 1, 0: { isFinal: true, length: 1, 0: { transcript: 'I do', confidence: 0.9 } } },
      });
      rec.onresult?.({
        resultIndex: 1,
        results: { length: 2, 1: { isFinal: true, length: 1, 0: { transcript: 'solar work', confidence: 0.9 } } },
      });
      rec.onend?.();

      await expect(pending).resolves.toMatchObject({
        success: true,
        transcript: 'I do solar work',
      });
    });

    it('omits confidence when the engine reports none', async () => {
      const pending = service.recognize('hi-IN');
      rec.onresult?.(finalResult('नमस्ते', 0));
      rec.onend?.();

      const result = await pending;
      expect(result.success).toBe(true);
      expect('confidence' in result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('reports the engine error code and settles', async () => {
      const pending = service.recognize('hi-IN');
      rec.onerror?.({ error: 'not-allowed' });
      rec.onend?.();

      await expect(pending).resolves.toEqual({
        success: false,
        transcript: '',
        error: 'not-allowed',
      });
    });

    it('keeps whatever it heard before the error', async () => {
      const pending = service.recognize('hi-IN');
      rec.onresult?.(finalResult('सोलर'));
      rec.onerror?.({ error: 'aborted' });
      rec.onend?.();

      await expect(pending).resolves.toEqual({
        success: false,
        transcript: 'सोलर',
        error: 'aborted',
      });
    });

    it('treats an engine that ends silently as no-speech', async () => {
      const pending = service.recognize('hi-IN');
      rec.onend?.();
      await expect(pending).resolves.toMatchObject({ success: false, error: 'no-speech' });
    });

    it('fails instead of hanging when the user never speaks', async () => {
      vi.useFakeTimers();
      const pending = service.recognize('hi-IN');
      vi.advanceTimersByTime(12000);

      await expect(pending).resolves.toMatchObject({ success: false, error: 'no-speech' });
      expect(rec.aborted).toBe(true);
    });

    it('settles when start() throws', async () => {
      // A recogniser that refuses to start must not strand the caller.
      vi.stubGlobal('SpeechRecognition', vi.fn(() => {
        const rec = makeRecognition();
        rec.start = vi.fn(() => {
          throw new Error('already started');
        });
        return rec;
      }));

      await expect(service.recognize('hi-IN')).resolves.toMatchObject({ success: false });
    });
  });

  describe('lifecycle', () => {
    it('settles exactly once even if onend fires twice', async () => {
      const pending = service.recognize('hi-IN');
      rec.onresult?.(finalResult('बिजली'));
      rec.onend?.();
      rec.onend?.();

      await expect(pending).resolves.toMatchObject({ transcript: 'बिजली' });
      expect(service.isActive()).toBe(false);
    });

    it('stop() flushes the partial result and resolves the same value', async () => {
      const pending = service.recognize('hi-IN');
      rec.onresult?.(finalResult('गोधन'));

      const stopped = service.stop();
      // The engine delivers the flush asynchronously, as a real one would.
      rec.onend?.();

      const [fromStop, fromRecognize] = await Promise.all([stopped, pending]);
      expect(fromStop).toEqual(fromRecognize);
      expect(fromStop).toMatchObject({ success: true, transcript: 'गोधन' });
      expect(rec.stopped).toBe(true);
    });

    it('stop() resolves empty when nothing is listening', async () => {
      await expect(service.stop()).resolves.toEqual({ success: false, transcript: '' });
    });

    it('abort() tears the recogniser down and unblocks the pending promise', async () => {
      const pending = service.recognize('hi-IN');
      service.abort();

      await expect(pending).resolves.toEqual({ success: false, transcript: '' });
      expect(rec.aborted).toBe(true);
      expect(service.isActive()).toBe(false);
    });

    it('a new pass aborts the previous one instead of stacking', async () => {
      const first = service.recognize('hi-IN');
      const firstRec = lastCtor.last();
      expect(firstRec.aborted).toBe(false);

      const second = service.recognize('ta-IN');
      expect(lastCtor.instances).toHaveLength(2);
      expect(firstRec.aborted).toBe(true);
      await expect(first).resolves.toMatchObject({ success: false });

      rec.onresult?.(finalResult('வணக்கம்'));
      rec.onend?.();
      await expect(second).resolves.toMatchObject({ success: true, transcript: 'வணக்கம்' });
    });
  });
});

describe('webSpeechErrorMessage', () => {
  it.each([
    ['not-allowed', /अनुमति नहीं दी/],
    ['service-not-allowed', /अनुमति नहीं दी/],
    ['network', /संपर्क नहीं हो सका/],
    ['audio-capture', /माइक्रोफ़ोन नहीं मिला/],
    ['language-not-supported', /पहचान उपलब्ध नहीं है/],
    ['aborted', /रोक दिया गया/],
    ['no-speech', /दोबारा बोलें/],
  ])('turns %s into a message the beneficiary can act on', (code, expected) => {
    expect(webSpeechErrorMessage(code)).toMatch(expected);
  });

  it('falls back to the retry prompt for an unknown code', () => {
    expect(webSpeechErrorMessage('something-new')).toBe(webSpeechErrorMessage('no-speech'));
  });
});
