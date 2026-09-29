// ─── IVR Outbound Call Service (Twilio) ──────────────────────────────────────
//
// Swapped to Twilio Voice for instant demo (bypassing India KYC requirements).
// Fires outbound voice calls to beneficiaries at Day-45 and Day-90 milestones.

import { LanguageCode } from '../../src/types';

// ── Lazy env accessors ────────────────────────────────────────────────────────
const cfg = () => ({
  accountSid : process.env.TWILIO_ACCOUNT_SID || '',
  authToken  : process.env.TWILIO_AUTH_TOKEN  || '',
  from       : process.env.TWILIO_VOICE_FROM  || '',
});

export function isIvrConfigured(): boolean {
  const c = cfg();
  return !!(c.accountSid && c.authToken && c.from);
}

// ── IVR call scripts per language ────────────────────────────────────────────

type NudgeType = 'day-45' | 'day-90';

const IVR_SCRIPTS: Record<NudgeType, Record<string, (name: string) => string>> = {
  'day-45': {
    'hi-IN': (name) =>
      `Namaste ${name} ji! Yeh PM-AJAY Gram Sahayak ki taraf se aapko ek yaad dilaane ki call hai. ` +
      `Hum asha karte hain aapka training course achha chal raha hai aur aapko stipend bhi mil raha hoga. ` +
      `Agar koi bhi takleef ho — trainer na aaye, stipend na mile, ya kuch aur — toh AJAY-VANI app mein ` +
      `Grievance section mein apni baat darj zaroor karein. Dhanyavaad, aur shubhkamnayein!`,

    'en-IN': (name) =>
      `Hello ${name}! This is a reminder call from your PM-AJAY Gram Sahayak. ` +
      `We hope your training is going well and you are receiving your daily stipend. ` +
      `If you face any issues — trainer absent, stipend delayed, or anything else — ` +
      `please log a grievance in the AJAY-VANI app. Thank you and best wishes!`,
  },
  'day-90': {
    'hi-IN': (name) =>
      `Namaste ${name} ji! Aapka PM-AJAY training course poora hone wala hai — bahut bahut badhaai! ` +
      `Ab AJAY-VANI app mein wapas login karein. App aapko 50,000 rupaye PM-AJAY grant ke liye aavedan, ` +
      `naukri dhundhne, aur MUDRA loan ki poori jaankari dega. Aapka bhavishya ujjwal ho! ` +
      `Dhanyavaad.`,

    'en-IN': (name) =>
      `Hello ${name}! Your PM-AJAY training course is almost complete — congratulations! ` +
      `Please log back in to the AJAY-VANI app. The app will guide you to apply for your ` +
      `50,000 rupee business grant, explore local job openings, and get information on ` +
      `a MUDRA loan if you need more capital. Your bright future awaits! Thank you.`,
  },
};

function getScript(nudgeType: NudgeType, lang: LanguageCode, name: string): string {
  const scripts = IVR_SCRIPTS[nudgeType];
  const fn = scripts[lang] || scripts['hi-IN'] || scripts['en-IN'];
  return fn(name);
}

// ── Twilio call result ─────────────────────────────────────────────────────────

export interface IvrCallResult {
  called: boolean;
  dryRun: boolean;
  callSid?: string;
  reason?: string;
  script: string;
}

// ── Make the outbound call ────────────────────────────────────────────────────

export async function makeIvrCall(params: {
  phone: string;
  language: LanguageCode;
  nudgeType: NudgeType;
  beneficiaryName: string;
}): Promise<IvrCallResult> {
  const { phone, language, nudgeType, beneficiaryName } = params;
  const script = getScript(nudgeType, language, beneficiaryName);

  // ── DRY RUN ─────────────────────────────────────────────────────────────
  if (!isIvrConfigured()) {
    console.log(`[IVR DRY-RUN] Twilio not configured. Would call ${phone}: "${script.slice(0, 80)}…"`);
    return { called: false, dryRun: true, script, reason: 'Twilio not configured (dry-run)' };
  }

  const c = cfg();
  console.log(`[IVR] Calling ${phone} via Twilio Voice`);

  try {
    // Dynamically import Twilio SDK (already installed for WhatsApp)
    const twilioObj = await import('twilio');
    const twilio = twilioObj.default || twilioObj;
    const client = twilio(c.accountSid, c.authToken);
    
    // TwiML payload to instantly read the script using Amazon Polly voices
    // We map hi-IN to Aditi, everything else to default AWS voices
    const voice = language.startsWith('hi') ? 'Polly.Aditi' : 'Polly.Raveena';
    const langHeader = language.startsWith('hi') ? 'hi-IN' : 'en-IN';
    
    const twiml = `<Response><Say voice="${voice}" language="${langHeader}">${script}</Say></Response>`;

    const call = await client.calls.create({
      twiml,
      to: phone,
      from: c.from,
    });

    console.log(`[IVR] ${nudgeType} call to ${phone} initiated — SID: ${call.sid}`);
    return { called: true, dryRun: false, callSid: call.sid, script };
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.warn(`[IVR] Twilio call to ${phone} FAILED: ${msg}`);
    return { called: false, dryRun: false, reason: msg, script };
  }
}
