import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { fetchGrievanceSummary, fetchLifecycleEnrollments, fetchLifecycleSchedule, GrievanceSummary } from '../services/api';
import { GrievanceStatus, GrievanceTicket, LifecycleEnrollment } from '../types';
import { CheckIcon, AlertIcon, SyncIcon } from '../components/Icons';
import { speechService } from '../services/speech';
import { TwilioTelecomPanel } from '../components/Governance/TwilioTelecomPanel';

const STATUS_LABEL: Record<GrievanceStatus, string> = {
  open: 'नया (Open)',
  'in-review': 'जाँच में (In Review)',
  resolved: 'निपटान हुआ (Resolved)',
};

const STATUS_STYLE: Record<GrievanceStatus, string> = {
  open: 'bg-amber-50 text-amber-900 border-amber-200',
  'in-review': 'bg-blue-50 text-blue-900 border-blue-200',
  resolved: 'bg-emerald-50 text-emerald-900 border-emerald-200',
};

export const MinistryDashboardScreen: React.FC = () => {
  const {
    grievanceTickets,
    refreshGrievances,
    setGrievanceStatus,
    setScreen,
    selectedLanguage,
    isOnline,
  } = useApp();

  const [summary, setSummary] = useState<GrievanceSummary | null>(null);
  const [filter, setFilter] = useState<GrievanceStatus | 'all'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [schedule, setSchedule] = useState<{ dayOffset: number; labelHi: string }[]>([]);
  const [whatsappConfigured, setWhatsappConfigured] = useState(false);
  const [threads, setThreads] = useState<LifecycleEnrollment[]>([]);

  const load = async () => {
    setIsRefreshing(true);
    await refreshGrievances();
    const s = await fetchGrievanceSummary();
    if (s) setSummary(s);
    setThreads(await fetchLifecycleEnrollments());
    try {
      const sched = await fetchLifecycleSchedule();
      setSchedule(sched.schedule);
      setWhatsappConfigured(sched.whatsappConfigured);
    } catch {
      // Schedule metadata is optional; the dashboard still renders without it.
    }
    setIsRefreshing(false);
  };

  useEffect(() => {
    load();
  }, []);

  const tickets = grievanceTickets ?? [];
  const visibleTickets = tickets.filter((t) => filter === 'all' || t.status === filter);

  const announceSummary = () => {
    if (!summary) return;
    const text =
      `मंत्रालय निगरानी डैशबोर्ड। कुल शिकायतें: ${summary.total}। ` +
      `नया: ${summary.open}, जाँच में: ${summary.inReview}, निपटान: ${summary.resolved}।`;
    speechService.speak(text, selectedLanguage);
  };

  return (
    <div className="flex-1 flex flex-col p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">मंत्रालय निगरानी डैशबोर्ड</h1>
          <p className="font-caption text-sm text-ink-muted mt-1">
            शिकायत निवारण एवं जीवनचक्र सूचना — व्हाट्सएप
          </p>
        </div>
        <button
          onClick={announceSummary}
          className="w-11 h-11 rounded border bg-surface border-line text-trust flex items-center justify-center"
          aria-label="सारांश सुनें"
        >
          <CheckIcon size={20} color="#009378" />
        </button>
      </div>

      {!isOnline && (
        <div className="card-flat bg-amber-50 border-amber-200 p-3 text-xs text-amber-900 flex items-start space-x-2">
          <AlertIcon size={16} color="#B45309" />
          <span>ऑफलाइन: अंतिम सिंक की गई स्थिति दिख रही है।</span>
        </div>
      )}

      {/* Summary counters */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'कुल', value: summary?.total ?? tickets.length },
          { label: 'नया', value: summary?.open ?? 0 },
          { label: 'जाँच में', value: summary?.inReview ?? 0 },
          { label: 'निपटान', value: summary?.resolved ?? 0 },
        ].map((card) => (
          <div key={card.label} className="card-flat bg-white border-line p-2 text-center">
            <span className="block text-[10px] uppercase text-ink-muted">{card.label}</span>
            <strong className="block text-lg text-ink">{card.value}</strong>
          </div>
        ))}
      </div>

      {/* F2 lifecycle schedule + delivery health */}
      <div className="card-flat bg-trust/5 border-trust/20 p-3 space-y-2">
        <span className="font-caption text-xs font-bold text-trust uppercase">व्हाट्सएप जीवनचक्र सूचना</span>
        <div className="flex flex-wrap gap-2">
          {schedule.length === 0
            ? LIFECYCLE_FALLBACK.map((s) => (
                <span key={s.day} className="text-[11px] bg-white border border-line rounded px-2 py-1 text-ink-muted">
                  दिन {s.day}: {s.labelHi}
                </span>
              ))
            : schedule.map((s) => (
                <span key={s.dayOffset} className="text-[11px] bg-white border border-line rounded px-2 py-1 text-ink-muted">
                  दिन {s.dayOffset}: {s.labelHi}
                </span>
              ))}
        </div>
        <p className="text-[11px] text-ink-muted">
          डिलीवरी:{' '}
          {whatsappConfigured ? (
            <span className="text-trust font-semibold">Twilio क्रेडेंशियल कॉन्फ़िगर</span>
          ) : (
            <span className="text-alert font-semibold">Twilio क्रेडेंशियल अनुपस्थित — ड्राई मोड</span>
          )}
        </p>
      </div>

      {/* Twilio Telecom & Messaging Gateway */}
      <TwilioTelecomPanel />

      {/* F2 · Day-45 replies routed back to the profile stream */}
      <div className="space-y-2">
        <span className="font-caption text-xs text-ink-muted uppercase font-semibold">
          लाभार्थी व्हाट्सएप संवाद ({threads.length})
        </span>

        {threads.length === 0 && (
          <p className="text-xs text-ink-muted">अभी किसी लाभार्थी का व्हाट्सएप नामांकन नहीं है।</p>
        )}

        {threads.map((thread) => {
          const replies = thread.messages.filter((m) => m.direction === 'inbound');
          return (
            <div key={thread.beneficiaryId} className="card-flat bg-white border-line p-3 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-ink">{thread.beneficiaryName || thread.beneficiaryId}</p>
                  <p className="text-[10px] text-ink-muted">
                    {thread.district} • {thread.whatsappNumber}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${
                    replies.length > 0
                      ? 'bg-amber-50 text-amber-900 border-amber-200'
                      : 'bg-surface text-ink-muted border-line'
                  }`}
                >
                  {replies.length > 0 ? `${replies.length} उत्तर` : 'उत्तर नहीं'}
                </span>
              </div>

              {thread.messages.length === 0 && (
                <p className="text-[11px] text-ink-muted">अभी कोई संदेश नहीं।</p>
              )}

              {thread.messages.slice(-3).map((msg) => (
                <div
                  key={msg.messageId}
                  className={`text-[11px] rounded px-2 py-1.5 border ${
                    msg.direction === 'inbound'
                      ? 'bg-amber-50 border-amber-200 text-ink'
                      : 'bg-surface border-line text-ink-muted'
                  }`}
                >
                  <span className="font-bold block mb-0.5">
                    {msg.direction === 'inbound' ? `${thread.beneficiaryName || 'लाभार्थी'} ने लिखा:` : 'AJAY-VANI →'}
                  </span>
                  <p className="whitespace-pre-line">{msg.body}</p>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* F1 ticket ledger */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-caption text-xs text-ink-muted uppercase font-semibold">
            शिकायत टिकट ({visibleTickets.length})
          </span>
          <button
            onClick={load}
            className="flex items-center space-x-1 text-[11px] font-bold text-trust hover:underline"
          >
            <SyncIcon size={12} color="#009378" />
            <span>{isRefreshing ? 'रिफ्रेश हो रहा है...' : 'रिफ्रेश'}</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(['all', 'open', 'in-review', 'resolved'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`text-[11px] px-2 py-1 rounded border ${
                filter === key ? 'bg-trust text-surface border-trust' : 'bg-white text-ink-muted border-line'
              }`}
            >
              {key === 'all' ? 'सभी' : STATUS_LABEL[key]}
            </button>
          ))}
        </div>

        {visibleTickets.length === 0 && (
          <p className="text-xs text-ink-muted">अभी कोई शिकायत दर्ज नहीं है।</p>
        )}

        {visibleTickets.map((ticket) => (
          <TicketRow key={ticket.ticketId} ticket={ticket} onSetStatus={setGrievanceStatus} />
        ))}
      </div>

      <button onClick={() => setScreen('beneficiary-dashboard')} className="btn-secondary w-full text-xs">
        लाभार्थी डैशबोर्ड पर लौटें
      </button>
    </div>
  );
};

const LIFECYCLE_FALLBACK = [
  { day: 45, labelHi: 'जाँच' },
  { day: 90, labelHi: 'समापन सूचना' },
];

const TicketRow: React.FC<{
  ticket: GrievanceTicket;
  onSetStatus: (ticketId: string, status: GrievanceStatus, note?: string) => Promise<boolean>;
}> = ({ ticket, onSetStatus }) => {
  const [busy, setBusy] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [note, setNote] = useState('');

  const advance = async (status: GrievanceStatus) => {
    setBusy(true);
    await onSetStatus(ticket.ticketId, status, note.trim() || undefined);
    setBusy(false);
    setIsResolving(false);
  };

  return (
    <div className="card-flat bg-white border-line p-3 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-ink">{ticket.issueTypeHi}</p>
          <p className="text-[10px] text-ink-muted font-mono">{ticket.ticketId}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${STATUS_STYLE[ticket.status]}`}>
          {STATUS_LABEL[ticket.status]}
        </span>
      </div>

      <p className="text-xs text-ink leading-relaxed">{ticket.description}</p>

      <div className="text-[10px] text-ink-muted flex flex-wrap gap-x-3">
        <span>बेनिफिशियरी: <strong>{ticket.metadata.beneficiaryName || ticket.metadata.beneficiaryId}</strong></span>
        <span>ज़िला: <strong>{ticket.metadata.district}</strong></span>
        <span>केंद्र: <strong>{ticket.metadata.trainingCenterId}</strong></span>
        <span>कैप्चर: <strong>{ticket.captureMode === 'voice' ? 'आवाज़' : 'फ़ॉर्म'}</strong></span>
      </div>

      {ticket.status !== 'resolved' && (
        <div className="space-y-2 pt-1">
          {isResolving && (
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="कार्रवाई का विवरण (लाभार्थी को दिखेगा)"
              className="w-full p-2 border border-line rounded bg-surface text-[11px] text-ink"
            />
          )}
          <div className="flex gap-2">
            {ticket.status === 'open' && (
              <button
                onClick={() => advance('in-review')}
                disabled={busy}
                className="text-[11px] font-bold px-2 py-1 rounded border border-line bg-surface text-ink-muted"
              >
                जाँच शुरू करें
              </button>
            )}
            <button
              onClick={() => {
                if (!isResolving) {
                  setIsResolving(true);
                  return;
                }
                advance('resolved');
              }}
              disabled={busy}
              className="text-[11px] font-bold px-2 py-1 rounded bg-trust text-surface"
            >
              {isResolving ? 'पुष्टि करके निपटान करें' : 'निपटान करें'}
            </button>
          </div>
        </div>
      )}

      {ticket.status === 'resolved' && ticket.resolvedNote && (
        <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-2 py-1.5">
          कार्रवाई: {ticket.resolvedNote}
        </p>
      )}
    </div>
  );
};
