import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ServicesPanelTab } from '../components/Dashboard/DashboardSidePanel';
import {
  LanguageCode,
  VoiceProcessResult,
  ScreenType,
  OfflineInterview,
  AadhaarSession,
  QRToken,
  GrievanceIssueType,
  GrievanceTicket,
  LifecycleEnrollment,
  GrievanceStatus,
} from '../types';
import { offlineStorage } from '../services/offlineStorage';
import {
  syncOfflineInterviews,
  submitGrievance,
  enrollForLifecycleNudges,
  fetchLifecycleEnrollment,
  triggerLifecycleSweep,
  markCourseComplete,
  fetchGrievances,
  updateGrievanceStatus,
} from '../services/api';
import { buildGrievanceMetadata, isPostTrainingEligible, landingScreenFor, simulateDay90Window } from '../services/governance';

const PENDING_GRIEVANCES_KEY = 'pending_grievances';

interface AppContextType {
  currentScreen: ScreenType;
  selectedLanguage: LanguageCode;
  selectedDialectName: string;
  selectedDistrict: string;
  isOnline: boolean;
  unsyncedCount: number;
  currentResult: VoiceProcessResult | null;
  rawTranscript: string;
  justSynced: boolean;
  syncError: string | null;
  isSyncing: boolean;
  privacyOpen: boolean;
  termsOpen: boolean;
  aadhaarNumber: string;
  isAadhaarLoggedIn: boolean;
  aadhaarSession: AadhaarSession | null;
  qrToken: QRToken | null;
  grievanceTickets: GrievanceTicket[];
  pendingGrievanceCount: number;
  lifecycleEnrollment: LifecycleEnrollment | null;
  whatsappConfigured: boolean;
  setScreen: (screen: ScreenType) => void;
  setLanguage: (lang: LanguageCode, name: string) => void;
  setDistrict: (district: string) => void;
  saveInterviewResult: (result: VoiceProcessResult, transcript: string) => Promise<void>;
  triggerSync: () => Promise<void>;
  generateQRToken: () => Promise<QRToken | undefined>;
  admitToCourse: (tokenId: string) => Promise<{ success: boolean; message: string }>;
  setPrivacyOpen: (open: boolean) => void;
  setTermsOpen: (open: boolean) => void;
  resetToHome: () => void;
  submitAadhaarNumber: (aadhaar: string) => void;
  verifyAadhaarOtp: (otp: string) => boolean;
  loginDemoBeneficiary: () => void;
  logoutAadhaar: () => void;
  // ─── Advanced Governance (F1 / F2 / F3) ───────────────────────────────────
  reportGrievance: (input: {
    issueType: GrievanceIssueType;
    description: string;
    captureMode: 'form' | 'voice';
  }) => Promise<{ success: boolean; message: string; queuedOffline?: boolean }>;
  refreshGrievances: () => Promise<void>;
  setGrievanceStatus: (ticketId: string, status: GrievanceStatus, note?: string) => Promise<boolean>;
  enrollForNudges: (whatsappNumber: string) => Promise<{ success: boolean; message: string }>;
  refreshLifecycleInbox: () => Promise<void>;
  runLifecycleSweepNow: () => Promise<number>;
  completeCourse: () => Promise<{ success: boolean; message: string }>;
  simulatePostTrainingWindow: () => Promise<void>;
  resetGovernanceState: () => void;
  isPostTrainingUnlocked: boolean;
  // ─── Services side panel (complaints · training lifecycle · QR) ─────────────
  servicesPanelOpen: boolean;
  servicesPanelTab: ServicesPanelTab;
  openServicesPanel: (tab?: ServicesPanelTab) => void;
  closeServicesPanel: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Entry flow per aadhaar_login_architecture.md: language → Aadhaar login → OTP → voice chat
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('language-select');
  const [servicesPanelOpen, setServicesPanelOpen] = useState(false);
  const [servicesPanelTab, setServicesPanelTab] = useState<ServicesPanelTab>('complaints');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('hi-IN');
  const [selectedDialectName, setSelectedDialectName] = useState<string>('हिंदी');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Varanasi');
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [unsyncedCount, setUnsyncedCount] = useState<number>(0);
  const [currentResult, setCurrentResult] = useState<VoiceProcessResult | null>(null);
  const [rawTranscript, setRawTranscript] = useState<string>('');
  const [justSynced, setJustSynced] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [privacyOpen, setPrivacyOpen] = useState<boolean>(false);
  const [termsOpen, setTermsOpen] = useState<boolean>(false);

