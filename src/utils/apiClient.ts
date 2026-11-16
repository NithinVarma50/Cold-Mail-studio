import { Mailbox, Campaign, SendLog, CampaignProgress, Contact, ProviderType } from '../types';
import { interpolateTemplate } from './template';

declare global {
  interface Window {
    api?: any;
  }
}

// In-memory fallback mock store for pure browser testing
const MOCK_STORAGE_KEY_MAILBOXES = 'coldmail_mock_mailboxes';
const MOCK_STORAGE_KEY_CAMPAIGNS = 'coldmail_mock_campaigns';
const MOCK_STORAGE_KEY_LOGS = 'coldmail_mock_logs';

function getMockMailboxes(): Mailbox[] {
  const data = localStorage.getItem(MOCK_STORAGE_KEY_MAILBOXES);
  if (data) {
    try { return JSON.parse(data); } catch {}
  }
  return [
    {
      id: 'mb_1',
      email: 'founder@mycompany.com',
      host: 'smtp.mycompany.com',
      port: 465,
      provider: 'custom',
      daily_limit: 500,
      sent_today: 142,
      status: 'active',
      consecutive_burst_count: 18,
      created_at: Date.now() - 86400000 * 3
    },
    {
      id: 'mb_2',
      email: 'outreach.alex@gmail.com',
      host: 'smtp.gmail.com',
      port: 465,
      provider: 'gmail',
      daily_limit: 100,
      sent_today: 88,
      status: 'active',
      consecutive_burst_count: 24,
      created_at: Date.now() - 86400000 * 2
    },
    {
      id: 'mb_3',
      email: 'sales.lead@outlook.com',
      host: 'smtp.office365.com',
      port: 587,
      provider: 'outlook',
      daily_limit: 100,
      sent_today: 45,
      status: 'cooldown',
      cooldown_until: Date.now() + 1000 * 3600 * 3.5,
      consecutive_burst_count: 30,
      created_at: Date.now() - 86400000
    }
  ];
}

function saveMockMailboxes(mailboxes: Mailbox[]) {
  localStorage.setItem(MOCK_STORAGE_KEY_MAILBOXES, JSON.stringify(mailboxes));
}

function getMockCampaigns(): Campaign[] {
  const data = localStorage.getItem(MOCK_STORAGE_KEY_CAMPAIGNS);
  if (data) {
    try { return JSON.parse(data); } catch {}
  }
  return [
    {
      id: 'cmp_1',
      name: 'Q4 Enterprise SaaS Outreach',
      template_subject: 'Quick question regarding {{company | your company}}',
      template_body: 'Hi {{first_name | there}},\n\nI noticed {{company | your team}} is scaling your engineering operations. We built a local desktop email automation platform that helps teams achieve 4x higher inbox deliverability with zero cloud footprints.\n\nWould you be open to a quick 5-min chat this Thursday?\n\nBest,\nAlex',
      status: 'running',
      mailbox_ids: ['mb_1', 'mb_2'],
      pacing_mode: 'standard',
      created_at: Date.now() - 86400000,
      total_contacts: 450,
      sent_contacts: 230,
      failed_contacts: 4
    }
  ];
}

