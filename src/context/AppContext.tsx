import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LanguageCode, VoiceProcessResult, ScreenType, OfflineInterview, AadhaarSession } from '../types';
import { offlineStorage } from '../services/offlineStorage';
import { syncOfflineInterviews } from '../services/api';

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
  setScreen: (screen: ScreenType) => void;
  setLanguage: (lang: LanguageCode, name: string) => void;
  setDistrict: (district: string) => void;
  saveInterviewResult: (result: VoiceProcessResult, transcript: string) => Promise<void>;
  triggerSync: () => Promise<void>;
  setPrivacyOpen: (open: boolean) => void;
  setTermsOpen: (open: boolean) => void;
  resetToHome: () => void;
  submitAadhaarNumber: (aadhaar: string) => void;
  verifyAadhaarOtp: (otp: string) => boolean;
  loginDemoBeneficiary: () => void;
  logoutAadhaar: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('language-select');
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

  // Monitor network connectivity per Developer Guide §3 Screen 6
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check of unsynced items
    refreshUnsyncedCount();

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
    setCurrentScreen('language-select');
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
      
      const session: AadhaarSession = {
        aadhaarNumber: cleanAadhaar,
        maskedAadhaar: `XXXX XXXX ${last4}`,
        isVerified: true,
        beneficiaryName: currentResult?.profile.beneficiaryName || "रमेश कुमार (Ramesh Kumar)",
        scCategoryVerified: true,
        district: selectedDistrict || "Varanasi",
        grantStep: 3, // BDO Approval Pending
        stipendDaysAttended: 30,
        stipendTotalEarned: 4500
      };

      setAadhaarSession(session);
      setIsAadhaarLoggedIn(true);
      setCurrentScreen('beneficiary-dashboard');
      return true;
    }
    return false;
  };

  const loginDemoBeneficiary = () => {
    setAadhaarNumber('999988887777');
    const session: AadhaarSession = {
      aadhaarNumber: '999988887777',
      maskedAadhaar: 'XXXX XXXX 7777',
      isVerified: true,
      beneficiaryName: "रमेश कुमार (SIH Demo Beneficiary)",
      scCategoryVerified: true,
      district: selectedDistrict || "Varanasi",
      grantStep: 3, // BDO Clearance Pending
      stipendDaysAttended: 30,
      stipendTotalEarned: 4500
    };

    setAadhaarSession(session);
    setIsAadhaarLoggedIn(true);
    setCurrentScreen('beneficiary-dashboard');
  };

  const logoutAadhaar = () => {
    setIsAadhaarLoggedIn(false);
    setAadhaarSession(null);
    setAadhaarNumber('');
    setCurrentScreen('aadhaar-login');
  };

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
        saveInterviewResult,
        triggerSync,
        setPrivacyOpen,
        setTermsOpen,
        resetToHome,
        submitAadhaarNumber,
        verifyAadhaarOtp,
        loginDemoBeneficiary,
        logoutAadhaar
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
