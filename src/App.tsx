import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { MobileContainer } from './components/Layout/MobileContainer';
import { Header } from './components/Layout/Header';
import { OfflineBanner } from './components/Layout/OfflineBanner';
import { TtsUnavailableToast } from './components/Layout/TtsUnavailableToast';
import { LanguageSelectionScreen } from './screens/LanguageSelectionScreen';
import { VoiceChatScreen } from './screens/VoiceChatScreen';
import { NSQFProfileScreen } from './screens/NSQFProfileScreen';
import { SkillingJobsScreen } from './screens/SkillingJobsScreen';
import { MicroFinanceScreen } from './screens/MicroFinanceScreen';
import { OfflineSyncScreen } from './screens/OfflineSyncScreen';
import { AadhaarLoginScreen } from './screens/AadhaarLoginScreen';
import { AadhaarOtpScreen } from './screens/AadhaarOtpScreen';
import { BeneficiaryDashboardScreen } from './screens/BeneficiaryDashboardScreen';
import { ServicesPanelHost } from './components/Dashboard/DashboardSidePanel';
import { PostTrainingGuidanceScreen } from './screens/PostTrainingGuidanceScreen';
import { MinistryDashboardScreen } from './screens/MinistryDashboardScreen';
import { PrivacyPolicyModal } from './components/Modals/PrivacyPolicyModal';
import { TermsModal } from './components/Modals/TermsModal';

const AppContent: React.FC = () => {
  const { currentScreen, privacyOpen, setPrivacyOpen, termsOpen, setTermsOpen } = useApp();

  const renderScreen = () => {
    switch (currentScreen) {
      case 'language-select':
        return <LanguageSelectionScreen />;
      case 'voice-chat':
        return <VoiceChatScreen />;
      case 'nsqf-profile':
        return <NSQFProfileScreen />;
      case 'skilling-jobs':
        return <SkillingJobsScreen />;
      case 'micro-finance':
        return <MicroFinanceScreen />;
      case 'offline-sync':
        return <OfflineSyncScreen />;
      case 'aadhaar-login':
        return <AadhaarLoginScreen />;
      case 'aadhaar-otp':
        return <AadhaarOtpScreen />;
      case 'beneficiary-dashboard':
        return <BeneficiaryDashboardScreen />;
      case 'post-training-guidance':
        return <PostTrainingGuidanceScreen />;
      case 'ministry-dashboard':
        return <MinistryDashboardScreen />;
      default:
        return <LanguageSelectionScreen />;
    }
  };

  return (
    <MobileContainer>
      <Header />
      <OfflineBanner />
      <main className="flex-1 flex flex-col overflow-y-auto">
        {renderScreen()}
      </main>

      {/* Every speaker button reports itself here when no voice backend exists */}
      <TtsUnavailableToast />

      {/* Complaints · training lifecycle · QR token, opened from the header */}
      <ServicesPanelHost />

      {/* Mandatory Pre-Launch Legal Modals per design.md §10 */}
      <PrivacyPolicyModal
        isOpen={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
      />
      <TermsModal
        isOpen={termsOpen}
        onClose={() => setTermsOpen(false)}
      />
    </MobileContainer>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