export const apiClient = {
  isElectron: (): boolean => {
    return typeof window !== 'undefined' && Boolean(window.api);
  },

  // Mailboxes
  async listMailboxes(): Promise<Mailbox[]> {
    if (window.api) return window.api.listMailboxes();
    return getMockMailboxes();
  },

  async detectProvider(email: string): Promise<{ provider: ProviderType; host: string; port: number; secure: boolean }> {
    if (window.api) return window.api.detectProvider(email);
    const domain = email.split('@')[1]?.toLowerCase() || '';
    if (domain === 'gmail.com') return { provider: 'gmail', host: 'smtp.gmail.com', port: 465, secure: true };
    if (['outlook.com', 'hotmail.com', 'office365.com'].includes(domain)) return { provider: 'outlook', host: 'smtp.office365.com', port: 587, secure: false };
    if (domain === 'zoho.com') return { provider: 'zoho', host: 'smtp.zoho.com', port: 465, secure: true };
    return { provider: 'custom', host: `smtp.${domain}`, port: 465, secure: true };
  },

  async createMailbox(data: any): Promise<Mailbox> {
    if (window.api) return window.api.createMailbox(data);
    const mailboxes = getMockMailboxes();
    const newBox: Mailbox = {
      id: `mb_${Date.now()}`,
      email: data.email,
      host: data.host,
      port: data.port,
      provider: data.provider || 'custom',
      daily_limit: data.daily_limit || 100,
      sent_today: 0,
      status: 'active',
      created_at: Date.now()
    };
    mailboxes.unshift(newBox);
    saveMockMailboxes(mailboxes);
    return newBox;
  },

  async updateMailbox(data: Partial<Mailbox> & { id: string; password?: string }): Promise<boolean> {
    if (window.api) return window.api.updateMailbox(data);
    const mailboxes = getMockMailboxes();
    const idx = mailboxes.findIndex(m => m.id === data.id);
    if (idx !== -1) {
      mailboxes[idx] = { ...mailboxes[idx], ...data };
      saveMockMailboxes(mailboxes);
    }
    return true;
  },

  async deleteMailbox(id: string): Promise<boolean> {
    if (window.api) return window.api.deleteMailbox(id);
    const mailboxes = getMockMailboxes().filter(m => m.id !== id);
    saveMockMailboxes(mailboxes);
    return true;
  },

  async testMailboxConnection(data: any): Promise<{ success: boolean; message: string }> {
    if (window.api) return window.api.testMailboxConnection(data);
    await new Promise(r => setTimeout(r, 1200));
    return { success: true, message: 'SMTP Handshake and TLS Authentication passed successfully!' };
  },

  // Campaigns
  async listCampaigns(): Promise<Campaign[]> {
    if (window.api) return window.api.listCampaigns();
    return getMockCampaigns();
  },

  async getCampaign(id: string): Promise<Campaign | undefined> {
    if (window.api) return window.api.getCampaign(id);
    return getMockCampaigns().find(c => c.id === id);
  },

  async createCampaign(data: any): Promise<string> {
    if (window.api) return window.api.createCampaign(data);
    const campaigns = getMockCampaigns();
    const newId = `cmp_${Date.now()}`;
    const newCmp: Campaign = {
      id: newId,
      name: data.name,
      template_subject: data.template_subject,
      template_body: data.template_body,
      status: 'draft',
      mailbox_ids: data.mailbox_ids || [],
      pacing_mode: data.pacing_mode || 'standard',
      created_at: Date.now(),
      total_contacts: 0,
      sent_contacts: 0,
      failed_contacts: 0
    };
    campaigns.unshift(newCmp);
    localStorage.setItem(MOCK_STORAGE_KEY_CAMPAIGNS, JSON.stringify(campaigns));
    return newId;
  },

  async deleteCampaign(id: string): Promise<boolean> {
    if (window.api) return window.api.deleteCampaign(id);
    const campaigns = getMockCampaigns().filter(c => c.id !== id);
    localStorage.setItem(MOCK_STORAGE_KEY_CAMPAIGNS, JSON.stringify(campaigns));
    return true;
  },

  // Contacts
  async importContacts(data: { campaign_id: string; contacts: any[] }): Promise<{ count: number }> {
    if (window.api) return window.api.importContacts(data);
    return { count: data.contacts.length };
  },

  async listContacts(data: { campaign_id: string; limit?: number; offset?: number }): Promise<Contact[]> {
    if (window.api) return window.api.listContacts(data);
    return [];
  },

  async getContactStats(campaignId: string) {
    if (window.api) return window.api.getContactStats(campaignId);
    return { total: 450, sent: 230, failed: 4, pending: 216 };
  },

  // Execution
  async startCampaign(campaignId: string): Promise<{ success: boolean; message: string }> {
    if (window.api) return window.api.startCampaign(campaignId);
    return { success: true, message: 'Mock campaign execution started' };
  },

  async pauseCampaign(): Promise<{ success: boolean; message: string }> {
    if (window.api) return window.api.pauseCampaign();
    return { success: true, message: 'Campaign paused' };
  },

  async resumeCampaign(): Promise<{ success: boolean; message: string }> {
    if (window.api) return window.api.resumeCampaign();
    return { success: true, message: 'Campaign resumed' };
  },

  async stopCampaign(): Promise<{ success: boolean; message: string }> {
    if (window.api) return window.api.stopCampaign();
    return { success: true, message: 'Campaign stopped' };
  },

  async getExecutionStatus(): Promise<CampaignProgress> {
    if (window.api) return window.api.getExecutionStatus();
    return {
      campaign_id: 'cmp_1',
      campaign_name: 'Q4 Enterprise SaaS Outreach',
      total: 450,
      sent: 230,
      failed: 4,
      pending: 216,
      active_mailbox_email: 'founder@mycompany.com',
      current_recipient: 'jane.doe@targetenterprise.com',
      status: 'running',
      current_burst: 18,
      burst_ceiling: 60,
      pacing_status: 'Pacing jitter delay (1.2s)...'
    };
  },

  // Logs
  async listLogs(data?: { campaignId?: string; limit?: number }): Promise<SendLog[]> {
    if (window.api) return window.api.listLogs(data);
    return [];
  },

  async clearLogs(campaignId?: string): Promise<boolean> {
    if (window.api) return window.api.clearLogs(campaignId);
    return true;
  },

  // Template preview
  previewTemplate(template: string, recipient: any): string {
    return interpolateTemplate(template, recipient);
  },

  // Event Listeners
  onCampaignProgress(callback: (data: any) => void): () => void {
    if (window.api?.onCampaignProgress) return window.api.onCampaignProgress(callback);
    return () => {};
  },

  onCampaignLog(callback: (data: any) => void): () => void {
    if (window.api?.onCampaignLog) return window.api.onCampaignLog(callback);
    return () => {};
  },

  onCampaignStatusChanged(callback: (data: any) => void): () => void {
    if (window.api?.onCampaignStatusChanged) return window.api.onCampaignStatusChanged(callback);
    return () => {};
  },

  onNavigateDashboard(callback: () => void): () => void {
    if (window.api?.onNavigateDashboard) return window.api.onNavigateDashboard(callback);
    return () => {};
  }
};