  // Aadhaar Login State per aadhaar_login_architecture.md
  const [aadhaarNumber, setAadhaarNumber] = useState<string>('');
  const [isAadhaarLoggedIn, setIsAadhaarLoggedIn] = useState<boolean>(false);
  const [aadhaarSession, setAadhaarSession] = useState<AadhaarSession | null>(null);

  // QR Token for paperless offline enrollment (Fix #8)
  const [qrToken, setQrToken] = useState<QRToken | null>(null);

  // ─── Advanced Governance state (F1 grievances, F2 lifecycle, F3 completion) ──
  const [grievanceTickets, setGrievanceTickets] = useState<GrievanceTicket[]>([]);
  const [pendingGrievanceCount, setPendingGrievanceCount] = useState<number>(0);
  const [lifecycleEnrollment, setLifecycleEnrollment] = useState<LifecycleEnrollment | null>(null);
  const [whatsappConfigured, setWhatsappConfigured] = useState<boolean>(false);

  const isPostTrainingUnlocked = isPostTrainingEligible(aadhaarSession);

  // QR Token Functions (Fix #8)
  const generateQRToken = async () => {
    if (!currentResult || !aadhaarSession) return;

    const { generateQRToken: genQR } = await import('../services/api');
    const apiToken = await genQR(
      aadhaarSession.beneficiaryName || currentResult.profile.beneficiaryName,
      aadhaarSession.maskedAadhaar || 'XXXX XXXX 7777',
      currentResult.recommendedNSQF.qpCode,
      currentResult.recommendedNSQF.roleNameHi,
      aadhaarSession.district || selectedDistrict
    );

    const token: QRToken = {
      tokenId: apiToken.tokenId,
      beneficiaryName: apiToken.beneficiaryName,
      aadhaarMasked: apiToken.aadhaarMasked,
      nsqfQpCode: apiToken.nsqfQpCode,
      nsqfRoleNameHi: apiToken.nsqfRoleNameHi,
      district: apiToken.district,
      generatedAt: apiToken.generatedAt,
      isUsed: false,
      qrDataUrl: apiToken.qrDataUrl,
    };

    setQrToken(token);

    return token;
  };

