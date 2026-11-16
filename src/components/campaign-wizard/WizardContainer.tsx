import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Layers, 
  Users, 
  Mail, 
  Clock, 
  Rocket 
} from 'lucide-react';
import { Step1Details } from './Step1Details';
import { Step2Contacts } from './Step2Contacts';
import { Step3Compose } from './Step3Compose';
import { Step4Pacing } from './Step4Pacing';
import { Step5Review } from './Step5Review';
import { Mailbox, PacingMode, CSVParseResult } from '../../types';
import { apiClient } from '../../utils/apiClient';

interface WizardContainerProps {
  onCampaignLaunched: (campaignId: string) => void;
}

export const WizardContainer: React.FC<WizardContainerProps> = ({ onCampaignLaunched }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);

  // Wizard state
  const [name, setName] = useState('');
  const [selectedMailboxIds, setSelectedMailboxIds] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<CSVParseResult | null>(null);
  const [mapping, setMapping] = useState<{ email: string; first_name?: string; last_name?: string; company?: string }>({
    email: '',
    first_name: '',
    last_name: '',
    company: ''
  });
  const [subject, setSubject] = useState('Quick question regarding {{company | your company}}');
  const [body, setBody] = useState(
    `Hi {{first_name | there}},\n\nI noticed {{company | your team}} is scaling rapidly. We built a local desktop email automation platform that helps teams achieve 4x higher inbox deliverability with zero cloud footprints.\n\nWould you be open to a quick 5-min chat this Thursday?\n\nBest,\nAlex`
  );
  const [pacingMode, setPacingMode] = useState<PacingMode>('standard');

  useEffect(() => {
    apiClient.listMailboxes().then(boxes => {
      setMailboxes(boxes);
      // Auto-select active healthy mailboxes by default
      const activeIds = boxes.filter(b => b.status === 'active').map(b => b.id);
      setSelectedMailboxIds(activeIds);
    });
  }, []);

  const steps = [
    { num: 1, title: 'Inboxes & Pool', icon: Layers },
    { num: 2, title: 'Import Contacts', icon: Users },
    { num: 3, title: 'Compose Email', icon: Mail },
    { num: 4, title: 'Human Pacing', icon: Clock },
    { num: 5, title: 'Review & Launch', icon: Rocket }
  ];

  const handleFinalLaunch = async () => {
    if (!parsedData || !mapping.email) return;

    // 1. Filter and prepare valid contacts
    const validContacts: any[] = [];
    const seenEmails = new Set<string>();

    for (const row of parsedData.rows) {
      const email = String(row[mapping.email] || '').trim().toLowerCase();
      if (email && email.includes('@') && !seenEmails.has(email)) {
        seenEmails.add(email);
        
        // Extract custom fields (any columns other than mapped core fields)
        const custom_data: Record<string, string> = {};
        for (const [k, v] of Object.entries(row)) {
          if (![mapping.email, mapping.first_name, mapping.last_name, mapping.company].includes(k)) {
            custom_data[k] = String(v ?? '');
          }
        }

        validContacts.push({
          email,
          first_name: mapping.first_name ? row[mapping.first_name] : undefined,
          last_name: mapping.last_name ? row[mapping.last_name] : undefined,
          company: mapping.company ? row[mapping.company] : undefined,
          custom_data
        });
      }
    }

    // 2. Create Campaign in SQLite database
    const campaignId = await apiClient.createCampaign({
      name,
      template_subject: subject,
      template_body: body,
      mailbox_ids: selectedMailboxIds,
      pacing_mode: pacingMode
    });

    // 3. Batch insert contacts into SQLite
    await apiClient.importContacts({
      campaign_id: campaignId,
      contacts: validContacts
    });

    // 4. Start execution worker
    await apiClient.startCampaign(campaignId);

    // 5. Notify parent to navigate to Live Console tab
    onCampaignLaunched(campaignId);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Stepper Header Navigation */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isCompleted = currentStep > s.num;
            const isActive = currentStep === s.num;

            return (
              <React.Fragment key={s.num}>
                <div 
                  onClick={() => isCompleted && setCurrentStep(s.num)}
                  className={`flex items-center gap-2.5 ${isCompleted ? 'cursor-pointer' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted 
                      ? 'bg-emerald-500 text-slate-950 font-extrabold' 
                      : isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className={`text-[11px] font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>
                      {s.title}
                    </p>
                  </div>
                </div>

                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-[2px] mx-3 ${
                    currentStep > s.num ? 'bg-emerald-500' : 'bg-slate-800'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Wizard Step Render */}
      <div>
        {currentStep === 1 && (
          <Step1Details
            name={name}
            setName={setName}
            mailboxes={mailboxes}
            selectedMailboxIds={selectedMailboxIds}
            setSelectedMailboxIds={setSelectedMailboxIds}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && (
          <Step2Contacts
            parsedData={parsedData}
            setParsedData={setParsedData}
            mapping={mapping}
            setMapping={setMapping}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <Step3Compose
            subject={subject}
            setSubject={setSubject}
            body={body}
            setBody={setBody}
            parsedData={parsedData}
            mapping={mapping}
            onNext={() => setCurrentStep(4)}
            onBack={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 4 && (
          <Step4Pacing
            pacingMode={pacingMode}
            setPacingMode={setPacingMode}
            mailboxes={mailboxes}
            selectedMailboxIds={selectedMailboxIds}
            totalContacts={parsedData?.validRows || 0}
            onNext={() => setCurrentStep(5)}
            onBack={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 5 && (
          <Step5Review
            name={name}
            subject={subject}
            body={body}
            pacingMode={pacingMode}
            mailboxes={mailboxes}
            selectedMailboxIds={selectedMailboxIds}
            parsedData={parsedData}
            mapping={mapping}
            onLaunch={handleFinalLaunch}
            onBack={() => setCurrentStep(4)}
          />
        )}
      </div>
    </div>
  );
};
