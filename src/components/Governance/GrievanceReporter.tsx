import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GRIEVANCE_ISSUE_OPTIONS, GRIEVANCE_DICTATION_PROMPT } from '../../services/governance';
import { speechService } from '../../services/speech';
import { MicIcon, SpeakerIcon, CheckIcon } from '../Icons';
import { GrievanceIssueType, GrievanceStatus } from '../../types';

const STATUS_LABEL: Record<GrievanceStatus, string> = {
  open: 'मंत्रालय के समक्ष लंबित',
  'in-review': 'जाँच जारी',
  resolved: 'निपटान हो गया',
};

const STATUS_STYLE: Record<GrievanceStatus, string> = {
  open: 'bg-amber-50 text-amber-900 border-amber-200',
  'in-review': 'bg-blue-50 text-blue-900 border-blue-200',
  resolved: 'bg-emerald-50 text-emerald-900 border-emerald-200',
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

  // Spec §1.3 — the complaint lives on the beneficiary's own profile, so the
  // beneficiary needs to see how the Ministry is progressing it.
  useEffect(() => {
    refreshGrievances();
  }, [aadhaarSession?.aadhaarNumber]);

  const myTickets = (grievanceTickets ?? []).filter(
    (t) => t.metadata.beneficiaryId === aadhaarSession?.aadhaarNumber
  );

  const promptForIssue = GRIEVANCE_ISSUE_OPTIONS.find((o) => o.value === issueType)?.voicePrompt || '';

  const handleSubmit = async () => {
    if (!description.trim()) {
      setStatus({ tone: 'err', text: 'कृपया शिकायत का विवरण लिखें या बोलकर दर्ज करें।' });
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
            शिकायत एवं भ्रष्टाचार रिपोर्टिंग
          </span>
          <span className="text-[11px] text-ink-muted">शिकायत सीधे मंत्रालय डैशबोर्ड पर जाती है</span>
        </div>
        <button
          onClick={() => {
            setIsOpen((v) => !v);
            setStatus(null);
          }}
          className="text-[11px] font-bold text-trust hover:underline"
        >
          {isOpen ? 'बंद करें' : 'शिकायत दर्ज करें'}
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
        aria-label="समस्या की आवाज़ से रिपोर्ट करें"
      >
        <MicIcon size={20} color={isListening ? '#FFFFFF' : '#C6482E'} />
        <span className="text-sm font-bold">
          {isListening ? 'सुन रहा है… बोलकर रोकें' : 'समस्या बोलकर रिपोर्ट करें (Report Issue)'}
        </span>
      </button>

      {isOpen && (
        <div className="space-y-3 pt-1">
          <div>
            <label className="font-caption text-xs text-ink-muted uppercase font-semibold block mb-1">
              समस्या का प्रकार (आवश्यक)
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
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => speechService.speak(promptForIssue, selectedLanguage)}
              className="mt-1.5 flex items-center space-x-1 text-[11px] font-semibold text-trust hover:underline"
            >
              <SpeakerIcon size={12} color="#009378" />
              <span>यह प्रश्न सुनें: {promptForIssue}</span>
            </button>
          </div>

          <div>
            <label className="font-caption text-xs text-ink-muted uppercase font-semibold block mb-1">
              शिकायत का विवरण
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setCaptureMode('form');
              }}
              rows={4}
              placeholder="यहाँ लिखें, या ऊपर माइक बटन दबाकर बोलें…"
              className="w-full p-2.5 border border-line rounded bg-surface text-sm text-ink leading-relaxed"
            />
            <p className="text-[11px] text-ink-muted mt-1">{GRIEVANCE_DICTATION_PROMPT}</p>
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
              ऑफलाइन: शिकायत सुरक्षित रखी जाएगी और कनेक्शन मिलते ही भेज दी जाएगी।
              {pendingGrievanceCount > 0 ? ` (${pendingGrievanceCount} प्रतीक्षा में)` : ''}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            <CheckIcon size={16} color="#FFFFFF" />
            <span>{isSubmitting ? 'भेजा जा रहा है...' : 'शिकायत मंत्रालय डैशबोर्ड भेजें'}</span>
          </button>

          <p className="text-[10px] text-ink-muted leading-relaxed">
            आपका आधार नंबर, सक्रिय ज़िला और आवंटित प्रशिक्षण केंद्र आईडी स्वतः टिकट से जुड़ जाती है।
          </p>
        </div>
      )}

      {/* The beneficiary's own filed tickets and their Ministry status */}
      {myTickets.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="font-caption text-[10px] text-ink-muted uppercase font-bold tracking-wider block">
            आपकी दर्ज शिकायतें ({myTickets.length})
          </span>
          {myTickets.map((ticket) => (
            <div key={ticket.ticketId} className="rounded border border-line bg-surface p-2.5 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-bold text-ink">{ticket.issueTypeHi}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${STATUS_STYLE[ticket.status]}`}
                >
                  {STATUS_LABEL[ticket.status]}
                </span>
              </div>
              <p className="text-[11px] text-ink-muted leading-relaxed">{ticket.description}</p>
              <p className="text-[10px] text-ink-muted font-mono">
                {ticket.ticketId} • {new Date(ticket.createdAt).toLocaleDateString('hi-IN')}
                {ticket.captureMode === 'voice' ? ' • आवाज़ से दर्ज' : ''}
              </p>
              {ticket.status === 'resolved' && ticket.resolvedNote && (
                <p className="text-[11px] text-emerald-800">कार्रवाई: {ticket.resolvedNote}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
