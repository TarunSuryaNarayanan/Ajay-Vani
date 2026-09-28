import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  SpeakerIcon,
  DocumentIcon,
  CheckIcon,
  GraduationCapIcon,
  MapPinIcon
} from '../components/Icons';
import { speechService } from '../services/speech';
import { generateBusinessProposalPDF } from '../services/pdfGenerator';
import { getDashboardText, formatText } from '../services/translations';

export const BeneficiaryDashboardScreen: React.FC = () => {
  const {
    aadhaarSession,
    currentResult,
    selectedDistrict,
    selectedLanguage,
    setScreen,
    logoutAadhaar
  } = useApp();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  const t = (key: string) => getDashboardText(selectedLanguage || 'hi-IN', key);

  const profile = currentResult?.profile || {
    beneficiaryName: aadhaarSession?.beneficiaryName || "रमेश कुमार",
    educationLevel: t('dashEdu'),
    traditionalOccupation: t('dashOccupation'),
    employmentPreference: t('dashPreference'),
    mobilityRadius: t('dashRadius')
  };

  const nsqf = currentResult?.recommendedNSQF || {
    qpCode: "ELE/Q5901",
    roleName: "Solar PV Installer & Electrician",
    roleNameHi:
      selectedLanguage === 'en-IN'
        ? "Solar PV Installer & Electrician"
        : "सोलर पीवी इंस्टॉलर एवं तकनीशियन",
    nsqfLevel: 4,
    sector: "Green Jobs",
    matchScore: 92,
    estimatedIncome: "₹18,000 - ₹26,000 / माह"
  };

  const dashboardAudioText = t('dashAudio').replace('{name}', profile.beneficiaryName);

  const handlePlayVoice = () => {
    speechService.speak(
      dashboardAudioText,
      selectedLanguage,
      () => setIsPlayingAudio(true),
      () => setIsPlayingAudio(false)
    );
  };

  const handleDownloadPDF = () => {
    setIsDownloadingPDF(true);
    setTimeout(() => {
      generateBusinessProposalPDF(profile, nsqf, selectedDistrict);
      setIsDownloadingPDF(false);
    }, 500);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5 space-y-4">
      <div className="space-y-4">
        {/* Dashboard Title & Voice Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl text-ink">
              {t('dashTitle')}
            </h1>
            <p className="font-caption text-sm text-ink-muted mt-0.5">
              {t('dashSubtitle')}
            </p>
          </div>
          <button
            onClick={handlePlayVoice}
            className={`w-11 h-11 rounded border flex items-center justify-center transition-colors ${
              isPlayingAudio ? 'bg-action text-white border-action' : 'bg-surface border-line text-trust'
            }`}
            aria-label={t('dashPlayStatus')}
          >
            <SpeakerIcon size={20} color={isPlayingAudio ? '#FFFFFF' : '#009378'} />
          </button>
        </div>

        {/* Profile Card */}
        <div className="card-flat bg-white border-line p-4 space-y-3">
          <div className="flex items-start justify-between border-b border-line/60 pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-full bg-trust/10 border border-trust/30 text-trust flex items-center justify-center font-bold text-lg">
                👤
              </div>
              <div>
                <h2 className="font-bold text-base text-ink leading-tight">
                  {aadhaarSession?.beneficiaryName || profile.beneficiaryName}
                </h2>
                <div className="flex items-center space-x-2 mt-0.5 text-xs text-ink-muted">
                  <span className="font-mono bg-surface border border-line px-1.5 py-0.5 rounded text-[11px]">
                    {aadhaarSession?.maskedAadhaar || 'XXXX XXXX 7777'}
                  </span>
                  <span className="flex items-center text-trust font-semibold">
                    <MapPinIcon size={12} color="#009378" />
                    <span className="ml-0.5">{selectedDistrict}, UP</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full font-bold">
              <CheckIcon size={13} color="#064e3b" />
              <span>{t('dashScEligible')}</span>
            </div>
            <span className="text-ink-muted text-[11px]">
              {t('dashVerified')} <strong>{t('dashVerifiedOk')}</strong>
            </span>
          </div>
        </div>

        {/* active Trade Match */}
        <div className="card-flat bg-surface/80 border-line p-3.5 space-y-2">
          <div className="flex items-center space-x-2 text-trust text-xs font-semibold uppercase tracking-wider">
            <GraduationCapIcon size={16} color="#009378" />
            <span>{t('dashTradeLabel')}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-ink">{nsqf.roleNameHi}</h3>
              <p className="text-xs text-ink-muted">
                {nsqf.qpCode} • {formatText(selectedLanguage || 'hi-IN', 'dashNsqfLevel', nsqf.nsqfLevel)}
              </p>
            </div>
            <span className="bg-trust text-surface text-xs font-bold px-2 py-1 rounded">
              {formatText(selectedLanguage || 'hi-IN', 'dashMatchScore', nsqf.matchScore)}
            </span>
          </div>
        </div>

        {/* ₹50,000 PM-AJAY GIA Grant Tracker */}
        <div className="card-flat bg-white border-line p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-line/60 pb-2">
            <span className="font-caption text-xs uppercase font-bold tracking-wide text-ink">
              💰 {t('dashGrantTitle')}
            </span>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              {t('dashGrantPending')}
            </span>
          </div>

          {/* 4-Step Live Visual Timeline */}
          <div className="space-y-3 pt-1">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs">
                ✓
              </div>
              <div className="text-xs">
                <span className="font-bold text-ink block">{t('dashStep1')}</span>
                <span className="text-ink-muted text-[11px]">{t('dashStep1d')}</span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs">
                ✓
              </div>
              <div className="text-xs">
                <span className="font-bold text-ink block">{t('dashStep2')}</span>
                <span className="text-ink-muted text-[11px]">{t('dashStep2d')}</span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                ⏳
              </div>
              <div className="text-xs">
                <span className="font-bold text-amber-900 block">{t('dashStep3')}</span>
                <span className="text-amber-800 text-[11px]">{t('dashStep3d')}</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 opacity-50">
              <div className="w-5 h-5 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                4
              </div>
              <div className="text-xs">
                <span className="font-bold text-ink block">{t('dashStep4')}</span>
                <span className="text-ink-muted text-[11px]">{t('dashStep4d')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Training Center Stipend Tracker */}
        <div className="card-flat bg-trust/5 border-trust/20 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-caption text-xs font-bold text-trust uppercase">
              🏫 {t('dashStipendTitle')}
            </span>
            <span className="text-xs font-bold text-trust bg-trust/10 px-2 py-0.5 rounded">
              {t('dashPerDay')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="bg-white border border-line rounded p-2 text-center">
              <span className="text-ink-muted text-[11px] block">{t('dashAttendance')}</span>
              <strong className="text-base text-ink block mt-0.5">
                {formatText(selectedLanguage || 'hi-IN', 'dashAttendanceValue', 30, 30)}
              </strong>
            </div>
            <div className="bg-white border border-line rounded p-2 text-center">
              <span className="text-ink-muted text-[11px] block">{t('dashEarned')}</span>
              <strong className="text-base text-trust block mt-0.5">₹4,500</strong>
            </div>
          </div>
        </div>

        {/* 1-Click Proposal PDF Re-download */}
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloadingPDF}
          className="btn-primary w-full space-x-2"
        >
          <DocumentIcon size={18} color="#FFFFFF" />
          <span>
            {isDownloadingPDF ? t('dashDownloading') : t('dashDownload')}
          </span>
        </button>
      </div>

      {/* Footer Navigation */}
      <div className="mt-4 pt-3 border-t border-line space-y-2">
        <button
          onClick={() => setScreen('voice-chat')}
          className="btn-secondary w-full text-xs font-bold"
        >
          {t('dashNewInterview')}
        </button>

        <button
          onClick={logoutAadhaar}
          className="w-full py-2 text-center text-xs font-bold text-alert hover:underline"
        >
          {t('dashLogout')}
        </button>
      </div>

    </div>
  );
};
