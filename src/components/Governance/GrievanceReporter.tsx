import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GRIEVANCE_ISSUE_OPTIONS } from '../../services/governance';
import { getGovText, formatGovText } from '../../services/governanceTranslations';
import { speechService } from '../../services/speech';
import { MicIcon, SpeakerIcon, CheckIcon } from '../Icons';
import { GrievanceIssueType, GrievanceStatus } from '../../types';

const STATUS_LABEL_KEY: Record<GrievanceStatus, string> = {
  open: 'grvStatusOpen',
  'in-review': 'grvStatusReview',
  resolved: 'grvStatusResolved',
};

const STATUS_STYLE: Record<GrievanceStatus, string> = {
  open: 'bg-amber-50 text-amber-900 border-amber-200',
  'in-review': 'bg-blue-50 text-blue-900 border-blue-200',
  resolved: 'bg-emerald-50 text-emerald-900 border-emerald-200',
};

/** Issue option copy is keyed off the option value so each language owns its own wording. */
const ISSUE_LABEL_KEY: Record<string, string> = {
  'trainer-absent': 'grvIssueTrainerAbsent',
  extortion: 'grvIssueExtortion',
  'missing-toolkit': 'grvIssueMissingToolkit',
  'stipend-delay': 'grvIssueStipendDelay',
  'document-fraud': 'grvIssueDocumentFraud',
  other: 'grvIssueOther',
};

const ISSUE_PROMPT_KEY: Record<string, string> = {
  'trainer-absent': 'grvPromptTrainerAbsent',
  extortion: 'grvPromptExtortion',
  'missing-toolkit': 'grvPromptMissingToolkit',
  'stipend-delay': 'grvPromptStipendDelay',
  'document-fraud': 'grvPromptDocumentFraud',
  other: 'grvPromptOther',
};

/**
 * F1 — default capture path is the typed complaint form; the microphone is an
 * alternative dictation route that fills the same field via ASR.
 */
