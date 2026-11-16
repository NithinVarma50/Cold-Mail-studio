import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MailboxList } from './components/mailboxes/MailboxList';
import { WizardContainer } from './components/campaign-wizard/WizardContainer';
import { LiveConsole } from './components/execution/LiveConsole';
import { LogsView } from './components/logs/LogsView';
import { CampaignProgress } from './types';
import { apiClient } from './utils/apiClient';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'mailboxes' | 'wizard' | 'console' | 'logs'>('mailboxes');
  const [activeProgress, setActiveProgress] = useState<CampaignProgress | null>(null);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);

  // Subscribe to live execution status
  useEffect(() => {
    apiClient.getExecutionStatus().then(status => {
      if (status && status.campaign_id) {
        setActiveProgress(status);
        setActiveCampaignId(status.campaign_id);
      }
    });

    const unsubProgress = apiClient.onCampaignProgress((data: CampaignProgress) => {
      setActiveProgress(data);
    });

    const unsubStatus = apiClient.onCampaignStatusChanged((data: { campaign_id: string; status: any }) => {
      setActiveProgress(prev => prev ? { ...prev, status: data.status } : null);
    });

    // Listen for Ctrl+M desktop global shortcut
    const unsubDashboard = apiClient.onNavigateDashboard(() => {
      console.log('Switched to Dashboard view via Ctrl+M global shortcut');
      setCurrentTab('mailboxes');
    });

    return () => {
      unsubProgress();
      unsubStatus();
      unsubDashboard();
    };
  }, []);

  const handleCampaignLaunched = (campaignId: string) => {
    setActiveCampaignId(campaignId);
    setCurrentTab('console');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Application Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeProgress={activeProgress}
      />

      {/* Main View Area */}
      <main className="flex-1 overflow-y-auto">
        {currentTab === 'mailboxes' && (
          <MailboxList
            onStartCampaignClick={() => setCurrentTab('wizard')}
          />
        )}

        {currentTab === 'wizard' && (
          <WizardContainer
            onCampaignLaunched={handleCampaignLaunched}
          />
        )}

        {currentTab === 'console' && (
          <LiveConsole
            initialCampaignId={activeCampaignId}
            onNavigateWizard={() => setCurrentTab('wizard')}
          />
        )}

        {currentTab === 'logs' && (
          <LogsView />
        )}
      </main>
    </div>
  );
};

export default App;
