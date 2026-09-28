// ─── Twilio Telecom Gateway (SMS, WhatsApp, OTP, Lifecycle & Alerts) ──────────
//
// Provides unified Twilio integration for PM-AJAY / AJAY-VANI:
// - SMS text messaging (Aadhaar OTP, admission alerts, grievance updates)
// - WhatsApp messaging (Lifecycle check-ins, automated nudges, two-way interaction)
// - OTP Generation & Verification with demo fallback (1234)
// - Inbound webhooks for both WhatsApp and SMS
//
// Like Bhashini, credentials degrade gracefully to logged dry-run operations
// without crashing the server or blocking user flow.

import { normaliseWhatsAppNumber, toWhatsAppAddress } from './whatsappUtils';

export interface TwilioSendResult {
  sent: boolean;
  messageSid: string | null;
  reason: string;
}

export function getTwilioAccountSid(): string {
  return process.env.TWILIO_ACCOUNT_SID || '';
}

export function getTwilioAuthToken(): string {
  return process.env.TWILIO_AUTH_TOKEN || '';
}

export function getTwilioWhatsAppFrom(): string {
  return process.env.TWILIO_WHATSAPP_FROM || '';
}

export function getTwilioSmsFrom(): string {
  return process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_SMS_FROM || '';
}

export function isTwilioConfigured(): boolean {
  return !!(getTwilioAccountSid() && getTwilioAuthToken());
}

export function isWhatsAppConfigured(): boolean {
  return !!(getTwilioAccountSid() && getTwilioAuthToken() && getTwilioWhatsAppFrom());
}

export function isSmsConfigured(): boolean {
  return !!(getTwilioAccountSid() && getTwilioAuthToken() && getTwilioSmsFrom());
}

let cachedClient: any = null;
let lastUsedSid = '';
let lastUsedToken = '';

export async function getTwilioClient(): Promise<any | null> {
  const sid = getTwilioAccountSid();
  const token = getTwilioAuthToken();
  if (!sid || !token) return null;

  if (cachedClient && lastUsedSid === sid && lastUsedToken === token) {
    return cachedClient;
  }

  try {
    const mod: any = await import('twilio');
    const factory = mod?.default || mod;
    cachedClient = factory(sid, token);
    lastUsedSid = sid;
    lastUsedToken = token;
    return cachedClient;
  } catch (err: any) {
    console.warn('[Twilio] twilio package unavailable:', err?.message || err);
    return null;
  }
}

/**
 * Sends a WhatsApp message via Twilio.
 */
export async function sendWhatsAppMessage(
  toNumber: string,
  body: string
): Promise<TwilioSendResult> {
  if (!body || !body.trim()) {
    return { sent: false, messageSid: null, reason: 'empty-body' };
  }

  const to = normaliseWhatsAppNumber(toNumber);
  if (!to) {
    return { sent: false, messageSid: null, reason: 'invalid-number' };
  }

  if (!isWhatsAppConfigured()) {
    console.warn(`[WhatsApp] Skipped send to ${to} — TWILIO_* credentials not configured.`);
    return { sent: false, messageSid: null, reason: 'not-configured' };
  }

  const client = await getTwilioClient();
  if (!client) {
    return { sent: false, messageSid: null, reason: 'client-unavailable' };
  }

  try {
    const message = await client.messages.create({
      to: toWhatsAppAddress(to),
      from: toWhatsAppAddress(getTwilioWhatsAppFrom()),
      body,
    });
    return { sent: true, messageSid: message?.sid || null, reason: 'ok' };
  } catch (err: any) {
    console.error('[WhatsApp] Send failed:', err?.message || err);
    return { sent: false, messageSid: null, reason: err?.message || 'send-failed' };
  }
}

/**
 * Sends an SMS text message via Twilio.
 */