export const GrievanceReporter: React.FC = () => {
  const { reportGrievance, isOnline, pendingGrievanceCount, selectedLanguage, aadhaarSession, grievanceTickets, refreshGrievances } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [issueType, setIssueType] = useState<GrievanceIssueType>('trainer-absent');
  const [description, setDescription] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const [captureMode, setCaptureMode] = useState<'form' | 'voice'>('form');

  const lang = selectedLanguage || 'hi-IN';
  const t = (key: string) => getGovText(lang, key);

  // Spec §1.3 — the complaint lives on the beneficiary's own profile, so the
  // beneficiary needs to see how the Ministry is progressing it.
  useEffect(() => {
    refreshGrievances();
  }, [aadhaarSession?.aadhaarNumber]);

  const myTickets = (grievanceTickets ?? []).filter(
    (t2) => t2.metadata.beneficiaryId === aadhaarSession?.aadhaarNumber
  );

  const promptForIssue = t(ISSUE_PROMPT_KEY[issueType] || 'grvPromptOther');

  const handleSubmit = async () => {
    if (!description.trim()) {
      setStatus({ tone: 'err', text: t('grvEmptyDesc') });
      return;
    }
    setIsSubmitting(true);
    setStatus(null);
    const result = await reportGrievance({ issueType, description: description.trim(), captureMode });
    setIsSubmitting(false);

    if (result.success) {
      setStatus({ tone: 'ok', text: result.message });
      setDescription('');
      setIsListening(false);
      setCaptureMode('form');
      speechService.speak(result.message, selectedLanguage);
    } else {
      setStatus({ tone: 'err', text: result.message });
    }
  };

  const toggleDictation = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
      return;
    }
    setStatus(null);
    setCaptureMode('voice');
    setIsListening(true);
    speechService.startListening(
      selectedLanguage,
      (transcript) => {
        setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      },
      (error) => {
        setIsListening(false);
        setStatus({ tone: 'err', text: error });
      },
      () => setIsListening(false),
      () => setStatus(null)
    );
  };

  return (
    <div className="card-flat bg-white border-line p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-caption text-xs text-alert uppercase font-bold block">
            {t('grvTitle')}
          </span>
          <span className="text-[11px] text-ink-muted">{t('grvSubtitle')}</span>
        </div>
        <button
          onClick={() => {
            setIsOpen((v) => !v);
            setStatus(null);
          }}
          className="text-[11px] font-bold text-trust hover:underline"
        >
          {isOpen ? t('grvClose') : t('grvOpen')}
        </button>
      </div>

      {/* Prominent "Report Issue" microphone per spec §1.1 */}
      <button
        onClick={toggleDictation}
        className={`w-full flex items-center justify-center space-x-2 py-3 rounded border transition-colors ${
          isListening
            ? 'bg-alert text-white border-alert'
            : 'bg-surface border-alert/40 text-alert hover:bg-alert/10'
        }`}
        aria-label={t('grvMic')}
      >
        <MicIcon size={20} color={isListening ? '#FFFFFF' : '#C6482E'} />
        <span className="text-sm font-bold">
          {isListening ? t('grvMicActive') : t('grvMic')}
        </span>
      </button>

      {isOpen && (
        <div className="space-y-3 pt-1">
          <div>
            <label className="font-caption text-xs text-ink-muted uppercase font-semibold block mb-1">
              {t('grvIssueLabel')}
            </label>
            <select
              value={issueType}
              onChange={(e) => {
                setIssueType(e.target.value as GrievanceIssueType);
                setStatus(null);
              }}
              className="w-full p-2.5 border border-line rounded bg-surface text-sm text-ink"
            >
              {GRIEVANCE_ISSUE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(ISSUE_LABEL_KEY[option.value] || 'grvIssueOther')}
                </option>
              ))}
            </select>
            <button
              onClick={() => speechService.speak(promptForIssue, selectedLanguage)}
              className="mt-1.5 flex items-center space-x-1 text-[11px] font-semibold text-trust hover:underline"
            >
              <SpeakerIcon size={12} color="#009378" />
              <span>{formatGovText(lang, 'grvListenQuestion', promptForIssue)}</span>
            </button>
          </div>

          <div>
            <label className="font-caption text-xs text-ink-muted uppercase font-semibold block mb-1">
              {t('grvDescLabel')}
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setCaptureMode('form');
              }}
              rows={4}
              placeholder={t('grvDescPlaceholder')}
              className="w-full p-2.5 border border-line rounded bg-surface text-sm text-ink leading-relaxed"
            />
            <p className="text-[11px] text-ink-muted mt-1">{t('grvDescHint')}</p>
          </div>

          {status && (
            <p
              className={`text-xs border rounded px-2.5 py-2 ${
                status.tone === 'ok'
                  ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                  : 'text-alert bg-red-50 border-red-200'
              }`}
            >
              {status.text}
            </p>
          )}

          {!isOnline && (
            <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
              {t('grvOffline')}
              {pendingGrievanceCount > 0 ? formatGovText(lang, 'grvOfflinePending', pendingGrievanceCount) : ''}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            <CheckIcon size={16} color="#FFFFFF" />
            <span>{isSubmitting ? t('grvSending') : t('grvSubmit')}</span>
          </button>

          <p className="text-[10px] text-ink-muted leading-relaxed">{t('grvMeta')}</p>
        </div>
      )}

      {/* The beneficiary's own filed tickets and their Ministry status */}
      {myTickets.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="font-caption text-[10px] text-ink-muted uppercase font-bold tracking-wider block">
            {formatGovText(lang, 'grvMyTickets', myTickets.length)}
          </span>
          {myTickets.map((ticket) => (
            <div key={ticket.ticketId} className="rounded border border-line bg-surface p-2.5 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-bold text-ink">
                  {ISSUE_LABEL_KEY[ticket.issueType]
                    ? t(ISSUE_LABEL_KEY[ticket.issueType])
                    : ticket.issueTypeHi}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${STATUS_STYLE[ticket.status]}`}
                >
                  {t(STATUS_LABEL_KEY[ticket.status])}
                </span>
              </div>
              <p className="text-[11px] text-ink-muted leading-relaxed">{ticket.description}</p>
              <p className="text-[10px] text-ink-muted font-mono">
                {ticket.ticketId} • {new Date(ticket.createdAt).toLocaleDateString(lang)}
                {ticket.captureMode === 'voice' ? ` • ${t('grvVoiceFiled')}` : ''}
              </p>
              {ticket.status === 'resolved' && ticket.resolvedNote && (
                <p className="text-[11px] text-emerald-800">
                  {formatGovText(lang, 'grvAction', ticket.resolvedNote)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
