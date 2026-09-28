/**
 * Tests for the F2 WhatsApp sender: number normalisation, graceful degradation
 * when Twilio credentials are absent, and inbound webhook parsing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { normaliseWhatsAppNumber, parseInboundWhatsApp, sendWhatsAppMessage } from './whatsapp';

describe('normaliseWhatsAppNumber', () => {
  it('assumes +91 for a bare 10-digit Indian number', () => {
    expect(normaliseWhatsAppNumber('9452018290')).toBe('+919452018290');
  });

  it('tolerates pre-formatted and spaced input', () => {
    expect(normaliseWhatsAppNumber('+91 94520 18290')).toBe('+919452018290');
    expect(normaliseWhatsAppNumber('(91) 94520-18290')).toBe('+919452018290');
    expect(normaliseWhatsAppNumber('  9452018290  ')).toBe('+919452018290');
  });

  it('accepts an already-prefixed 12-digit number', () => {
    expect(normaliseWhatsAppNumber('919452018290')).toBe('+919452018290');
  });

  it('rejects empty, too-short and implausibly long input', () => {
    expect(normaliseWhatsAppNumber('')).toBeNull();
    expect(normaliseWhatsAppNumber('123')).toBeNull();
    expect(normaliseWhatsAppNumber('1234567890123456')).toBeNull();
  });
});

describe('sendWhatsAppMessage', () => {
  const TWILIO_KEYS = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_FROM'] as const;

  beforeEach(() => {
    // Individual keys are saved/restored rather than replacing process.env, so
    // other test files sharing this worker are unaffected.
    for (const key of TWILIO_KEYS) delete process.env[key];
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects an invalid number before touching the network', async () => {
    const result = await sendWhatsAppMessage('12', 'hello');
    expect(result).toEqual({ sent: false, messageSid: null, reason: 'invalid-number' });
  });

  it('rejects an empty body', async () => {
    const result = await sendWhatsAppMessage('9452018290', '   ');
    expect(result.reason).toBe('empty-body');
  });

  it('degrades to a logged no-op when TWILIO_* credentials are unset', async () => {
    const result = await sendWhatsAppMessage('9452018290', 'Namaste ji');

    expect(result.sent).toBe(false);
    expect(result.reason).toBe('not-configured');
    expect(console.warn).toHaveBeenCalled();
  });
});

describe('parseInboundWhatsApp', () => {
  it('parses the form-encoded Twilio webhook fields', () => {
    const parsed = parseInboundWhatsApp({
      From: 'whatsapp:+919452018290',
      Body: 'teacher nahi aate',
      MessageSid: 'SM123',
    });
    expect(parsed).toEqual({
      from: 'whatsapp:+919452018290',
      body: 'teacher nahi aate',
      messageSid: 'SM123',
    });
  });

  it('returns null when From or Body is missing', () => {
    expect(parseInboundWhatsApp({ Body: 'hi' })).toBeNull();
    expect(parseInboundWhatsApp({ From: 'whatsapp:+91...' })).toBeNull();
    expect(parseInboundWhatsApp({})).toBeNull();
  });
});
