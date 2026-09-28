/**
 * Browser-native speech recognition, used only as a last-resort fallback when
 * both the local Whisper model and the Bhashini proxy come back with nothing.
 *
 * The Web Speech API cannot transcribe a buffer the app already captured: it
 * opens the microphone itself and streams hypotheses as the user speaks. That
 * makes it a *second listening pass*, not a third decoder, so it deliberately
 * does not live inside `recognizeWithFallback()`. `SpeechService` drives it
 * separately and asks the beneficiary to repeat the sentence.
 */

import { LanguageCode } from '../types';
import { getEffectiveLanguage } from './modelPackManager';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onspeechstart: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export interface WebSpeechAsrResult {
  success: boolean;
  transcript: string;
  confidence?: number;
  error?: string;
}

export interface WebSpeechAsrCallbacks {
  onSpeechStart?: () => void;
}

/** No speech within this window is treated as "user did not repeat themselves". */
const LISTEN_TIMEOUT_MS = 12000;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const scope = window as any;
  return scope.SpeechRecognition || scope.webkitSpeechRecognition || null;
}

/**
 * Browsers only ship a fixed set of BCP-47 tags. The app's dialect codes
 * (bho/bun/chg/mai) are not among them, and `getEffectiveLanguage` already
 * folds those onto Hindi, so reuse it rather than duplicating the mapping.
 */
export function toWebSpeechLang(lang: LanguageCode): string {
  const effective = getEffectiveLanguage(lang);
  if (effective === 'en') return 'en-IN';
  return `${effective}-IN`;
}

/** Turns a `SpeechRecognitionError` code into a message the user can act on. */
export function webSpeechErrorMessage(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'ब्राउज़र ने माइक्रोफ़ोन की अनुमति नहीं दी।';
    case 'network':
      return 'ब्राउज़र की पहचान सेवा से संपर्क नहीं हो सका।';
    case 'audio-capture':
      return 'कोई माइक्रोफ़ोन नहीं मिला।';
    case 'language-not-supported':
      return 'इस भाषा में ब्राउज़र पहचान उपलब्ध नहीं है।';
    case 'aborted':
      return 'सुनना रोक दिया गया।';
    case 'no-speech':
    default:
      return 'कोई आवाज़ नहीं सुनाई दी। कृपया दोबारा बोलें।';
  }
}

export class WebSpeechAsrService {
  private recognition: SpeechRecognitionLike | null = null;
  private pending: {
    resolve: (result: WebSpeechAsrResult) => void;
    transcript: string;
    confidence: number | undefined;
    errorCode: string | null;
  } | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  /** True in Chrome, Edge and Safari; false in Firefox and most other engines. */
  public isSupported(): boolean {
    return getRecognitionCtor() !== null;
  }

  public isActive(): boolean {
    return this.recognition !== null;
  }

  /**
   * Opens the microphone and resolves once the recogniser finishes. A silent
   * user resolves to a failure rather than hanging the screen, so every exit
   * path below funnels through `settle()` exactly once.
   */
  public recognize(
    lang: LanguageCode,
    callbacks: WebSpeechAsrCallbacks = {}
  ): Promise<WebSpeechAsrResult> {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      return Promise.resolve({ success: false, transcript: '', error: 'unsupported' });
    }

    this.abort();

    return new Promise<WebSpeechAsrResult>((resolve) => {
      let recognition: SpeechRecognitionLike;
      try {
        recognition = new Ctor();
      } catch (err: any) {
        resolve({ success: false, transcript: '', error: err?.message || 'construct-failed' });
        return;
      }

      const state = {
        resolve,
        transcript: '',
        confidence: undefined as number | undefined,
        errorCode: null as string | null,
      };
      this.pending = state;

      recognition.lang = toWebSpeechLang(lang);
      // One utterance per pass. The app asks the user to repeat once, not to
      // hold a conversation, so a continuous session would only stall onend.
      recognition.continuous = false;
      // Only final results are emitted: GrievanceReporter appends every
      // onResult straight into its textarea and would duplicate partials.
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onspeechstart = () => callbacks.onSpeechStart?.();

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (!result || !result.isFinal) continue;
          const alternative = result[0];
          if (!alternative) continue;
          state.transcript = `${state.transcript} ${alternative.transcript}`.trim();
          if (typeof alternative.confidence === 'number' && alternative.confidence > 0) {
            state.confidence = alternative.confidence;
          }
        }
      };

      recognition.onerror = (event) => {
        state.errorCode = event?.error || 'unknown';
      };

      // onend always follows a result, an error or a manual stop, so it is the
      // single place the promise is settled.
      recognition.onend = () => this.settle();

      this.recognition = recognition;

      this.timer = setTimeout(() => {
        if (this.pending === state && this.recognition) {
          // Record the reason before aborting: some engines emit an
          // `aborted` error from the teardown and would otherwise mask it.
          state.errorCode = 'no-speech';
          try {
            this.recognition.abort();
          } catch (e) {}
          this.settle();
        }
      }, LISTEN_TIMEOUT_MS);

      try {
        recognition.start();
      } catch (err: any) {
        state.errorCode = err?.message || 'start-failed';
        this.settle();
      }
    });
  }

  /**
   * Graceful finish: lets the engine flush whatever it has already heard. The
   * recogniser's own promise is chained onto so callers awaiting `stop()` see
   * the same result the in-flight `recognize()` will deliver.
   */
  public stop(): Promise<WebSpeechAsrResult> {
    const state = this.pending;
    const recognition = this.recognition;
    if (!state || !recognition) {
      return Promise.resolve({ success: false, transcript: '' });
    }

    const originalResolve = state.resolve;
    const stopped = new Promise<WebSpeechAsrResult>((resolve) => {
      state.resolve = (result) => {
        originalResolve(result);
        resolve(result);
      };
    });

    try {
      recognition.stop();
    } catch (err) {
      this.settle();
    }
    return stopped;
  }

  /** Hard teardown, used on unmount and when a new listening pass begins. */
  public abort(): void {
    const recognition = this.recognition;
    if (recognition) {
      try {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.onspeechstart = null;
        recognition.abort();
      } catch (e) {}
    }
    this.settle({ success: false, transcript: '' });
  }

  private settle(forced?: WebSpeechAsrResult): void {
    const state = this.pending;
    this.pending = null;
    this.recognition = null;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (!state) return;

    if (forced) {
      state.resolve(forced);
      return;
    }

    if (state.errorCode) {
      state.resolve({
        success: false,
        transcript: state.transcript,
        error: state.errorCode,
      });
      return;
    }

    if (state.transcript) {
      state.resolve({
        success: true,
        transcript: state.transcript,
        ...(state.confidence !== undefined ? { confidence: state.confidence } : {}),
      });
      return;
    }

    state.resolve({ success: false, transcript: '', error: 'no-speech' });
  }
}

export const webSpeechAsrService = new WebSpeechAsrService();
