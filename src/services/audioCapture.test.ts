/**
 * Tests for audioCapture.ts — covers A1 (teardown ordering) and the
 * toWavBase64 WAV header round-trip.
 */

vi.mock('onnxruntime-web', () => ({}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toWavBase64, AudioCaptureService } from './audioCapture';

describe('toWavBase64', () => {
  it('produces a valid RIFF/WAVE header', () => {
    const length = 8000;
    const sampleRate = 16000;
    const channelData = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      channelData[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.5;
    }
    const audioBuffer = {
      getChannelData: (_ch: number) => channelData,
      sampleRate,
      numberOfChannels: 1,
      length,
      duration: length / sampleRate,
      getFloatFrequencyData: () => {},
      getByteFrequencyData: () => {},
      copyFromChannel: () => {},
      copyToChannel: () => {},
    } as unknown as AudioBuffer;

    const b64 = toWavBase64(audioBuffer, 1);
    expect(b64).toBeTruthy();

    const binary = atob(b64);
    expect(binary.slice(0, 4)).toBe('RIFF');
    expect(binary.slice(8, 12)).toBe('WAVE');
    expect(binary.slice(12, 16)).toBe('fmt ');

    const dv = new DataView(new ArrayBuffer(44));
    const bytes = new Uint8Array(dv.buffer);
    for (let i = 0; i < binary.length && i < 44; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const sampleRateWritten = dv.getUint32(24, true);
    expect(sampleRateWritten).toBe(sampleRate);
  });

  it('handles empty (silence) audio', () => {
    const audioBuffer = {
      getChannelData: () => new Float32Array(1000),
      sampleRate: 16000,
      numberOfChannels: 1,
      length: 1000,
      duration: 0.0625,
      getFloatFrequencyData: () => {},
      getByteFrequencyData: () => {},
      copyFromChannel: () => {},
      copyToChannel: () => {},
    } as unknown as AudioBuffer;

    const b64 = toWavBase64(audioBuffer, 1);
    expect(b64).toBeTruthy();
    expect(atob(b64).slice(0, 4)).toBe('RIFF');
  });
});

describe('AudioCaptureService.handleManualStop teardown ordering (B1)', () => {
  let service: AudioCaptureService;

  beforeEach(() => {
    service = new AudioCaptureService();
  });

  it('decodes audio BEFORE stopCapture nulls the context', async () => {
    const capturedOrder: string[] = [];

    service['audioContext'] = {
      decodeAudioData: async () => ({
        getChannelData: () => new Float32Array(100),
        sampleRate: 16000,
        numberOfChannels: 1,
        length: 100,
        duration: 0.00625,
      } as unknown as AudioBuffer),
      close: vi.fn(),
      state: 'running',
    } as unknown as AudioContext;

    service['mediaRecorder'] = {
      ondataavailable: null,
      state: 'recording',
      requestData: vi.fn(),
      stop: vi.fn(),
    } as unknown as MediaRecorder;

    service['isCapturing'] = true;
    service['vad'] = null;
    service['mediaStream'] = {
      getTracks: () => [{ stop: vi.fn() }],
    } as unknown as MediaStream;

    const originalStopCapture = service['stopCapture'].bind(service);
    service['stopCapture'] = () => {
      capturedOrder.push('stopCapture');
      return originalStopCapture();
    };

    const blob = new Blob([new Uint8Array(100)], { type: 'audio/webm' });
    service['audioChunks'] = [blob];

    const result = await service.handleManualStop();

    expect(result).toBeTruthy();
    expect(capturedOrder[0]).toBe('stopCapture');
  });

  it('returns null when no chunks captured', async () => {
    service['mediaRecorder'] = {
      ondataavailable: null,
      state: 'recording',
      requestData: vi.fn(),
      stop: vi.fn(),
    } as unknown as MediaRecorder;
    service['isCapturing'] = true;
    service['audioChunks'] = [];

    const result = await service.handleManualStop();
    expect(result).toBeNull();
  });
});