export async function sendSmsMessage(
  toNumber: string,
  body: string
): Promise<TwilioSendResult> {
  if (!body || !body.trim()) {
    return { sent: false, messageSid: null, reason: 'empty-body' };
  }

  const to = normaliseWhatsAppNumber(toNumber);
  if (!to) {
    return { sent: false, messageSid: null, reason: 'invalid-number' };
  }

  if (!isSmsConfigured()) {
    console.warn(`[SMS] Skipped send to ${to} — TWILIO_* SMS credentials not configured.`);
    return { sent: false, messageSid: null, reason: 'not-configured' };
  }

  const client = await getTwilioClient();
  if (!client) {
    return { sent: false, messageSid: null, reason: 'client-unavailable' };
  }

  try {
    const message = await client.messages.create({
      to,
      from: getTwilioSmsFrom(),
      body,
    });
    return { sent: true, messageSid: message?.sid || null, reason: 'ok' };
  } catch (err: any) {
    console.error('[SMS] Send failed:', err?.message || err);
    return { sent: false, messageSid: null, reason: err?.message || 'send-failed' };
  }
}

/**
 * Dispatches notification via WhatsApp or SMS, with smart auto-fallback.
 */
export async function sendTwilioNotification(
  toNumber: string,
  body: string,
  preferredChannel: 'whatsapp' | 'sms' | 'auto' = 'auto'
): Promise<{ channel: 'whatsapp' | 'sms'; success: boolean; messageSid: string | null; reason: string }> {
  // If explicitly SMS or if SMS is configured and channel requested:
  if (preferredChannel === 'sms') {
    const res = await sendSmsMessage(toNumber, body);
    return { channel: 'sms', success: res.sent, messageSid: res.messageSid, reason: res.reason };
  }

  // If WhatsApp explicitly or auto and WhatsApp is configured:
  if (preferredChannel === 'whatsapp' || (preferredChannel === 'auto' && isWhatsAppConfigured())) {
    const res = await sendWhatsAppMessage(toNumber, body);
    if (res.sent || preferredChannel === 'whatsapp') {
      return { channel: 'whatsapp', success: res.sent, messageSid: res.messageSid, reason: res.reason };
    }
  }

  // Fallback to SMS if available
  const smsRes = await sendSmsMessage(toNumber, body);
  return { channel: 'sms', success: smsRes.sent, messageSid: smsRes.messageSid, reason: smsRes.reason };
}

// ─── OTP Store & Verification ──────────────────────────────────────────────────

interface StoredOtp {
  code: string;
  expiresAt: number;
}

const otpMemoryStore = new Map<string, StoredOtp>();

/**
 * Generates and caches a 4-digit OTP valid for 10 minutes.
 */
export function generateAndStoreOtp(phoneNumber: string): string {
  const normalized = normaliseWhatsAppNumber(phoneNumber) || phoneNumber.trim();
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  otpMemoryStore.set(normalized, {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });
  return code;
}

/**
 * Verifies a 4-digit OTP. Always permits demo OTP '1234'.
 */
export function verifyStoredOtp(phoneNumber: string, code: string): boolean {
  const cleanCode = (code || '').trim();
  if (cleanCode === '1234') return true;

  const normalized = normaliseWhatsAppNumber(phoneNumber) || phoneNumber.trim();
  const entry = otpMemoryStore.get(normalized);
  if (!entry) return false;

  if (Date.now() > entry.expiresAt) {
    otpMemoryStore.delete(normalized);
    return false;
  }

  if (entry.code === cleanCode) {
    otpMemoryStore.delete(normalized);
    return true;
  }

  return false;
}

// ─── Inbound Webhook Parsers ───────────────────────────────────────────────────

export interface InboundMessage {
  from: string;
  body: string;
  messageSid: string | null;
}

export function parseInboundWhatsApp(body: Record<string, any>): InboundMessage | null {
  const from = body?.From || body?.from || body?.WaId;
  const text = body?.Body || body?.body;
  if (!from || !text) return null;
  return {
    from: String(from),
    body: String(text),
    messageSid: body?.MessageSid ? String(body.MessageSid) : null,
  };
}

export function parseInboundSms(body: Record<string, any>): InboundMessage | null {
  const from = body?.From || body?.from;
  const text = body?.Body || body?.body;
  if (!from || !text) return null;
  return {
    from: String(from),
    body: String(text),
    messageSid: body?.MessageSid ? String(body.MessageSid) : null,
  };
}
