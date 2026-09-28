/**
 * espeak-ng synthesis + WAV decoding + 22.05 kHz -> 16 kHz resampling, shared
 * by the two local-ASR verification harnesses.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const TMP = mkdtempSync(join(tmpdir(), 'asr-verify-'));

/** Reads a 16-bit PCM WAV and returns mono samples plus the sample rate. */
export function readWavPcm16(filePath) {
  const buf = readFileSync(filePath);
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error(`${filePath} is not a RIFF/WAVE file`);
  }
  let offset = 12;
  let sampleRate = 0;
  let channels = 1;
  let bitsPerSample = 16;
  let dataStart = -1;
  let dataLength = 0;
  while (offset + 8 <= buf.length) {
    const id = buf.toString('ascii', offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    const body = offset + 8;
    if (id === 'fmt ') {
      channels = buf.readUInt16LE(body + 2);
      sampleRate = buf.readUInt32LE(body + 4);
      bitsPerSample = buf.readUInt16LE(body + 14);
    } else if (id === 'data') {
      dataStart = body;
      dataLength = Math.min(size, buf.length - body);
    }
    offset = body + size + (size % 2);
  }
  if (dataStart < 0) throw new Error(`no data chunk in ${filePath}`);
  if (bitsPerSample !== 16) throw new Error(`expected 16-bit PCM, got ${bitsPerSample}`);
  const frames = Math.floor(dataLength / 2 / channels);
  const out = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    let acc = 0;
    for (let c = 0; c < channels; c++) acc += buf.readInt16LE(dataStart + (i * channels + c) * 2) / 32768;
    out[i] = acc / channels;
  }
  return { samples: out, sampleRate };
}

/** Linear-interpolation resampler; fine for 22.05 kHz -> 16 kHz speech. */
export function resample(input, from, to) {
  if (from === to) return input;
  const ratio = to / from;
  const out = new Float32Array(Math.floor(input.length * ratio));
  for (let i = 0; i < out.length; i++) {
    const pos = i / ratio;
    const i0 = Math.floor(pos);
    const i1 = Math.min(i0 + 1, input.length - 1);
    const frac = pos - i0;
    out[i] = input[i0] * (1 - frac) + input[i1] * frac;
  }
  return out;
}

export function toWavBase64(float32, sampleRate) {
  const buffer = Buffer.alloc(44 + float32.length * 2);
  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(36 + float32.length * 2, 4);
  buffer.write('WAVE', 8, 'ascii');
  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(float32.length * 2, 40);
  for (let i = 0; i < float32.length; i++) {
    const v = Math.max(-1, Math.min(1, float32[i]));
    buffer.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  return buffer.toString('base64');
}

/** Synthesises `text` with the system espeak-ng and returns 16 kHz mono. */
export function synthesise16k(voice, text) {
  const wavPath = join(TMP, `${voice}-${Buffer.from(text).toString('hex').slice(0, 12)}.wav`);
  execFileSync('/usr/bin/espeak-ng', ['-v', voice, '-s', '130', '-w', wavPath, text], {
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  const { samples, sampleRate } = readWavPcm16(wavPath);
  return resample(samples, sampleRate, 16000);
}

/** Runs an already-loaded pipeline over freshly synthesised speech. */
export async function transcribeFloat32(asr, lang, text) {
  const audio = synthesise16k(lang, text);
  try {
    const result = await asr(audio, { language: lang, task: 'transcribe' });
    return { ok: true, text: JSON.stringify(result.text) };
  } catch (err) {
    return { ok: false, error: String(err?.message ?? err) };
  }
}

export { TMP };
