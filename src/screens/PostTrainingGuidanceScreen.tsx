import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  SpeakerIcon,
  DocumentIcon,
  CheckIcon,
  BriefcaseIcon,
  AlertIcon,
  MicIcon,
} from '../components/Icons';
import { speechService } from '../services/speech';
import { generateBusinessProposalPDF } from '../services/pdfGenerator';
import { fetchLocalEmployers } from '../services/api';
import {
  daysSinceCompletion,
  formatPostTrainingElapsed,
  isPostTrainingEligible,
  resolveSpokenPath,
} from '../services/governance';
import { getPostTrainingCopy } from '../services/postTrainingTranslations';
import { localTradeName } from '../services/spokenResponse';
import { BeneficiaryProfile, LanguageCode, PostTrainingJobOpening, PostTrainingPath, RecommendedNSQF } from '../types';

const FALLBACK_PROFILE: BeneficiaryProfile = {
  beneficiaryName: 'रमेश कुमार',
  educationLevel: '8वीं पास',
  traditionalOccupation: 'सोलर पीवी एवं बिजली कार्य',
  employmentPreference: 'स्वरोजगार (Self-Employment)',
  mobilityRadius: 'जिले के अंदर (15 किमी)',
};

const FALLBACK_NSQF: RecommendedNSQF = {
  qpCode: 'ELE/Q5901',
  roleName: 'Solar PV Installer & Electrician',
  roleNameHi: 'सोलर पीवी इंस्टॉलर एवं तकनीशियन',
  nsqfLevel: 4,
  sector: 'Green Jobs',
  matchScore: 92,
  estimatedIncome: '₹18,000 - ₹26,000 / माह',
};

