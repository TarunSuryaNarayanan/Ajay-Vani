import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { speechService } from '../../services/speech';
import { daysSinceCompletion, daysUntilPostTraining } from '../../services/governance';
import { getGovText, formatGovText } from '../../services/governanceTranslations';
import { LifecycleNudgePanel } from './LifecycleNudgePanel';

/**
 * F2 + F3 — training completion ledger and the WhatsApp Day-45/Day-90 nudges.
 * Grouped in the dashboard side panel; the dashboard only shows grant/stipend status.
 */
export const TrainingLifecyclePanel: React.FC = () => {
  const {
    aadhaarSession,
    selectedLanguage,
    setScreen,
    completeCourse,
    simulatePostTrainingWindow,
    resetGovernanceState,
  } = useApp();
  const [completionStatus, setCompletionStatus] = useState<string | null>(null);

  const lang = selectedLanguage || 'hi-IN';
  const t = (key: string) => getGovText(lang, key);

  const completedAt = aadhaarSession?.completedAt ?? null;
  const elapsedDays = daysSinceCompletion(completedAt);
  const daysRemaining = daysUntilPostTraining(aadhaarSession);

  const handleCompleteCourse = async () => {
    const result = await completeCourse();
    setCompletionStatus(result.message);
    speechService.speak(result.message, selectedLanguage);
  };

  const handleSimulateDay90 = async () => {
    await simulatePostTrainingWindow();
    setCompletionStatus(t('trSimulated'));
  };

  const handleResetDemo = () => {
    resetGovernanceState();
    setCompletionStatus(t('trResetDone'));
  };

  const elapsedLabel =
    elapsedDays === null
      ? '—'
      : elapsedDays > 0
        ? formatGovText(lang, 'trElapsedDays', elapsedDays)
        : t('trElapsedToday');

  return (
    <div className="space-y-3">
      <div className="card-flat bg-white border-line p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-caption text-xs text-trust uppercase font-bold">{t('trTitle')}</span>
          {aadhaarSession?.courseCompleted && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              {t('trCompletedBadge')}
            </span>
          )}
        </div>

        {!aadhaarSession?.courseCompleted ? (
          <>
            <p className="text-xs text-ink-muted leading-relaxed">{t('trHint')}</p>
            <button onClick={handleCompleteCourse} className="btn-primary w-full text-xs">
              {t('trComplete')}
            </button>
          </>
        ) : (
          <>
            <div className="text-xs text-ink-muted space-y-1">
              <p>
                {formatGovText(
                  lang,
                  'trCompletedOn',
                  completedAt ? new Date(completedAt).toLocaleDateString(lang) : '—'
                )}
              </p>
              <p>{formatGovText(lang, 'trElapsed', elapsedLabel)}</p>
            </div>

            {daysRemaining > 0 ? (
              <div className="space-y-2">
                <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2.5 py-2">
                  {formatGovText(lang, 'trDaysLeft', daysRemaining)}
                </div>
                <button onClick={handleSimulateDay90} className="btn-secondary w-full text-[11px]">
                  {t('trSimulate')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setScreen('post-training-guidance')}
                className="btn-primary w-full text-xs"
              >
                {t('trStartGuidance')}
              </button>
            )}
          </>
        )}

        {completionStatus && <p className="text-[11px] text-trust">{completionStatus}</p>}

        {aadhaarSession?.courseCompleted && (
          <button onClick={handleResetDemo} className="w-full text-[11px] text-ink-muted hover:underline">
            {t('trReset')}
          </button>
        )}
      </div>

      <LifecycleNudgePanel />
    </div>
  );
};
