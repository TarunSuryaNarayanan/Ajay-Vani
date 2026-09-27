// ─── Lifecycle Nudge Scheduler (F2) ──────────────────────────────────────────
//
// Time-based scheduler keyed off the timestamp recorded when the user clicks
// "Enroll". Production would use a cron/queue; this tick-based sweep is the
// deterministic demo equivalent. The in-memory store mirrors the QR token
// pattern used elsewhere in this server.

import {
  LifecycleEnrollment,
  LifecycleMessage,
  LifecycleNudgeKey,
} from '../../src/types';
import { isWhatsAppConfigured, normaliseWhatsAppNumber, sendWhatsAppMessage } from './whatsapp';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface LifecycleScheduleEntry {
  key: LifecycleNudgeKey;
  dayOffset: number;
  label: string;
  labelHi: string;
  render: (beneficiaryName: string) => string;
}

export const LIFECYCLE_SCHEDULE: LifecycleScheduleEntry[] = [
  {
    key: 'day-45-checkin',
    dayOffset: 45,
    label: 'Day 45 Check-in',
    labelHi: 'दिन 45 जाँच',
    render: (name) =>
      `नमस्ते ${name} जी! आपका प्रशिक्षण कैसा चल रहा है? कोई भी दिक्कत हो तो हमें ज़रूर बताएं — "रिपोर्ट इश्यू" बटन दबाएं।\n` +
      `Namaste ${name} ji! Hope training is going well. Any issues? Let us know!`,
  },
  {
    key: 'day-90-completion',
    dayOffset: 90,
    label: 'Day 90 Completion Nudge',
    labelHi: 'दिन 90 समापन सूचना',
    render: (name) =>
      `नमस्ते ${name} जी! आपका कोर्स लगभग पूरा हो चुका है। ₹50,000 पीएम-अजय अनुदान के लिए आवेदन करने हेतु, या ज़िले में नौकरियाँ देखने हेतु AJAY-VANI पर दोबारा लॉगिन करें।\n` +
      `Namaste ${name} ji! Your course is almost complete. Revisit AJAY-VANI to apply for your ₹50,000 grant or explore local job openings!`,
  },
];

const enrollmentStore: Record<string, LifecycleEnrollment> = {};

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function hasAlreadySent(enrollment: LifecycleEnrollment, key: LifecycleNudgeKey): boolean {
  return enrollment.messages.some((m) => m.key === key && m.direction === 'outbound');
}

export function getLifecycleSchedule() {
  return LIFECYCLE_SCHEDULE.map(({ key, dayOffset, label, labelHi }) => ({
    key,
    dayOffset,
    label,
    labelHi,
  }));
}

export function getEnrollment(beneficiaryId: string): LifecycleEnrollment | null {
  return enrollmentStore[beneficiaryId] || null;
}

export function listEnrollments(): LifecycleEnrollment[] {
  return Object.values(enrollmentStore);
}

/** Records the "Enroll" click. Re-enrolling keeps the original timestamp. */
export function enrollLifecycle(params: {
  beneficiaryId: string;
  beneficiaryName: string;
  district: string;
  whatsappNumber: string;
  enrolledAt?: number;
}): LifecycleEnrollment {
  const { beneficiaryId, beneficiaryName, district, whatsappNumber } = params;
  const normalized = normaliseWhatsAppNumber(whatsappNumber) || whatsappNumber;
  const existing = enrollmentStore[beneficiaryId];

  if (existing) {
    existing.beneficiaryName = beneficiaryName || existing.beneficiaryName;
    existing.district = district || existing.district;
    existing.whatsappNumber = normalized;
    return existing;
  }

  const enrollment: LifecycleEnrollment = {
    beneficiaryId,
    beneficiaryName,
    district,
    whatsappNumber: normalized,
    enrolledAt: params.enrolledAt ?? Date.now(),
    lastNudgeAt: null,
    messages: [],
  };
  enrollmentStore[beneficiaryId] = enrollment;
  console.log(
    `[Lifecycle] Enrolled ${beneficiaryName} (${beneficiaryId}) for WhatsApp nudges at ${new Date(enrollment.enrolledAt).toISOString()}`
  );
  return enrollment;
}

