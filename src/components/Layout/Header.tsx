import React from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowBackIcon, SyncIcon } from '../Icons';

export const Header: React.FC = () => {
  const { 
    currentScreen, 
    setScreen, 
    selectedDialectName, 
    unsyncedCount,
    pendingGrievanceCount,
    isOnline, 
    isAadhaarLoggedIn 
  } = useApp();

  const handleBack = () => {
    switch (currentScreen) {
      case 'voice-chat':
        setScreen('language-select');
        break;
      case 'nsqf-profile':
        setScreen('voice-chat');
        break;
      case 'skilling-jobs':
        setScreen('nsqf-profile');
        break;
      case 'micro-finance':
        setScreen('skilling-jobs');
        break;
      case 'offline-sync':
        setScreen('voice-chat');
        break;
      case 'aadhaar-login':
        setScreen('language-select');
        break;
      case 'aadhaar-otp':
        setScreen('aadhaar-login');
        break;
      case 'beneficiary-dashboard':
        setScreen('language-select');
        break;
      case 'post-training-guidance':
        setScreen('beneficiary-dashboard');
        break;
      case 'ministry-dashboard':
        setScreen('beneficiary-dashboard');
        break;
      default:
        setScreen('language-select');
    }
  };

  return (
    <header className="w-full bg-trust text-surface min-h-[56px] px-3.5 py-2 flex items-center justify-between sticky top-0 z-30 select-none">
      <div className="flex items-center space-x-2">
        {currentScreen !== 'language-select' && (
          <button
            onClick={handleBack}
            className="w-9 h-9 -ml-1.5 rounded flex items-center justify-center hover:bg-black/10 focus-visible:outline-white"
            aria-label="पीछे जाएं (Go Back)"
          >
            <ArrowBackIcon size={20} color="#F6F6F6" />
          </button>
        )}
        <div 
          onClick={() => setScreen('language-select')}
          className="flex flex-col cursor-pointer"
        >
          <span className="font-semibold text-base leading-tight tracking-wide">
            AJAY-VANI
          </span>
          <span className="text-[11px] text-surface/80 leading-none">
            पीएम-अजय आजीविका वाणी
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-1.5">
        {/* Ministry Monitoring Dashboard access (F1 grievance destination) */}
        <button
          onClick={() => setScreen('ministry-dashboard')}
          className="relative px-2 py-1 rounded bg-black/20 text-surface hover:bg-black/30 text-xs font-bold"
          aria-label="मंत्रालय निगरानी डैशबोर्ड"
        >
          <span>🏛️</span>
          <span className="hidden sm:inline"> मंत्रालय</span>
          {pendingGrievanceCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-action text-surface text-[10px] font-bold flex items-center justify-center">
              {pendingGrievanceCount}
            </span>
          )}
        </button>

        {/* Aadhaar Dashboard Button */}
        <button
          onClick={() => setScreen(isAadhaarLoggedIn ? 'beneficiary-dashboard' : 'aadhaar-login')}
          className={`px-2 py-1 rounded text-xs font-bold transition-colors flex items-center space-x-1 ${
            isAadhaarLoggedIn 
              ? 'bg-amber-400 text-amber-950 font-bold shadow-sm' 
              : 'bg-black/20 text-surface hover:bg-black/30'
          }`}
          aria-label="आधार डैशबोर्ड"
        >
          <span>🆔</span>
          <span>{isAadhaarLoggedIn ? 'डैशबोर्ड' : 'आधार'}</span>
        </button>

        {/* Sync status indicator */}
        <button
          onClick={() => setScreen('offline-sync')}
          className="px-2 py-1 rounded bg-black/15 flex items-center space-x-1 text-xs text-surface hover:bg-black/25"
          aria-label="सिंक मॉनिटर"
        >
          <div className={`w-2 h-2 rounded-full ${!isOnline ? 'bg-action' : unsyncedCount > 0 ? 'bg-amber-400' : 'bg-positive'}`} />
          <span>{unsyncedCount > 0 ? `${unsyncedCount}` : 'सिंक'}</span>
          <SyncIcon size={12} color="#F6F6F6" />
        </button>

        {/* Selected language pill/button */}
        <button
          onClick={() => setScreen('language-select')}
          className="px-2 py-1 rounded bg-surface/15 text-xs font-semibold hover:bg-surface/25 border border-surface/20"
          aria-label="भाषा बदलें"
        >
          {selectedDialectName} ▾
        </button>
      </div>
    </header>
  );
};
