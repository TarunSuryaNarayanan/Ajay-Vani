import React from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowBackIcon, SyncIcon } from '../Icons';

export const Header: React.FC = () => {
  const { currentScreen, setScreen, selectedDialectName, unsyncedCount, isOnline } = useApp();

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
      default:
        setScreen('language-select');
    }
  };

  return (
    <header className="w-full bg-trust text-surface min-h-[56px] px-4 py-2 flex items-center justify-between sticky top-0 z-30 select-none">
      <div className="flex items-center space-x-2">
        {currentScreen !== 'language-select' && (
          <button
            onClick={handleBack}
            className="w-10 h-10 -ml-2 rounded flex items-center justify-center hover:bg-black/10 focus-visible:outline-white"
            aria-label="पीछे जाएं (Go Back)"
          >
            <ArrowBackIcon size={22} color="#F6F6F6" />
          </button>
        )}
        <div className="flex flex-col">
          <span className="font-semibold text-base leading-tight tracking-wide">
            AJAY-VANI
          </span>
          <span className="text-[11px] text-surface/80 leading-none">
            पीएम-अजय आजीविका वाणी
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {/* Sync status indicator */}
        <button
          onClick={() => setScreen('offline-sync')}
          className="px-2 py-1 rounded bg-black/15 flex items-center space-x-1.5 text-xs text-surface hover:bg-black/25"
          aria-label="सिंक मॉनिटर"
        >
          <div className={`w-2 h-2 rounded-full ${!isOnline ? 'bg-action' : unsyncedCount > 0 ? 'bg-amber-400' : 'bg-positive'}`} />
          <span>{unsyncedCount > 0 ? `${unsyncedCount}` : 'सिंक'}</span>
          <SyncIcon size={12} color="#F6F6F6" />
        </button>

        {/* Selected language pill/button */}
        <button
          onClick={() => setScreen('language-select')}
          className="px-2.5 py-1 rounded bg-surface/15 text-xs font-semibold hover:bg-surface/25 border border-surface/20"
          aria-label="भाषा बदलें"
        >
          {selectedDialectName} ▾
        </button>
      </div>
    </header>
  );
};