export function isNudgeDue(enrollment: LifecycleEnrollment, entry: LifecycleScheduleEntry, now: number): boolean {
  if (hasAlreadySent(enrollment, entry.key)) return false;
  return now - enrollment.enrolledAt >= entry.dayOffset * DAY_MS;
}

export interface NudgeDispatchResult {
  key: LifecycleNudgeKey;
  attempted: boolean;
  delivered: boolean;
  message: LifecycleMessage;
}

async function dispatchNudge(
  enrollment: LifecycleEnrollment,
  entry: LifecycleScheduleEntry,
  now: number
): Promise<NudgeDispatchResult> {
  const body = entry.render(enrollment.beneficiaryName);
  const message: LifecycleMessage = {
    messageId: makeId('msg'),
    key: entry.key,
    direction: 'outbound',
    body,
    createdAt: now,
    deliveredAt: null,
    status: 'queued',
  };
  enrollment.messages.push(message);

  const result = await sendWhatsAppMessage(enrollment.whatsappNumber, body);

  if (result.sent) {
    message.status = 'sent';
    message.deliveredAt = now;
    enrollment.lastNudgeAt = now;
    console.log(`[Lifecycle] ${entry.key} nudge sent to ${enrollment.beneficiaryName} (sid=${result.messageSid})`);
  } else {
    // Keep the slot open so the next sweep retries once credentials/phone are valid.
    message.status = 'failed';
    message.error = result.reason;
    console.warn(`[Lifecycle] ${entry.key} nudge NOT sent to ${enrollment.beneficiaryName}: ${result.reason}`);
  }

  return { key: entry.key, attempted: true, delivered: result.sent, message };
}

/** Fires every due nudge once. Safe to call repeatedly; sends are deduped per key. */
export async function runLifecycleSweep(now: number = Date.now()): Promise<NudgeDispatchResult[]> {
  const dispatched: NudgeDispatchResult[] = [];
  for (const enrollment of listEnrollments()) {
    for (const entry of LIFECYCLE_SCHEDULE) {
      if (isNudgeDue(enrollment, entry, now)) {
        dispatched.push(await dispatchNudge(enrollment, entry, now));
      }
    }
  }
  return dispatched;
}

/**
 * Day-45 replies route straight back into the beneficiary's profile stream so the
 * Ministry dashboard (and the beneficiary's own inbox) shows the conversation.
 */
export function recordInboundReply(fromNumber: string, body: string): LifecycleEnrollment | null {
  const normalized = normaliseWhatsAppNumber(fromNumber) || fromNumber;
  const match = listEnrollments().find(
    (e) => normaliseWhatsAppNumber(e.whatsappNumber) === normalized || e.whatsappNumber === fromNumber
  );
  if (!match) return null;

  const message: LifecycleMessage = {
    messageId: makeId('msg'),
    key: 'beneficiary-reply',
    direction: 'inbound',
    body,
    createdAt: Date.now(),
    deliveredAt: Date.now(),
    status: 'received',
  };
  match.messages.push(message);
  console.log(`[Lifecycle] Inbound reply from ${match.beneficiaryName}: ${body.slice(0, 80)}`);
  return match;
}

const SWEEP_INTERVAL_MS = Number(process.env.LIFECYCLE_SWEEP_INTERVAL_MS || 60 * 1000);

export function startLifecycleScheduler(): () => void {
  if (!isWhatsAppConfigured()) {
    console.warn(
      '[Lifecycle] WhatsApp credentials not set (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_FROM). ' +
        'Nudge scheduler is running in dry mode.'
    );
  }

  const tick = () => {
    runLifecycleSweep().catch((err) => {
      console.error('[Lifecycle] Sweep failed:', err?.message || err);
    });
  };

  const timer = setInterval(tick, SWEEP_INTERVAL_MS);
  if (typeof timer.unref === 'function') timer.unref();
  tick();

  console.log(`[Lifecycle] Scheduler started (sweep every ${Math.round(SWEEP_INTERVAL_MS / 1000)}s).`);
  return () => clearInterval(timer);
}
