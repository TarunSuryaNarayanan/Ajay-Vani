// ─── Twilio WhatsApp Sender (F2: Automated Lifecycle Nudges) ─────────────────
//
// Backed by the unified Twilio Telecom Gateway (`twilioService.ts`).
// The server boots and runs fine without credentials; sending degrades
// to a logged no-op instead of crashing the API.

export type { TwilioSendResult as WhatsAppSendResult } from './twilioService';
export type { InboundMessage as InboundWhatsAppMessage } from './twilioService';

export {
  isWhatsAppConfigured,
  sendWhatsAppMessage,
  parseInboundWhatsApp,
  getTwilioClient,
} from './twilioService';

export {
  normaliseWhatsAppNumber,
  normalisePhoneNumber,
  toWhatsAppAddress,
} from './whatsappUtils';
