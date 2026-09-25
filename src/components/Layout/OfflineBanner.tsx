import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckIcon, SyncIcon } from '../Icons';

export const OfflineBanner: React.FC = () => {
  const { isOnline, unsyncedCount, justSynced, setScreen } = useApp();

  if (justSynced) {
    return (
      <div 
        className="w-full px-4 py-2 bg-emerald-50 border-b border-line flex items-center justify-between text-sm"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
            <CheckIcon size={14} color="#FFFFFF" />
          </div>
          <span className="font-caption text-ink font-medium">सभी रिकॉर्ड सिंक हो गए हैं</span>
        </div>
      </div>
    );
  }

  if (!isOnline || unsyncedCount > 0) {
    return (
      <div 
        onClick={() => setScreen('offline-sync')}
        className="w-full px-4 py-2.5 bg-[#FC8A15]/10 border-b border-line flex items-center justify-between cursor-pointer"
        role="alert"
      >
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-action animate-pulse" />
          <span className="font-caption text-ink font-medium">
            {!isOnline 
              ? "इंटरनेट नहीं, डिवाइस में सुरक्षित सेव हो रहा है" 
              : `${unsyncedCount} रिकॉर्ड सिंक के लिए लंबित`}
          </span>
        </div>
        <button 
          className="text-xs font-semibold text-action flex items-center space-x-1"
          aria-label="सिंक स्थिति देखें"
        >
          <span>सिंक स्थिति</span>
          <SyncIcon size={12} color="#FC8A15" />
        </button>
      </div>
    );
  }

  return null;
};
