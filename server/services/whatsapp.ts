// ─── Twilio WhatsApp Sender (F2: Automated Lifecycle Nudges) ─────────────────
//
// Mirrors the Bhashini credential pattern: the server boots and runs fine without
// credentials; sending degrades to a logged no-op instead of crashing the API.

export interface WhatsAppSendResult {
  sent: boolean;
  messageSid: string | null;
  reason: string;
}

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || '';

export function isWhatsAppConfigured(): boolean {
  return !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_FROM);
}

let clientPromise: Promise<any | null> | null = null;

async function getTwilioClient(): Promise<any | null> {
  if (!isWhatsAppConfigured()) return null;
  if (clientPromise) return clientPromise;

  clientPromise = import('twilio')
    .then((mod: any) => {
      const factory = mod?.default || mod;
      return factory(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    })
    .catch((err) => {
      console.warn('[WhatsApp] twilio package unavailable:', err?.message || err);
      return null;
    });

  return clientPromise;
}

// Normalises 10-digit Indian numbers and tolerates pre-formatted input.
export function normaliseWhatsAppNumber(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/[\s()-]/g, '');
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return null;
}

function toWhatsAppAddress(number: string): string {
  const normalized = normaliseWhatsAppNumber(number);
  if (!normalized) return number;
  return `whatsapp:${normalized}`;
}

export async function sendWhatsAppMessage(
  toNumber: string,
  body: string
): Promise<WhatsAppSendResult> {
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
      to: toWhatsAppAddress(to),      from: toWhatsAppAddress(TWILIO_WHATSAPP_FROM),
      body,
    });
    return { sent: true, messageSid: message?.sid || null, reason: 'ok' };
  } catch (err: any) {
    console.error('[WhatsApp] Send failed:', err?.message || err);
    return { sent: false, messageSid: null, reason: err?.message || 'send-failed' };
  }
}

// ─── Inbound webhook parsing (Day 45 replies route back to the profile stream) ─

export interface InboundWhatsAppMessage {
  from: string;
  body: string;
  messageSid: string | null;
}

/**
 * Twilio posts inbound WhatsApp bodies as `application/x-www-form-urlencoded`.
 * Fields: From, Body, MessageSid, ProfileName, WaId.
 */
export function parseInboundWhatsApp(body: Record<string, any>): InboundWhatsAppMessage | null {
  const from = body?.From || body?.from || body?.WaId;
  const text = body?.Body || body?.body;
  if (!from || !text) return null;
  return {
    from: String(from),
    body: String(text),
    messageSid: body?.MessageSid ? String(body.MessageSid) : null,
  };
}
