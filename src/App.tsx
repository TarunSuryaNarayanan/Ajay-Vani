import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { MobileContainer } from './components/Layout/MobileContainer';
import { Header } from './components/Layout/Header';
import { OfflineBanner } from './components/Layout/OfflineBanner';
import { LanguageSelectionScreen } from './screens/LanguageSelectionScreen';
import { VoiceChatScreen } from './screens/VoiceChatScreen';
import { NSQFProfileScreen } from './screens/NSQFProfileScreen';
import { SkillingJobsScreen } from './screens/SkillingJobsScreen';
import { MicroFinanceScreen } from './screens/MicroFinanceScreen';
import { OfflineSyncScreen } from './screens/OfflineSyncScreen';
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
