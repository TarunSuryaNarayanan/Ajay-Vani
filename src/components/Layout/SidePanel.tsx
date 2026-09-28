import React, { ReactNode, useEffect } from 'react';
import { ArrowBackIcon } from '../Icons';

interface Props {
  isOpen: boolean;
  title: string;
  closeLabel?: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Right-hand slide-over panel scoped to the phone shell. Used to host secondary
 * beneficiary tools (complaints, training lifecycle, QR token) so the main
 * dashboard stays readable.
 */
export const SidePanel: React.FC<Props> = ({ isOpen, title, closeLabel, onClose, children }) => {
  const closeText = closeLabel || 'बंद करें (Close panel)';
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button
        onClick={onClose}
        className="absolute inset-0 bg-ink/40"
        aria-label={closeText}
        tabIndex={-1}
      />

      <aside className="relative h-full w-[88%] max-w-[420px] bg-surface border-l border-line shadow-lg flex flex-col animate-slide-in">
        <header className="flex items-center gap-2 bg-trust text-surface px-3 py-2.5 shrink-0">
          <button
            onClick={onClose}
            className="w-9 h-9 -ml-1 rounded flex items-center justify-center hover:bg-black/10"
            aria-label={closeText}
          >
            <ArrowBackIcon size={20} color="#F6F6F6" />
          </button>
          <h2 className="font-display text-lg leading-tight">{title}</h2>
        </header>

        <div className="flex-1 overflow-y-auto p-3.5 space-y-3">{children}</div>
      </aside>
    </div>
  );
};

interface TabItem<T extends string> {
  id: T;
  label: string;
  icon: ReactNode;
}

interface TabPanelProps<T extends string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onSelect: (id: T) => void;
  children: ReactNode;
}

export function TabBar<T extends string>({ tabs, activeTab, onSelect, children }: TabPanelProps<T>) {
  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 sticky top-0 z-10 -mx-0.5 px-0.5 py-1 bg-surface/95 backdrop-blur">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-[11px] font-bold transition-colors ${
              activeTab === tab.id
                ? 'bg-trust text-surface border-trust'
                : 'bg-white text-ink-muted border-line hover:border-trust/50'
            }`}
            aria-pressed={activeTab === tab.id}
          >
            {tab.icon}
            <span className="leading-tight text-center">{tab.label}</span>
          </button>
        ))}
      </div>
      <div>{children}</div>
    </div>
  );
}
