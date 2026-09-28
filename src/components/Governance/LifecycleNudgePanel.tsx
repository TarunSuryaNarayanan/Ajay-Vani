import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { isValidWhatsAppNumber, LIFECYCLE_SCHEDULE_PREVIEW } from '../../services/governance';
import { getGovText, formatGovText } from '../../services/governanceTranslations';
import { SyncIcon, CheckIcon, AlertIcon } from '../Icons';

const SCHEDULE_LABEL_KEY: Record<string, string> = {
  'day-45-checkin': 'lcScheduleDay45',
  'day-90-completion': 'lcScheduleDay90',
};

/**
 * F2 — Enroll for WhatsApp lifecycle nudges and read the message thread.
 * Day-45 replies from the beneficiary land back on this same profile stream.
 */
export const LifecycleNudgePanel: React.FC = () => {
  const {
    aadhaarSession,
    lifecycleEnrollment,
    whatsappConfigured,
    isOnline,
    enrollForNudges,
    refreshLifecycleInbox,
    runLifecycleSweepNow,
    selectedLanguage,
  } = useApp();
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const lang = selectedLanguage || 'hi-IN';
  const t = (key: string) => getGovText(lang, key);

  useEffect(() => {
    if (aadhaarSession) {
      refreshLifecycleInbox();
      setPhone(aadhaarSession.whatsappNumber || '');
    }
  }, [aadhaarSession?.aadhaarNumber]);

  if (!aadhaarSession) return null;

  const isEnrolled = !!lifecycleEnrollment;

  const handleEnroll = async () => {
    if (!isValidWhatsAppNumber(phone)) {
      setStatus(t('lcBadPhone'));
      return;
    }
    setIsBusy(true);
    setStatus(null);
    const result = await enrollForNudges(phone);
    setIsBusy(false);
    setStatus(result.message);
  };

  const handleSweep = async () => {
    setIsBusy(true);
    const count = await runLifecycleSweepNow();
    setIsBusy(false);
    setStatus(count > 0 ? formatGovText(lang, 'lcSweepSent', count) : t('lcSweepNone'));
  };

  const messages = [...(lifecycleEnrollment?.messages ?? [])].reverse();

  return (
    <div className="card-flat bg-white border-line p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-caption text-xs text-trust uppercase font-bold block">
            {t('lcTitle')}
          </span>
          <span className="text-[11px] text-ink-muted">{t('lcSubtitle')}</span>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
            isEnrolled
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-surface text-ink-muted border-line'
          }`}
        >
          {isEnrolled ? t('lcEnrolled') : t('lcNotEnrolled')}
        </span>
      </div>

      {!isEnrolled && (
        <div className="space-y-2">
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('lcPhonePlaceholder')}
            className="w-full p-2.5 border border-line rounded bg-surface text-sm text-ink"
          />
          <div className="flex flex-wrap gap-1.5">
            {LIFECYCLE_SCHEDULE_PREVIEW.map((s) => (
              <span
                key={s.key}
                className="text-[10px] bg-surface border border-line rounded px-2 py-0.5 text-ink-muted"
              >
                {formatGovText(lang, 'lcDay', s.day)} — {t(SCHEDULE_LABEL_KEY[s.key] || 'lcScheduleDay45')}
              </span>
            ))}
          </div>
          <button
            onClick={handleEnroll}
            disabled={isBusy || !isOnline}
            className="btn-primary w-full text-xs"
          >
            {isBusy ? t('lcEnrolling') : t('lcEnroll')}
          </button>
          {!isOnline && <p className="text-[11px] text-amber-800">{t('lcOffline')}</p>}
        </div>
      )}

      {isEnrolled && (
        <div className="space-y-2">
          <div className="text-[11px] text-ink-muted">
            {formatGovText(lang, 'lcEnrolledAt', lifecycleEnrollment?.whatsappNumber || '')}
            {lifecycleEnrollment?.enrolledAt && (
              <span> • {new Date(lifecycleEnrollment.enrolledAt).toLocaleDateString(lang)}</span>
            )}
          </div>

          {!whatsappConfigured && (
            <div className="flex items-start space-x-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
              <AlertIcon size={14} color="#B45309" />
              <span>{t('lcNoTwilio')}</span>
            </div>
          )}

          <button
            onClick={() => setIsExpanded((v) => !v)}
            className="text-[11px] font-bold text-trust hover:underline"
          >
            {isExpanded
              ? t('lcHideMessages')
              : formatGovText(lang, 'lcShowMessages', lifecycleEnrollment?.messages.length || 0)}
          </button>

          {isExpanded && (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {messages.length === 0 && (
                <p className="text-[11px] text-ink-muted">{t('lcNoMessages')}</p>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.messageId}
                  className={`rounded px-2 py-1.5 text-[11px] leading-relaxed border ${
                    msg.direction === 'inbound'
                      ? 'bg-trust/5 border-trust/20 text-ink'
                      : 'bg-surface border-line text-ink-muted'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold">
                      {msg.direction === 'inbound'
                        ? t('lcFromYou')
                        : msg.key === 'beneficiary-reply'
                          ? t('lcFromUs')
                          : 'AJAY-VANI'}
                    </span>
                    <span className="text-[10px]">{new Date(msg.createdAt).toLocaleDateString(lang)}</span>
                  </div>
                  <p className="whitespace-pre-line">{msg.body}</p>
                  {msg.status === 'failed' && (
                    <p className="text-[10px] text-alert mt-1">
                      {formatGovText(lang, 'lcSendFailed', msg.error || '')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleSweep}
            disabled={isBusy || !isOnline}
            className="btn-secondary w-full text-xs flex items-center justify-center space-x-2"
          >
            {isBusy ? <SyncIcon size={14} color="#009378" /> : <CheckIcon size={14} color="#009378" />}
            <span>{t('lcSweepNow')}</span>
          </button>
        </div>
      )}

      {status && <p className="text-[11px] text-ink-muted">{status}</p>}
    </div>
  );
};
