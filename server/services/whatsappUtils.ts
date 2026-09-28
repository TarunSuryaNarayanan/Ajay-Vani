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

export const normalisePhoneNumber = normaliseWhatsAppNumber;

export function toWhatsAppAddress(number: string): string {
  const normalized = normaliseWhatsAppNumber(number);
  if (!normalized) return number;
  if (normalized.startsWith('whatsapp:')) return normalized;
  return `whatsapp:${normalized}`;
}
