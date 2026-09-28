/**
 * Tests for the unified Twilio telecom gateway: SMS dispatch, OTP generation/validation,
 * notification channel fallback, and inbound SMS webhook parsing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isTwilioConfigured,
  isSmsConfigured,
  isWhatsAppConfigured,
  sendSmsMessage,
  sendWhatsAppMessage,
  sendTwilioNotification,
  generateAndStoreOtp,
  verifyStoredOtp,
  parseInboundSms,
} from './twilioService';

describe('Twilio configuration checkers', () => {
  const KEYS = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_FROM', 'TWILIO_PHONE_NUMBER'] as const;

  beforeEach(() => {
    for (const k of KEYS) delete process.env[k];
  });

  it('reports unconfigured when environment variables are unset', () => {
    expect(isTwilioConfigured()).toBe(false);
    expect(isSmsConfigured()).toBe(false);
    expect(isWhatsAppConfigured()).toBe(false);
  });

  it('detects SMS configuration when account sid, token, and phone number exist', () => {
    process.env.TWILIO_ACCOUNT_SID = 'AC1234567890abcdef';
    process.env.TWILIO_AUTH_TOKEN = 'token_secret';
    process.env.TWILIO_PHONE_NUMBER = '+15551234567';

    expect(isTwilioConfigured()).toBe(true);
    expect(isSmsConfigured()).toBe(true);
    expect(isWhatsAppConfigured()).toBe(false);
  });

  it('detects WhatsApp configuration when WhatsApp from is provided', () => {
    process.env.TWILIO_ACCOUNT_SID = 'AC1234567890abcdef';
    process.env.TWILIO_AUTH_TOKEN = 'token_secret';
    process.env.TWILIO_WHATSAPP_FROM = '+14155238886';

    expect(isTwilioConfigured()).toBe(true);
    expect(isSmsConfigured()).toBe(false);
    expect(isWhatsAppConfigured()).toBe(true);
  });
});

describe('sendSmsMessage', () => {
  beforeEach(() => {
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_PHONE_NUMBER;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects an invalid phone number before network invocation', async () => {
    const res = await sendSmsMessage('123', 'Hello');
    expect(res).toEqual({ sent: false, messageSid: null, reason: 'invalid-number' });
  });

  it('rejects an empty SMS message body', async () => {
    const res = await sendSmsMessage('9452018290', '   ');
    expect(res).toEqual({ sent: false, messageSid: null, reason: 'empty-body' });
  });

  it('degrades gracefully to dry-run when SMS credentials are not set', async () => {
    const res = await sendSmsMessage('9452018290', 'OTP: 4567');
    expect(res.sent).toBe(false);
    expect(res.reason).toBe('not-configured');
    expect(console.warn).toHaveBeenCalled();
  });
});

describe('OTP Generation & Verification', () => {
  it('generates a 4-digit code and verifies it', () => {
    const phone = '9452018290';
    const otp = generateAndStoreOtp(phone);
    expect(otp).toHaveLength(4);
    expect(/^\d{4}$/.test(otp)).toBe(true);

    // Verifying with wrong code fails
    expect(verifyStoredOtp(phone, '9999' === otp ? '8888' : '9999')).toBe(false);

    // Verifying with correct code succeeds
    expect(verifyStoredOtp(phone, otp)).toBe(true);

    // Second verification fails because OTP is consumed
    expect(verifyStoredOtp(phone, otp)).toBe(false);
  });

  it('always accepts demo OTP 1234 for offline resilience', () => {
    expect(verifyStoredOtp('9839144521', '1234')).toBe(true);
    expect(verifyStoredOtp('', '1234')).toBe(true);
  });
});

describe('parseInboundSms', () => {
  it('parses form-encoded inbound SMS fields', () => {
    const result = parseInboundSms({
      From: '+919452018290',
      Body: 'STATUS 1234',
      MessageSid: 'SM999888',
    });
    expect(result).toEqual({
      from: '+919452018290',
      body: 'STATUS 1234',
      messageSid: 'SM999888',
    });
  });

  it('returns null when From or Body is missing', () => {
    expect(parseInboundSms({ Body: 'test' })).toBeNull();
    expect(parseInboundSms({ From: '+919452018290' })).toBeNull();
  });
});
