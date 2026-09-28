/**
 * Local ASR wiring — covers the pieces that do not need the ONNX runtime:
 * the WAV decoder, the resampler, and the transformers.js environment the app
 * configures so the model can only be loaded from the app's own origin.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { decodeWavBase64, getLocalAsrModelPath } from './localAsr';
import { ASR_MODEL_DIR, ASR_MODEL_FILES, ASR_MODEL_TOTAL_BYTES } from '../generated/asrModelManifest';

function makeWav(sampleRate: number, samples: number[]): string {
  const bytes = new Uint8Array(44 + samples.length * 2);
  const view = new DataView(bytes.buffer);
  const ascii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  ascii(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  ascii(8, 'WAVE');
  ascii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);   // PCM
  view.setUint16(22, 1, true);   // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  ascii(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((s, i) => view.setInt16(44 + i * 2, s, true));
  return Buffer.from(bytes).toString('base64');
}

describe('decodeWavBase64', () => {
  it('decodes 16-bit PCM mono at the right sample rate', () => {
    const { samples, sampleRate } = decodeWavBase64(makeWav(16000, [0, 16384, -16384, 32767]));
    expect(sampleRate).toBe(16000);
    expect(Array.from(samples)).toEqual([0, 0.5, -0.5, 32767 / 32768]);
  });

  it('rejects a payload with no data chunk', () => {
    // A well-formed RIFF header with no fmt/data chunks.
    const empty = Buffer.from('RIFF' + '\x24\x00\x00\x00' + 'WAVE' + 'fmt ' + '\x10\x00\x00\x00' +
      '\x01\x00\x01\x00' + '\x80\x3e\x00\x00' + '\x00\x7d\x00\x00' + '\x02\x00\x10\x00' +
      '\x10\x00data\x00\x00\x00\x00', 'binary').toString('base64');
    expect(() => decodeWavBase64(empty)).toThrow(/no data chunk/);
  });
});

describe('local ASR model manifest', () => {
  it('lists the files transformers.js requests for this model', () => {
    const paths = ASR_MODEL_FILES.map((f) => f.path);
    expect(ASR_MODEL_DIR).toBe('whisper-tiny');
    expect(paths).toContain('config.json');
    expect(paths).toContain('onnx/encoder_model_quantized.onnx');
    expect(paths).toContain('onnx/decoder_model_merged_quantized.onnx');
    expect(ASR_MODEL_TOTAL_BYTES).toBe(ASR_MODEL_FILES.reduce((n, f) => n + f.size, 0));
  });
});

describe('getLocalAsrModelPath', () => {
  beforeEach(() => {
    delete process.env.AJAY_VANI_MODELS_DIR;
    delete process.env.AJAY_VANI_MODELS_URL;
  });

  it('resolves against the served model base URL in the browser', () => {
    expect(getLocalAsrModelPath()).toBe('/models');
  });

  it('honours an explicit models directory (Node harness)', () => {
    process.env.AJAY_VANI_MODELS_DIR = '/tmp/whatever/public/models/';
    expect(getLocalAsrModelPath()).toBe('/tmp/whatever/public/models');
  });
});
