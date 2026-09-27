import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  SpeakerIcon,
  DocumentIcon,
  CheckIcon,
  BriefcaseIcon,
  AlertIcon,
} from '../components/Icons';
import { speechService } from '../services/speech';
import { generateBusinessProposalPDF } from '../services/pdfGenerator';
import { fetchLocalEmployers } from '../services/api';
import {
  BDO_SUBMISSION_CHECKLIST,
  MUDRA_LOAN_STEPS,
  POST_TRAINING_VOICE_PROMPTS,
  daysSinceCompletion,
  formatPostTrainingElapsed,
  isPostTrainingEligible,
  jobMatchLabel,
} from '../services/governance';
import { BeneficiaryProfile, PostTrainingJobOpening, PostTrainingPath, RecommendedNSQF } from '../types';

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

  const profile = currentResult?.profile || FALLBACK_PROFILE;
  const nsqf = currentResult?.recommendedNSQF || FALLBACK_NSQF;
  const completedAt = aadhaarSession?.completedAt ?? null;
  const eligible = isPostTrainingEligible(aadhaarSession);
  const elapsedDays = daysSinceCompletion(completedAt);
  const unlocked = !!aadhaarSession && !!aadhaarSession.courseCompleted && !!completedAt;
  const openerText = `${POST_TRAINING_VOICE_PROMPTS.business} ${POST_TRAINING_VOICE_PROMPTS.job}`;

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
    speechService.speak(POST_TRAINING_VOICE_PROMPTS[path], selectedLanguage, () => setIsPlayingAudio(true), () =>
      setIsPlayingAudio(false)
    );
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
      setJobsError('नौकरी सूची लोड नहीं हो सकी। इंटरनेट कनेक्शन जाँचें।');
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
              यह मार्गदर्शन केवल प्रमाणित एवं पूर्ण प्रशिक्षण (दिन 90+) वाले लाभार्थियों के लिए खुलता है।
              आपका प्रशिक्षण अभी जारी है — नीचे दिए पुराने अनुदान पथ का उपयोग करें।
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <button onClick={() => setScreen('micro-finance')} className="btn-primary w-full">
            ₹50,000 अनुदान पथ खोलें (पुराना पथ)
          </button>
          <button onClick={() => setScreen('beneficiary-dashboard')} className="btn-secondary w-full">
            डैशबोर्ड पर लौटें
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
            <h1 className="font-display text-2xl text-ink">प्रशिक्षणोत्तर मार्गदर्शन</h1>
            <p className="font-caption text-sm text-ink-muted mt-1">
              प्रमाणित ट्रेड: {nsqf.roleNameHi} ({nsqf.qpCode})
            </p>
            {elapsedDays !== null && (
              <p className="text-[11px] text-trust font-semibold mt-1">
                प्रशिक्षण पूर्ण: {formatPostTrainingElapsed(elapsedDays)}
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
            aria-label="मार्गदर्शन सुनें"
          >
            <SpeakerIcon size={20} color={isPlayingAudio ? '#FFFFFF' : '#009378'} />
          </button>
        </div>

        {!eligible && (
          <div className="card-flat bg-amber-50 border-amber-200 p-3 text-xs text-amber-900">
            दिन 90 की अवधि पूरी नहीं हुई है — यह पूर्वावलोकन (preview) है। पूर्ण दिन 90 के बाद यह मार्गदर्शन
            स्वतः खुलेगा।
          </div>
        )}

        {/* AI voice prompt + the three guided paths */}
        <div className="card-flat bg-trust/5 border-trust/20 p-4 space-y-3">
          <span className="font-caption text-xs text-trust uppercase font-semibold block">
            एआई वॉइस प्रॉम्प्ट (Second Conversation Loop)
          </span>
          <p className="text-sm font-medium text-ink leading-relaxed">
            “{POST_TRAINING_VOICE_PROMPTS.business} — या — {POST_TRAINING_VOICE_PROMPTS.job}”
          </p>

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
                <span className="block text-sm font-bold text-ink">पथ A: अपना व्यापार शुरू करें</span>
                <span className="block text-[11px] text-ink-muted mt-0.5">
                  ₹50,000 पीएम-अजय व्यापार प्रस्ताव + बीडीओ जमा चेकलिस्ट
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
                <span className="block text-sm font-bold text-ink">पथ B: नौकरी खोजें</span>
                <span className="block text-[11px] text-ink-muted mt-0.5">
                  {selectedDistrict} ज़िले में आपके NSQF कोड ({nsqf.qpCode}) के लिए सत्यापित नियोक्ता
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
                <span className="block text-sm font-bold text-ink">पथ C: पीएम मुद्रा ऋण</span>
                <span className="block text-[11px] text-ink-muted mt-0.5">
                  ₹10 लाख तक — अनुदान से परे की पूंजी हेतु निकटतम बैंक शाखा में आवेदन
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
                स्वतः भरे गए विवरण (Auto-Populated from Certification)
              </span>
              <div className="text-xs space-y-1 pt-1">
                <p><span className="text-ink-muted">लाभार्थी:</span> <strong className="text-ink">{profile.beneficiaryName}</strong></p>
                <p><span className="text-ink-muted">प्रमाणित ट्रेड:</span> <strong className="text-ink">{nsqf.roleNameHi}</strong></p>
                <p><span className="text-ink-muted">QP कोड:</span> <strong className="text-ink font-mono">{nsqf.qpCode}</strong></p>
                <p><span className="text-ink-muted">ज़िला:</span> <strong className="text-ink">{selectedDistrict}</strong></p>
                <p><span className="text-ink-muted">अनुदान:</span> <strong className="text-trust">₹50,000 GIA</strong></p>
              </div>
            </div>

            <span className="font-caption text-xs text-ink-muted uppercase font-semibold block">
              बीडीओ को भौतिक जमा हेतु चरण (Submission Checklist)
            </span>
            {BDO_SUBMISSION_CHECKLIST.map((step, idx) => (
              <div key={step.title} className="card-flat bg-white border-line p-3 flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-trust/10 text-trust flex items-center justify-center shrink-0 mt-0.5">
                  <CheckIcon size={14} color="#009378" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-ink block text-sm">
                    {idx + 1}. {step.title}
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
              सत्यापित स्थानीय नियोक्ता ({selectedDistrict})
            </span>

            {isLoadingJobs && <p className="text-xs text-ink-muted">नौकरी सूची खोजी जा रही है...</p>}
            {jobsError && <p className="text-xs text-alert">{jobsError}</p>}

            {openings?.map((job) => (
              <div key={job.centerId} className="card-flat bg-white border-line p-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-ink">{job.roleTitleHi}</h4>
                    <p className="text-[11px] text-ink-muted">{job.centerNameHi}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap ${
                      job.isCertifiedMatch
                        ? 'bg-trust/10 text-trust border border-trust/30'
                        : 'bg-surface text-ink-muted border border-line'
                    }`}
                  >
                    {jobMatchLabel(job)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-ink-muted pt-1">
                  <span>रिक्त पद: <strong className="text-ink">{job.vacancies}</strong></span>
                  <span>वेतन: <strong className="text-ink">{job.monthlyStipend}</strong></span>
                  <span>दूरी: <strong className="text-ink">{job.distanceKm} किमी</strong></span>
                </div>
                <p className="text-[11px] text-ink-muted">{job.address}</p>
                <a
                  href={`tel:${job.contactPhone.replace(/\s/g, '')}`}
                  className="inline-block text-[11px] font-bold text-trust hover:underline"
                >
                  समन्वयक को कॉल करें: {job.contactPhone}
                </a>
              </div>
            ))}

            {openings && openings.length === 0 && !jobsError && (
              <p className="text-xs text-ink-muted">इस ज़िले में आपके ट्रेड के लिए अभी सत्यापित रिक्त पद नहीं हैं।</p>
            )}

            <button onClick={loadJobs} className="btn-secondary w-full text-xs">
              सूची पुनः लोड करें
            </button>
          </div>
        )}

        {/* ── Path C detail ── */}
        {activePath === 'mudra' && (
          <div className="space-y-2">
            <div className="card-flat bg-trust/5 border-trust/20 p-3 text-xs text-ink leading-relaxed">
              पीएम-अजय ₹50,000 अनुदान के बाद भी यदि व्यापार के लिए अधिक पूंजी चाहिए, तो
              <strong> प्रधानमंत्री मुद्रा योजना </strong> के तहत ₹10 लाख तक का ऋण बिना कॉलेटरल लिया जा
              सकता है। निकटतम बैंक शाखा या BRC केंद्र में आवेदन करें।
            </div>
            {MUDRA_LOAN_STEPS.map((step) => (
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
                ? 'दस्तावेज़ तैयार हो रहा है...'
                : pdfGenerated
                ? 'प्रस्ताव पुनः डाउनलोड करें'
                : '₹50,000 व्यापार प्रस्ताव डाउनलोड करें'}
            </span>
          </button>
        )}

        {/* Legacy fallback: the original pre-training grant flow stays reachable. */}
        <button onClick={() => setScreen('micro-finance')} className="btn-secondary w-full text-xs">
          पुराना अनुदान पथ (Micro-Finance) खोलें
        </button>
        <button onClick={() => setScreen('beneficiary-dashboard')} className="btn-secondary w-full text-xs">
          डैशबोर्ड पर लौटें
        </button>
      </div>
    </div>
  );
};
