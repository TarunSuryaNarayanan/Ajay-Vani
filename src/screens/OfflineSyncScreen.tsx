import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { offlineStorage } from '../services/offlineStorage';
import { OfflineInterview } from '../types';
import { CheckIcon, SyncIcon, AlertIcon } from '../components/Icons';

export const OfflineSyncScreen: React.FC = () => {
  const { isOnline, unsyncedCount, isSyncing, justSynced, syncError, triggerSync, setScreen } = useApp();
  const [interviews, setInterviews] = useState<OfflineInterview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInterviews();
  }, [justSynced, isOnline]);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      const all = await offlineStorage.getAllInterviews();
      setInterviews(all.reverse());
    } catch (e) {
      console.warn("Error loading offline interviews", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5">
      <div className="space-y-4">
        {/* Screen Header */}
        <div>
          <h1 className="font-display text-2xl text-ink">
            ऑफलाइन डेटा एवं सिंक मॉनिटर
          </h1>
          <p className="font-caption text-sm text-ink-muted mt-1">
            दूरदराज ग्रामीण क्षेत्रों में बिना इंटरनेट रिकॉर्ड सुरक्षित रखने की प्रणाली
          </p>
        </div>

        {/* Network Status Badge */}
        <div className={`card-flat p-4 ${!isOnline ? 'bg-[#FC8A15]/10 border-action/40' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className={`w-3.5 h-3.5 rounded-full ${!isOnline ? 'bg-action animate-pulse' : 'bg-positive'}`} />
              <span className="font-bold text-base text-ink">
                {!isOnline ? "ऑफलाइन मोड (इंटरनेट अनुपलब्ध)" : "ऑनलाइन कनेक्टेड"}
              </span>
            </div>
            <span className="text-xs px-2 py-1 rounded bg-white font-semibold text-ink border border-line">
              {unsyncedCount} रिकॉर्ड लंबित
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-2">
            {!isOnline
              ? "सभी वॉयस इंटरव्यू डिवाइस की आंतरिक मेमोरी में सुरक्षित संग्रहीत हो रहे हैं। नेटवर्क मिलते ही स्वतः सिंक होंगे।"
              : "केंद्रीय सर्वर से कनेक्शन सक्रिय है। आपका डेटा सुरक्षित रूप से सिंक हो रहा है।"}
          </p>
        </div>

        {/* Success or Error Banners */}
        {justSynced && (
          <div className="p-3 rounded bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs flex items-center space-x-2">
            <CheckIcon size={16} color="#009378" />
            <span className="font-semibold">सारे लंबित इंटरव्यू सफलतापूर्वक सिंक हो गए हैं।</span>
          </div>
        )}

        {syncError && (
          <div className="p-3 rounded bg-alert/10 border border-alert/30 text-alert text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertIcon size={16} color="#C6482E" />
              <span>{syncError}</span>
            </div>
            <button
              onClick={triggerSync}
              className="text-xs font-bold underline"
            >
              दोबारा भेजने के लिए दबाएं
            </button>
          </div>
        )}

        {/* Queued Interviews List */}
        <div>
          <span className="font-caption text-xs text-ink-muted uppercase font-bold tracking-wider block mb-2">
            हालिया इंटरव्यू रिकॉर्ड्स ({interviews.length}):
          </span>

          {loading ? (
            <div className="text-center py-6 text-xs text-ink-muted">
              रिकॉर्ड्स लोड हो रहे हैं...
            </div>
          ) : interviews.length === 0 ? (
            <div className="card-flat bg-white border-line p-6 text-center text-xs text-ink-muted">
              अभी कोई इंटरव्यू दर्ज नहीं है। बातचीत शुरू करने के लिए मुख्य स्क्रीन पर जाएं।
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {interviews.map((item) => (
                <div key={item.id} className="card-flat bg-white border-line p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink text-sm">
                      {item.profile?.beneficiaryName || "ग्रामीण लाभार्थी"}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      item.isSynced ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {item.isSynced ? "सिंक पूर्ण" : "डिवाइस में सुरक्षित"}
                    </span>
                  </div>
                  <p className="text-ink-muted truncate">
                    अनुभव: {item.profile?.traditionalOccupation || "सामान्य"} | क्यूपी: {item.recommendedNSQF?.qpCode || "ELE/Q5901"}
                  </p>
                  <div className="text-[11px] text-ink-muted/80 flex items-center justify-between pt-1 border-t border-line/40">
                    <span>जिला: {item.district}</span>
                    <span>{new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 pt-4 border-t border-line space-y-3">
        <button
          onClick={triggerSync}
          disabled={!isOnline || isSyncing || unsyncedCount === 0}
          className="btn-primary w-full space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SyncIcon size={18} color="#FFFFFF" />
          <span>
            {isSyncing
              ? "सिंक किया जा रहा है..."
              : unsyncedCount === 0
              ? "सभी रिकॉर्ड सिंक हैं"
              : "अभी सिंक करें (Sync Now)"}
          </span>
        </button>

        <button
          onClick={() => setScreen('voice-chat')}
          className="btn-secondary w-full"
        >
          वॉयस चैट पर वापस जाएं
        </button>
      </div>
    </div>
  );
};
