import React from 'react';
import { useApp } from '../../context/AppContext';
import { SidePanel, TabBar } from '../Layout/SidePanel';
import { GrievanceReporter } from '../Governance/GrievanceReporter';
import { TrainingLifecyclePanel } from '../Governance/TrainingLifecyclePanel';
import { QrTokenCard } from '../Governance/QrTokenCard';
import { AlertIcon, GraduationCapIcon, QRCodeIcon } from '../Icons';
import { getDashboardText } from '../../services/translations';

export type ServicesPanelTab = 'complaints' | 'lifecycle' | 'qr';

/**
 * Side panel holding the beneficiary's secondary tools so the dashboard itself
 * stays a single-glance status view. Mounted once at the app shell level and
 * opened from the persistent header control, so it is reachable from any screen.
 */
export const ServicesPanelHost: React.FC = () => {
  const { servicesPanelOpen, servicesPanelTab, openServicesPanel, closeServicesPanel, selectedLanguage } =
    useApp();

  const t = (key: string) => getDashboardText(selectedLanguage || 'hi-IN', key);

  const tabs = [
    { id: 'complaints' as const, label: t('panelTabComplaints'), icon: <AlertIcon size={18} color="currentColor" /> },
    { id: 'lifecycle' as const, label: t('panelTabLifecycle'), icon: <GraduationCapIcon size={18} color="currentColor" /> },
    { id: 'qr' as const, label: t('panelTabQr'), icon: <QRCodeIcon size={18} color="currentColor" /> },
  ];

  return (
    <SidePanel isOpen={servicesPanelOpen} title={t('panelTitle')} closeLabel={t('panelClose')} onClose={closeServicesPanel}>
      <TabBar tabs={tabs} activeTab={servicesPanelTab} onSelect={openServicesPanel}>
        {servicesPanelTab === 'complaints' && <GrievanceReporter />}
        {servicesPanelTab === 'lifecycle' && <TrainingLifecyclePanel />}
        {servicesPanelTab === 'qr' && <QrTokenCard />}
      </TabBar>
    </SidePanel>
  );
};