  const admitToCourse = async (tokenId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { admitToCourse: admit } = await import('../services/api');
      const result = await admit(tokenId);
      if (result.success && qrToken && qrToken.tokenId === tokenId) {
        setQrToken({ ...qrToken, isUsed: true });
      }
      return result;
    } catch (e: any) {
      return { success: false, message: e.message || 'Admission failed' };
    }
  };

  // ─── F1 · Grievance Redressal ──────────────────────────────────────────────

  const readPendingGrievances = (): Array<Parameters<typeof submitGrievance>[0]> => {
    try {
      const raw = localStorage.getItem(PENDING_GRIEVANCES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const writePendingGrievances = (items: Array<Parameters<typeof submitGrievance>[0]>) => {
    try {
      localStorage.setItem(PENDING_GRIEVANCES_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('[Grievance] Could not persist offline queue:', e);
    }
    setPendingGrievanceCount(items.length);
  };

  const refreshGrievances = async () => {
    if (!isOnline) return;
    try {
      const tickets = await fetchGrievances();
      setGrievanceTickets(tickets);
    } catch (e) {
      console.warn('[Grievance] Could not load tickets:', e);
    }
  };

  // Offline grievances are queued locally and flushed as soon as connectivity returns.
  const flushPendingGrievances = async () => {
    const queued = readPendingGrievances();
    if (queued.length === 0) return;
    const remaining: typeof queued = [];
    for (const item of queued) {
      const result = await submitGrievance(item);
      if (!result.success) remaining.push(item);
    }
    writePendingGrievances(remaining);
    if (remaining.length < queued.length) {
      await refreshGrievances();
    }
  };

  const reportGrievance = async (input: {
    issueType: GrievanceIssueType;
    description: string;
    captureMode: 'form' | 'voice';
  }): Promise<{ success: boolean; message: string; queuedOffline?: boolean }> => {
    const metadata = buildGrievanceMetadata({ session: aadhaarSession, result: currentResult, selectedDistrict });
    const payload = {
      issueType: input.issueType,
      description: input.description,
      captureMode: input.captureMode,
      language: selectedLanguage,
      metadata,
    };

    if (!isOnline) {
      writePendingGrievances([...readPendingGrievances(), payload]);
      return {
        success: true,
        queuedOffline: true,
        message: 'ऑफलाइन सहेजा गया। कनेक्शन मिलते ही मंत्रालय डैशबोर्ड पर भेजा जाएगा।',
      };
    }

    const result = await submitGrievance(payload);
    if (result.success) {
      setGrievanceTickets((prev) => (result.ticket ? [result.ticket as GrievanceTicket, ...prev] : prev));
      return { success: true, message: result.message };
    }

    // Network hiccup mid-request: keep it queued rather than losing the complaint.
    writePendingGrievances([...readPendingGrievances(), payload]);
    return {
      success: true,
      queuedOffline: true,
      message: 'सर्वर से संपर्क नहीं हो सका। शिकायत सुरक्षित रख ली गई है और बाद में भेज दी जाएगी।',
    };
  };

  const setGrievanceStatus = async (ticketId: string, status: GrievanceStatus, note?: string) => {
    const result = await updateGrievanceStatus(ticketId, status, note);
    if (result.success && result.ticket) {
      setGrievanceTickets((prev) => prev.map((t) => (t.ticketId === ticketId ? result.ticket as GrievanceTicket : t)));
    }
    return result.success;
  };

  // ─── F2 · Lifecycle Nudges ─────────────────────────────────────────────────

  const refreshLifecycleInbox = async () => {
    if (!aadhaarSession) return;
    const { enrollment, whatsappConfigured: configured } = await fetchLifecycleEnrollment(aadhaarSession.aadhaarNumber);
    setLifecycleEnrollment(enrollment);
    setWhatsappConfigured(configured);
  };

  const enrollForNudges = async (whatsappNumber: string) => {
    if (!aadhaarSession) {
      return { success: false, message: 'पहले लॉगिन करें।' };
    }
    const result = await enrollForLifecycleNudges({
      beneficiaryId: aadhaarSession.aadhaarNumber,
      beneficiaryName: aadhaarSession.beneficiaryName,
      district: aadhaarSession.district || selectedDistrict,
      whatsappNumber,
    });
    if (result.success) {
      const enrolledAt = result.enrollment?.enrolledAt ?? Date.now();
      setAadhaarSession((prev) => (prev ? { ...prev, lifecycleEnrolledAt: enrolledAt, whatsappNumber } : prev));
      setLifecycleEnrollment(result.enrollment ?? null);
      setWhatsappConfigured(!!result.whatsappConfigured);
      return { success: true, message: result.message };
    }
    return result;
  };

  const runLifecycleSweepNow = async () => {
    const { dispatchedCount, whatsappConfigured: configured } = await triggerLifecycleSweep();
    setWhatsappConfigured(configured);
    await refreshLifecycleInbox();
    return dispatchedCount;
  };

  // ─── F3 · Post-Course AI Guidance ──────────────────────────────────────────

  const completeCourse = async () => {
    if (!aadhaarSession) {
      return { success: false, message: 'पहले लॉगिन करें।' };
    }
    const completedAt = Date.now();
    setAadhaarSession((prev) => (prev ? { ...prev, courseCompleted: true, completedAt } : prev));
    persistCourseCompletion(aadhaarSession.aadhaarNumber, completedAt);
    if (isOnline) {
      await markCourseComplete({
        beneficiaryId: aadhaarSession.aadhaarNumber,
        nsqfQpCode: currentResult?.recommendedNSQF.qpCode || '',
        district: aadhaarSession.district || selectedDistrict,
        completedAt,
      });
    }
    return { success: true, message: 'प्रशिक्षण पूर्ण दर्ज हो गया।' };
  };

  const simulatePostTrainingWindow = async () => {
    if (!aadhaarSession) return;
    const completedAt = simulateDay90Window(aadhaarSession.completedAt);
    setAadhaarSession((prev) => (prev ? { ...prev, courseCompleted: true, completedAt } : prev));
    persistCourseCompletion(aadhaarSession.aadhaarNumber, completedAt);
    if (isOnline) {
      await markCourseComplete({
        beneficiaryId: aadhaarSession.aadhaarNumber,
        nsqfQpCode: currentResult?.recommendedNSQF.qpCode || '',
        district: aadhaarSession.district || selectedDistrict,
        completedAt,
      });
    }
  };

  // Monitor network connectivity per Developer Guide §3 Screen 6
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
      flushPendingGrievances();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check of unsynced items
    refreshUnsyncedCount();
    setPendingGrievanceCount(readPendingGrievances().length);
    // Complaints queued during a previous offline session still go out on launch.
    if (isOnline) {
      flushPendingGrievances();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshUnsyncedCount = async () => {
    try {
      const pending = await offlineStorage.getUnsyncedInterviews();
      setUnsyncedCount(pending.length);
    } catch (e) {
      console.warn("Could not check unsynced count:", e);
    }
  };

  const setLanguage = (lang: LanguageCode, name: string) => {
    setSelectedLanguage(lang);
    setSelectedDialectName(name);
    // Keep the document language in sync so :lang() script rules (line-height,
    // shaping hints) apply to the whole tree, not just React state.
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang.split('-')[0];
    }
  };

  const setDistrict = (district: string) => {
    setSelectedDistrict(district);
  };

  const saveInterviewResult = async (result: VoiceProcessResult, transcript: string) => {
    setCurrentResult(result);
    setRawTranscript(transcript);

    const record: OfflineInterview = {
      id: `interview_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      transcript,
      district: selectedDistrict,
      language: selectedLanguage,
      profile: result.profile,
      recommendedNSQF: result.recommendedNSQF,
      isSynced: isOnline
    };

    await offlineStorage.saveInterview(record);

    if (isOnline) {
      try {
        await syncOfflineInterviews([record]);
        await offlineStorage.markAsSynced([record.id]);
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 3000);
      } catch (err) {
        console.warn("Auto-sync immediately failed, remains in offline queue.");
      }
    }

    await refreshUnsyncedCount();
  };

  const triggerSync = async () => {
    if (!isOnline) {
      setSyncError("इंटरनेट उपलब्ध नहीं है। कृपया कनेक्टिविटी की प्रतीक्षा करें।");
      return;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      const pending = await offlineStorage.getUnsyncedInterviews();
      if (pending.length === 0) {
        setIsSyncing(false);
        return;
      }

      await syncOfflineInterviews(pending);
      await offlineStorage.markAsSynced(pending.map(p => p.id));
      setUnsyncedCount(0);
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 3500);
    } catch (err: any) {
      setSyncError("सिंक में विफलता आई। पुनः प्रयास करें।");
    } finally {
      setIsSyncing(false);
      await refreshUnsyncedCount();
    }
  };

  const resetToHome = () => {
    setCurrentResult(null);
    setRawTranscript('');
    setQrToken(null);
    setCurrentScreen('language-select');
  };

  // Course completion survives logout/login so the Day-90 loop can be re-entered
  // exactly the way a post-training beneficiary experiences it.
  const COURSE_COMPLETION_KEY = 'course_completion';

  const readCourseCompletion = (aadhaar: string): { courseCompleted: boolean; completedAt: number | null } => {
    try {
      const raw = localStorage.getItem(`${COURSE_COMPLETION_KEY}_${aadhaar}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.completedAt === 'number') {
          return { courseCompleted: true, completedAt: parsed.completedAt };
        }
      }
    } catch (e) {
      console.warn('[Post-Training] Could not read stored completion:', e);
    }
    return { courseCompleted: false, completedAt: null };
  };

  const persistCourseCompletion = (aadhaar: string, completedAt: number) => {
    try {
      localStorage.setItem(`${COURSE_COMPLETION_KEY}_${aadhaar}`, JSON.stringify({ completedAt }));
    } catch (e) {
      console.warn('[Post-Training] Could not persist completion:', e);
    }
  };

  /**
   * Clears locally-held governance state so a demo run can start from the
   * pre-training state again. Server-side ledgers are untouched — the grievance
   * and nudge history stay visible on the Ministry dashboard.
   */
  const resetGovernanceState = () => {
    if (aadhaarSession) {
      try {
        localStorage.removeItem(`${COURSE_COMPLETION_KEY}_${aadhaarSession.aadhaarNumber}`);
      } catch (e) {
        console.warn('[Post-Training] Could not clear stored completion:', e);
      }
      setAadhaarSession((prev) =>
        prev
          ? { ...prev, courseCompleted: false, completedAt: null, lifecycleEnrolledAt: null, whatsappNumber: null }
          : prev
      );
    }
    setLifecycleEnrollment(null);
    writePendingGrievances([]);
  };

  const establishSession = (session: AadhaarSession, landing: ScreenType) => {
    setAadhaarSession(session);
    setIsAadhaarLoggedIn(true);
    setCurrentScreen(landing);
  };

  // Aadhaar Login Handlers
  const submitAadhaarNumber = (num: string) => {
    const cleanNum = num.replace(/\D/g, '');
    setAadhaarNumber(cleanNum);
    setCurrentScreen('aadhaar-otp');
  };

  const verifyAadhaarOtp = (otp: string): boolean => {
    // Standard validation: Demo OTP '1234' or any 4 digit code
    if (otp === '1234' || otp.length === 4) {
      const cleanAadhaar = aadhaarNumber || '999988887777';
      const last4 = cleanAadhaar.slice(-4) || '7777';
      const completion = readCourseCompletion(cleanAadhaar);

      const session: AadhaarSession = {
        aadhaarNumber: cleanAadhaar,
        maskedAadhaar: `XXXX XXXX ${last4}`,
        isVerified: true,
        beneficiaryName: currentResult?.profile.beneficiaryName || "रमेश कुमार (Ramesh Kumar)",
        scCategoryVerified: true,
        district: selectedDistrict || "Varanasi",
        grantStep: 3, // BDO Approval Pending
        stipendDaysAttended: 30,
        stipendTotalEarned: 4500,
        courseCompleted: completion.courseCompleted,
        completedAt: completion.completedAt,
        lifecycleEnrolledAt: null,
        whatsappNumber: null
      };

      // Verified Aadhaar holders continue straight into the voice assistant.
      establishSession(session, 'voice-chat');
      return true;
    }
    return false;
  };

  const loginDemoBeneficiary = () => {
    setAadhaarNumber('999988887777');
    const completion = readCourseCompletion('999988887777');
    const session: AadhaarSession = {
      aadhaarNumber: '999988887777',
      maskedAadhaar: 'XXXX XXXX 7777',
      isVerified: true,
      beneficiaryName: "रमेश कुमार (SIH Demo Beneficiary)",
      scCategoryVerified: true,
      district: selectedDistrict || "Varanasi",
      grantStep: 3, // BDO Clearance Pending
      stipendDaysAttended: 30,
      stipendTotalEarned: 4500,
      courseCompleted: completion.courseCompleted,
      completedAt: completion.completedAt,
      lifecycleEnrolledAt: null,
      whatsappNumber: null
    };

    // Judge shortcut keeps the dashboard landing so application status is inspectable.
    establishSession(session, landingScreenFor(session));
  };

  const logoutAadhaar = () => {
    setIsAadhaarLoggedIn(false);
    setAadhaarSession(null);
    setAadhaarNumber('');
    setLifecycleEnrollment(null);
    setServicesPanelOpen(false);
    setCurrentScreen('aadhaar-login');
  };

  const openServicesPanel = (tab: ServicesPanelTab = servicesPanelTab) => {
    setServicesPanelTab(tab);
    setServicesPanelOpen(true);
  };

  const closeServicesPanel = () => setServicesPanelOpen(false);

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        selectedLanguage,
        selectedDialectName,
        selectedDistrict,
        isOnline,
        unsyncedCount,
        currentResult,
        rawTranscript,
        justSynced,
        syncError,
        isSyncing,
        privacyOpen,
        termsOpen,
        aadhaarNumber,
        isAadhaarLoggedIn,
        aadhaarSession,
        setScreen: setCurrentScreen,
        setLanguage,
        setDistrict,
        servicesPanelOpen,
        servicesPanelTab,
        openServicesPanel,
        closeServicesPanel,
        saveInterviewResult,
        triggerSync,
        qrToken,
        generateQRToken,
        admitToCourse,
        setPrivacyOpen,
        setTermsOpen,
        resetToHome,
        submitAadhaarNumber,
        verifyAadhaarOtp,
        loginDemoBeneficiary,
        logoutAadhaar,
        grievanceTickets,
        pendingGrievanceCount,
        lifecycleEnrollment,
        whatsappConfigured,
        reportGrievance,
        refreshGrievances,
        setGrievanceStatus,
        enrollForNudges,
        refreshLifecycleInbox,
        runLifecycleSweepNow,
        completeCourse,
        simulatePostTrainingWindow,
        resetGovernanceState,
        isPostTrainingUnlocked
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