export const PostTrainingGuidanceScreen: React.FC = () => {
  const { aadhaarSession, currentResult, selectedDistrict, selectedLanguage, setScreen } = useApp();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activePath, setActivePath] = useState<PostTrainingPath | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [openings, setOpenings] = useState<PostTrainingJobOpening[] | null>(null);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isListeningForAnswer, setIsListeningForAnswer] = useState(false);
  const [heardAnswer, setHeardAnswer] = useState<string | null>(null);

  const copy = getPostTrainingCopy(selectedLanguage as LanguageCode);
  const profile = currentResult?.profile || FALLBACK_PROFILE;
  const nsqf = currentResult?.recommendedNSQF || FALLBACK_NSQF;
  // Devanagari languages get the Hindi trade name; everyone else gets the one
  // their voice can actually pronounce.
  const tradeName = localTradeName(
    {
      beneficiaryName: '',
      qpCode: nsqf.qpCode,
      roleName: nsqf.roleName,
      roleNameHi: nsqf.roleNameHi,
      district: selectedDistrict,
      centreCount: 0,
    },
    selectedLanguage as LanguageCode
  );
  const completedAt = aadhaarSession?.completedAt ?? null;
  const eligible = isPostTrainingEligible(aadhaarSession);
  const elapsedDays = daysSinceCompletion(completedAt);
  const unlocked = !!aadhaarSession && !!aadhaarSession.courseCompleted && !!completedAt;
  const openerText = format(
    copy.openerCombined,
    copy.prompts.business,
    copy.prompts.job
  );

  // Plays the opening prompt once when the second conversation loop opens.
  useEffect(() => {
    if (!unlocked) return;
    speechService.speak(
      openerText,
      selectedLanguage,
      () => setIsPlayingAudio(true),
      () => setIsPlayingAudio(false)
    );
  }, [unlocked]);

  const handlePlayPrompt = (path: PostTrainingPath) => {
    speechService.speak(copy.prompts[path], selectedLanguage, () => setIsPlayingAudio(true), () =>
      setIsPlayingAudio(false)
    );
  };

  // Small %s helper: these strings are authored printf-style.
  function format(template: string, ...values: (string | number)[]): string {
    let i = 0;
    return template.replace(/%s/g, () => String(values[i++] ?? ''));
  }

  /**
   * The second conversation is a real exchange: Gram Sahayak asks, the
   * beneficiary answers out loud, and the answer picks the path. Tapping a
   * path still works, so this only adds a way in.
   */
  const handleVoiceAnswer = async () => {
    if (isListeningForAnswer) {
      await speechService.stopListening();
      setIsListeningForAnswer(false);
      return;
    }

    setHeardAnswer(null);
    setIsListeningForAnswer(true);

    try {
      await speechService.startListening(
        selectedLanguage,
        (text: string, isFinal: boolean) => {
          if (!isFinal) return;
          setIsListeningForAnswer(false);
          setHeardAnswer(text);
          const path = resolveSpokenPath(text);
          if (path) {
            selectPath(path);
            handlePlayPrompt(path);
          }
        },
        () => setIsListeningForAnswer(false),
        () => setIsListeningForAnswer(false)
      );
    } catch {
      setIsListeningForAnswer(false);
    }
  };

  const handleGeneratePDF = () => {
    setIsGeneratingPDF(true);
    setTimeout(() => {
      // Reuses the certified-trade-populated PM-AJAY proposal generator as-is.
      generateBusinessProposalPDF(profile, nsqf, selectedDistrict);
      setIsGeneratingPDF(false);
      setPdfGenerated(true);
    }, 600);
  };

  const loadJobs = async () => {
    setIsLoadingJobs(true);
    setJobsError(null);
    try {
      const result = await fetchLocalEmployers({
        district: aadhaarSession?.district || selectedDistrict,
        qpCode: nsqf.qpCode,
        nsqfLevel: nsqf.nsqfLevel,
      });
      setOpenings(result.openings);
    } catch (e) {
      setOpenings([]);
      setJobsError(copy.jobsError);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const selectPath = (path: PostTrainingPath) => {
    setActivePath(path);
    if (path === 'job' && openings === null) {
      loadJobs();
    }
  };

  // Spec §3: the loop only opens for certified Day-90+ beneficiaries. Anyone
  // else keeps the legacy micro-finance path instead of a dead end.
  if (!unlocked) {
    return (
      <div className="flex-1 flex flex-col justify-between p-5 space-y-4">
        <div className="space-y-3">
          <h1 className="font-display text-2xl text-ink">प्रशिक्षणोत्तर मार्गदर्शन</h1>
          <div className="card-flat bg-white border-line p-4 flex items-start space-x-3">
            <AlertIcon size={18} color="#C6482E" />
            <p className="text-xs text-ink leading-relaxed">
              {copy.lockedBody}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <button onClick={() => setScreen('micro-finance')} className="btn-primary w-full">
            {copy.lockedOpenLegacy}
          </button>
          <button onClick={() => setScreen('beneficiary-dashboard')} className="btn-secondary w-full">
            {copy.backToDashboard}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between p-5">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl text-ink">{copy.screenTitle}</h1>
            <p className="font-caption text-sm text-ink-muted mt-1">
              {format(copy.certifiedTrade, tradeName, nsqf.qpCode)}
            </p>
            {elapsedDays !== null && (
              <p className="text-[11px] text-trust font-semibold mt-1">
                {format(copy.trainingCompleted, formatPostTrainingElapsed(elapsedDays))}
              </p>
            )}
          </div>
          <button
            onClick={() =>
              speechService.speak(openerText, selectedLanguage, () => setIsPlayingAudio(true), () =>
                setIsPlayingAudio(false)
              )
            }
            className={`w-11 h-11 rounded border flex items-center justify-center transition-colors ${
              isPlayingAudio ? 'bg-action text-white border-action' : 'bg-surface border-line text-trust'
            }`}
            aria-label={copy.listenAria}
          >
            <SpeakerIcon size={20} color={isPlayingAudio ? '#FFFFFF' : '#009378'} />
          </button>
        </div>

        {!eligible && (
          <div className="card-flat bg-amber-50 border-amber-200 p-3 text-xs text-amber-900">
            {copy.previewNotice}
          </div>
        )}

        {/* AI voice prompt + the three guided paths */}
        <div className="card-flat bg-trust/5 border-trust/20 p-4 space-y-3">
          <span className="font-caption text-xs text-trust uppercase font-semibold block">
            {copy.promptLabel}
          </span>
          <p className="text-sm font-medium text-ink leading-relaxed">
            “{openerText}”
          </p>

          {/* The beneficiary can answer out loud; tapping a path below still works. */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={handleVoiceAnswer}
              className={`btn-secondary text-xs inline-flex items-center gap-1.5 ${
                isListeningForAnswer ? 'bg-action/10 border-action' : ''
              }`}
              aria-pressed={isListeningForAnswer}
            >
              <MicIcon size={16} color={isListeningForAnswer ? '#FC8A15' : '#009378'} />
              {isListeningForAnswer ? copy.voiceListening : copy.answerByVoice}
            </button>
            <span className="text-[11px] text-ink-muted">{copy.voiceAnswerHint}</span>
          </div>
          {heardAnswer && (
            <p className="text-[11px] text-ink-muted pt-1">{format(copy.voiceHeard, heardAnswer)}</p>
          )}

          <div className="space-y-2 pt-1">
            {/* Path A */}
            <button
              onClick={() => {
                selectPath('business');
                handlePlayPrompt('business');
              }}
              className={`w-full text-left card-flat p-3 flex items-start space-x-3 transition-colors ${
                activePath === 'business' ? 'bg-trust/10 border-trust' : 'bg-white border-line'
              }`}
            >
              <DocumentIcon size={18} color="#009378" />
              <span className="flex-1">
                <span className="block text-sm font-bold text-ink">{copy.pathBusinessTitle}</span>
                <span className="block text-[11px] text-ink-muted mt-0.5">
                  {copy.pathBusinessSub}
                </span>
              </span>
            </button>

            {/* Path B */}
            <button
              onClick={() => {
                selectPath('job');
                handlePlayPrompt('job');
              }}
              className={`w-full text-left card-flat p-3 flex items-start space-x-3 transition-colors ${
                activePath === 'job' ? 'bg-trust/10 border-trust' : 'bg-white border-line'
              }`}
            >
              <BriefcaseIcon size={18} color="#009378" />
              <span className="flex-1">
                <span className="block text-sm font-bold text-ink">{copy.pathJobTitle}</span>
                <span className="block text-[11px] text-ink-muted mt-0.5">
                  {format(copy.pathJobSub, selectedDistrict, nsqf.qpCode)}
                </span>
              </span>
            </button>

            {/* Path C */}
            <button
              onClick={() => {
                selectPath('mudra');
                handlePlayPrompt('mudra');
              }}
              className={`w-full text-left card-flat p-3 flex items-start space-x-3 transition-colors ${
                activePath === 'mudra' ? 'bg-trust/10 border-trust' : 'bg-white border-line'
              }`}
            >
              <span className="text-trust font-bold text-lg leading-none pt-0.5">₹</span>
              <span className="flex-1">
                <span className="block text-sm font-bold text-ink">{copy.pathMudraTitle}</span>
                <span className="block text-[11px] text-ink-muted mt-0.5">
                  {copy.pathMudraSub}
                </span>
              </span>
            </button>
          </div>
        </div>

        {/* ── Path A detail ── */}
        {activePath === 'business' && (
          <div className="space-y-3">
            <div className="card-flat bg-white border-line p-4 space-y-1.5">
              <span className="font-caption text-xs text-ink-muted uppercase font-bold block">
                {copy.autoFilledLabel}
              </span>
              <div className="text-xs space-y-1 pt-1">
                <p><span className="text-ink-muted">{copy.fieldBeneficiary}:</span> <strong className="text-ink">{profile.beneficiaryName}</strong></p>
                <p><span className="text-ink-muted">{copy.fieldTrade}:</span> <strong className="text-ink">{tradeName}</strong></p>
                <p><span className="text-ink-muted">{copy.fieldQp}:</span> <strong className="text-ink font-mono">{nsqf.qpCode}</strong></p>
                <p><span className="text-ink-muted">{copy.fieldDistrict}:</span> <strong className="text-ink">{selectedDistrict}</strong></p>
                <p><span className="text-ink-muted">{copy.fieldGrant}:</span> <strong className="text-trust">₹50,000 GIA</strong></p>
              </div>
            </div>

            <span className="font-caption text-xs text-ink-muted uppercase font-semibold block">
              {copy.checklistLabel}
            </span>
            {copy.checklist.map((step) => (
              <div key={step.title} className="card-flat bg-white border-line p-3 flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-trust/10 text-trust flex items-center justify-center shrink-0 mt-0.5">
                  <CheckIcon size={14} color="#009378" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-ink block text-sm">
                    {step.title}
                  </span>
                  <p className="text-ink-muted mt-0.5">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Path B detail ── */}
        {activePath === 'job' && (
          <div className="space-y-2">
            <span className="font-caption text-xs text-ink-muted uppercase font-semibold block">
              {format(copy.jobsLabel, selectedDistrict)}
            </span>

            {isLoadingJobs && <p className="text-xs text-ink-muted">{copy.jobsLoading}</p>}
            {jobsError && <p className="text-xs text-alert">{jobsError}</p>}

            {/* Say plainly what this list is and is not. */}
            <p className="text-[11px] text-ink-muted bg-surface rounded p-2 border border-line/60">
              {copy.jobsDataNotice}
            </p>

            {openings?.map((job) => (
              <div key={job.centerId} className="card-flat bg-white border-line p-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-ink">{job.roleTitleHi}</h4>
                    <p className="text-[11px] text-ink-muted">{job.centerName}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap ${
                      job.isCertifiedMatch
                        ? 'bg-trust/10 text-trust border border-trust/30'
                        : 'bg-surface text-ink-muted border border-line'
                    }`}
                  >
                    {job.isCertifiedMatch ? copy.jobMatchCertified : copy.jobMatchRelated}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-ink-muted pt-1">
                  <span>
                    {copy.fieldVacancies}:{' '}
                    <strong className="text-ink">
                      {job.vacancies ?? copy.jobUnknownField}
                    </strong>
                  </span>
                  <span>
                    {copy.fieldWage}:{' '}
                    <strong className="text-ink">
                      {job.monthlyStipend ?? copy.jobUnknownField}
                    </strong>
                  </span>
                  <span>{copy.fieldDistance}: <strong className="text-ink">{job.distanceKm} km</strong></span>
                </div>
                <p className="text-[11px] text-ink-muted">{job.address}</p>
                <a
                  href={`tel:${job.contactPhone.replace(/\s/g, '')}`}
                  className="inline-block text-[11px] font-bold text-trust hover:underline"
                >
                  {format(copy.jobCallCoordinator, job.contactPhone)}
                </a>
              </div>
            ))}

            {openings && openings.length === 0 && !jobsError && (
              <p className="text-xs text-ink-muted">{copy.jobsEmpty}</p>
            )}

            <button onClick={loadJobs} className="btn-secondary w-full text-xs">
              {copy.reloadButton}
            </button>
          </div>
        )}

        {/* ── Path C detail ── */}
        {activePath === 'mudra' && (
          <div className="space-y-2">
            <div className="card-flat bg-trust/5 border-trust/20 p-3 text-xs text-ink leading-relaxed">
              {copy.mudraIntro}
            </div>
            {copy.mudraSteps.map((step) => (
              <div key={step.title} className="card-flat bg-white border-line p-3 flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-trust/10 text-trust flex items-center justify-center shrink-0 mt-0.5">
                  <CheckIcon size={14} color="#009378" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-ink block text-sm">{step.title}</span>
                  <p className="text-ink-muted mt-0.5">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-line space-y-3">
        {activePath === 'business' && (
          <button
            onClick={handleGeneratePDF}
            disabled={isGeneratingPDF}
            className="btn-primary w-full space-x-2"
          >
            <DocumentIcon size={18} color="#FFFFFF" />
            <span>
              {isGeneratingPDF
                ? copy.pdfGenerating
                : pdfGenerated
                ? copy.pdfRedownload
                : copy.pdfDownload}
            </span>
          </button>
        )}

        {/* Legacy fallback: the original pre-training grant flow stays reachable. */}
        <button onClick={() => setScreen('micro-finance')} className="btn-secondary w-full text-xs">
          {copy.legacyPath}
        </button>
        <button onClick={() => setScreen('beneficiary-dashboard')} className="btn-secondary w-full text-xs">
          {copy.backToDashboard}
        </button>
      </div>
    </div>
  );
};
