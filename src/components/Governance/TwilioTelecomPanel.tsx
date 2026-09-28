import React, { useState, useEffect } from 'react';
import {
  fetchTwilioStatus,
  sendTwilioTestMessage,
  TwilioGatewayStatus,
} from '../../services/api';

export const TwilioTelecomPanel: React.FC = () => {
  const [status, setStatus] = useState<TwilioGatewayStatus | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('+919452018290');
  const [channel, setChannel] = useState<'sms' | 'whatsapp' | 'auto'>('auto');
  const [templateKey, setTemplateKey] = useState('otp');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    channel: string;
    messageSid: string | null;
    reason: string;
    mode: string;
  } | null>(null);
  const [history, setHistory] = useState<
    Array<{
      id: string;
      to: string;
      channel: string;
      text: string;
      sid: string | null;
      time: string;
      mode: string;
    }>
  >([]);

  useEffect(() => {
    fetchTwilioStatus().then(setStatus);
  }, []);

  const templates: Record<string, string> = {
    otp: '[PM-AJAY | AJAY-VANI] आपका सत्यापन कोड (OTP) है: 4892। यह 10 मिनट के लिए मान्य है। किसी के साथ साझा न करें।',
    admission:
      '[PM-AJAY] प्रिय लाभार्थी, आपका इलेक्ट्रिशियन (ELE/Q5901) कोर्स में प्रवेश स्वीकृत हो गया है! टोकन: AJAY-8921-VARANASI। प्रशिक्षण केंद्र: PMKK कचहरी, वाराणसी।',
    lifecycle:
      'नमस्ते जी! AJAY-VANI से 45-दिवसीय जाँच: आपका प्रशिक्षण कैसा चल रहा है? कोई सहायता चाहिए तो इस संदेश का उत्तर दें।',
    grant:
      '[PM-AJAY] बधाई! आपका प्रशिक्षण पूर्ण हुआ। ₹50,000 अनुदान और मुद्रा लोन के लिए AJAY-VANI ऐप पर विवरण देखें।',
    custom: customMessage || 'PM-AJAY | AJAY-VANI Twilio Gateway Test Notification',
  };

  const activeMessageText = templateKey === 'custom' ? customMessage : templates[templateKey];

  const handleSend = async () => {
    if (!phoneNumber.trim()) return;
    setIsSending(true);
    setResult(null);

    try {
      const res = await sendTwilioTestMessage({
        phoneNumber,
        message: activeMessageText,
        channel,
      });

      setResult({
        success: res.success,
        channel: res.channel,
        messageSid: res.messageSid,
        reason: res.reason,
        mode: res.mode,
      });

      setHistory((prev) => [
        {
          id: `tx_${Date.now()}`,
          to: phoneNumber,
          channel: res.channel,
          text: activeMessageText,
          sid: res.messageSid,
          time: new Date().toLocaleTimeString(),
          mode: res.mode,
        },
        ...prev.slice(0, 4),
      ]);
    } catch (e: any) {
      setResult({
        success: false,
        channel,
        messageSid: null,
        reason: e.message || 'Dispatch failed',
        mode: 'error',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="card-flat bg-white border-line p-4 space-y-4 rounded-xl shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-line">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
            📡
          </div>
          <div>
            <h3 className="font-display text-base text-ink font-bold">
              Twilio Telecom & Messaging Gateway
            </h3>
            <p className="font-caption text-xs text-ink-muted">
              Live SMS, WhatsApp, OTP dispatch and lifecycle nudges
            </p>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center space-x-2">
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
              status?.smsConfigured
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            SMS: {status?.smsConfigured ? 'LIVE' : 'DRY-RUN'}
          </span>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
              status?.whatsappConfigured
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            WhatsApp: {status?.whatsappConfigured ? 'LIVE' : 'DRY-RUN'}
          </span>
        </div>
      </div>

      {/* Gateway Configuration Info */}
      <div className="bg-surface border border-line rounded-lg p-2.5 text-xs text-ink-muted flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-semibold text-ink">Account SID: </span>
          <code className="font-mono text-ink">
            {status?.accountSidMasked || 'None (Running in Dry/Demo mode)'}
          </code>
        </div>
        <div>
          <span className="font-semibold text-ink">Sender: </span>
          <code className="font-mono text-ink">
            {status?.smsFrom || status?.whatsappFrom || 'Simulated'}
          </code>
        </div>
      </div>

      {/* Interactive Live Message Dispatch Form */}
      <div className="space-y-3 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Recipient Phone Number
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+91 94520 18290"
              className="w-full text-xs font-mono border border-line rounded-lg p-2 bg-white focus:outline-none focus:border-trust"
            />
          </div>

          {/* Channel Selector */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Dispatch Channel
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(['auto', 'sms', 'whatsapp'] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannel(ch)}
                  className={`py-1.5 px-2 text-xs font-medium rounded border uppercase ${
                    channel === ch
                      ? 'bg-action text-white border-action'
                      : 'bg-surface border-line text-ink hover:bg-black/5'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Message Templates */}
        <div>
          <label className="block text-xs font-semibold text-ink mb-1">
            Choose Message Template or Custom Text
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {[
              { id: 'otp', label: '🔑 Aadhaar OTP' },
              { id: 'admission', label: '🎓 Course Admission' },
              { id: 'lifecycle', label: '📅 Day 45 Check-in' },
              { id: 'grant', label: '🏛️ Grant Approval' },
              { id: 'custom', label: '✍️ Custom' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplateKey(t.id)}
                className={`text-[11px] px-2 py-1 rounded border transition-colors ${
                  templateKey === t.id
                    ? 'bg-trust text-white border-trust'
                    : 'bg-surface border-line text-ink-muted hover:border-trust hover:text-trust'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {templateKey === 'custom' ? (
            <textarea
              rows={2}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Type custom notification message..."
              className="w-full text-xs border border-line rounded-lg p-2 bg-white focus:outline-none focus:border-trust"
            />
          ) : (
            <div className="bg-surface border border-line rounded-lg p-2.5 text-xs font-mono text-ink">
              {activeMessageText}
            </div>
          )}
        </div>

        {/* Dispatch Action Button */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || !phoneNumber.trim()}
            className={`btn-primary text-xs py-2 px-4 flex items-center space-x-2 ${
              isSending ? 'opacity-70 cursor-wait' : ''
            }`}
          >
            <span>{isSending ? 'Sending...' : '🚀 Dispatch Message via Twilio'}</span>
          </button>

          {result && (
            <div
              className={`text-xs px-2.5 py-1 rounded border font-mono ${
                result.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}
            >
              {result.success ? '✓ Sent' : '⚠ Dry-mode'}{' '}
              {result.messageSid ? `(${result.messageSid.slice(0, 10)}...)` : `[${result.reason}]`}
            </div>
          )}
        </div>
      </div>

      {/* Dispatch History Log */}
      {history.length > 0 && (
        <div className="pt-2 border-t border-line space-y-2">
          <span className="text-[11px] uppercase font-bold text-ink-muted tracking-wider">
            Recent Telephony Dispatches ({history.length})
          </span>
          <div className="space-y-1.5">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-surface border border-line rounded p-2 text-xs flex items-start justify-between space-x-2"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-ink">{item.to}</span>
                    <span className="uppercase text-[9px] bg-white border border-line px-1 rounded font-mono">
                      {item.channel}
                    </span>
                    <span className="text-[10px] text-ink-muted">{item.time}</span>
                  </div>
                  <p className="text-ink-muted text-[11px] line-clamp-1">{item.text}</p>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    item.mode === 'live'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {item.mode}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
