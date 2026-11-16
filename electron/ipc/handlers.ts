import { ipcMain, dialog, BrowserWindow } from 'electron';
import { 
  getAllMailboxes, 
  insertMailbox, 
  updateMailbox, 
  deleteMailbox, 
  getAllCampaigns, 
  getCampaignById, 
  insertCampaign, 
  updateCampaign, 
  deleteCampaign, 
  insertContactsBatch, 
  getContactsByCampaign, 
  getCampaignContactStats, 
  getSendLogs, 
  clearSendLogs 
} from '../db/database';
import { encryptPassword } from '../db/crypto';
import { detectProvider, verifySmtpConnection } from '../engine/smtpPool';
import { campaignWorker } from '../engine/campaignWorker';
import { interpolateTemplate } from '../engine/template';
import { ContactRecord, MailboxRecord } from '../types';
import crypto from 'crypto';

export function registerIpcHandlers(mainWindow: BrowserWindow) {
  campaignWorker.setWindow(mainWindow);

  // ---------- MAILBOX HANDLERS ----------
  ipcMain.handle('mailboxes:list', async () => {
    return getAllMailboxes();
  });

  ipcMain.handle('mailboxes:detect', async (_event, email: string) => {
    return detectProvider(email);
  });

  ipcMain.handle('mailboxes:create', async (_event, data: {
    email: string;
    host?: string;
    port?: number;
    password: string;
    provider?: string;
    daily_limit?: number;
  }) => {
    const detected = detectProvider(data.email);
    const provider = (data.provider || detected.provider) as any;
    const host = data.host || detected.host;
    const port = data.port || detected.port;
    const encrypted_password = encryptPassword(data.password);
    const daily_limit = Number(data.daily_limit) || (provider === 'custom' ? 500 : 100);

    const mailbox: MailboxRecord = {
      id: crypto.randomUUID(),
      email: data.email.toLowerCase().trim(),
      host,
      port,
      encrypted_password,
      provider,
      daily_limit,
      sent_today: 0,
      status: 'active',
      cooldown_until: null,
      created_at: Date.now()
    };

    insertMailbox(mailbox);
    return mailbox;
  });

  ipcMain.handle('mailboxes:update', async (_event, data: Partial<MailboxRecord> & { id: string; password?: string }) => {
    const updateData: any = { ...data };
    if (data.password) {
      updateData.encrypted_password = encryptPassword(data.password);
      delete updateData.password;
    }
    updateMailbox(updateData);
    return true;
  });

  ipcMain.handle('mailboxes:delete', async (_event, id: string) => {
    deleteMailbox(id);
    return true;
  });

  ipcMain.handle('mailboxes:test', async (_event, data: {
    host: string;
    port: number;
    email: string;
    password?: string;
    encrypted_password?: string;
  }) => {
    return await verifySmtpConnection(data);
  });

  // ---------- CAMPAIGN HANDLERS ----------
  ipcMain.handle('campaigns:list', async () => {
    return getAllCampaigns();
  });

  ipcMain.handle('campaigns:get', async (_event, id: string) => {
    return getCampaignById(id);
  });

  ipcMain.handle('campaigns:create', async (_event, data: {
    name: string;
    template_subject: string;
    template_body: string;
    mailbox_ids: string[];
    pacing_mode: 'standard' | 'stealth';
  }) => {
    const campaignId = crypto.randomUUID();
    insertCampaign({
      id: campaignId,
      name: data.name,
      template_subject: data.template_subject,
      template_body: data.template_body,
      status: 'draft',
      mailbox_ids: JSON.stringify(data.mailbox_ids || []),
      pacing_mode: data.pacing_mode || 'standard',
      created_at: Date.now()
    });
    return campaignId;
  });

  ipcMain.handle('campaigns:update', async (_event, data: {
    id: string;
    name?: string;
    template_subject?: string;
    template_body?: string;
    mailbox_ids?: string[];
    pacing_mode?: 'standard' | 'stealth';
  }) => {
    const updateData: any = { id: data.id };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.template_subject !== undefined) updateData.template_subject = data.template_subject;
    if (data.template_body !== undefined) updateData.template_body = data.template_body;
    if (data.mailbox_ids !== undefined) updateData.mailbox_ids = JSON.stringify(data.mailbox_ids);
    if (data.pacing_mode !== undefined) updateData.pacing_mode = data.pacing_mode;

    updateCampaign(updateData);
    return true;
  });

  ipcMain.handle('campaigns:delete', async (_event, id: string) => {
    deleteCampaign(id);
    return true;
  });

  // ---------- CONTACTS HANDLERS ----------
  ipcMain.handle('contacts:import', async (_event, data: {
    campaign_id: string;
    contacts: Array<{
      email: string;
      first_name?: string;
      last_name?: string;
      company?: string;
      custom_data?: Record<string, string>;
    }>;
  }) => {
    const records: ContactRecord[] = data.contacts.map(c => ({
      id: crypto.randomUUID(),
      campaign_id: data.campaign_id,
      email: c.email.toLowerCase().trim(),
      first_name: c.first_name || null,
      last_name: c.last_name || null,
      company: c.company || null,
      custom_data: c.custom_data ? JSON.stringify(c.custom_data) : null,
      status: 'pending',
      sent_at: null,
      mailbox_used: null,
      error_log: null
    }));

    insertContactsBatch(records);
    return { count: records.length };
  });

  ipcMain.handle('contacts:list', async (_event, data: { campaign_id: string; limit?: number; offset?: number }) => {
    return getContactsByCampaign(data.campaign_id, data.limit || 200, data.offset || 0);
  });

  ipcMain.handle('contacts:stats', async (_event, campaignId: string) => {
    return getCampaignContactStats(campaignId);
  });

  // ---------- EXECUTION & CONSOLE HANDLERS ----------
  ipcMain.handle('execution:start', async (_event, campaignId: string) => {
    return await campaignWorker.start(campaignId);
  });

  ipcMain.handle('execution:pause', async () => {
    return campaignWorker.pause();
  });

  ipcMain.handle('execution:resume', async () => {
    return campaignWorker.resume();
  });

  ipcMain.handle('execution:stop', async () => {
    return campaignWorker.stop();
  });

  ipcMain.handle('execution:status', async () => {
    return campaignWorker.getStatus();
  });

  // ---------- LOGS HANDLERS ----------
  ipcMain.handle('logs:list', async (_event, data?: { campaignId?: string; limit?: number }) => {
    return getSendLogs(data?.campaignId, data?.limit || 150);
  });

  ipcMain.handle('logs:clear', async (_event, campaignId?: string) => {
    clearSendLogs(campaignId);
    return true;
  });

  // ---------- UTILITY HANDLERS ----------
  ipcMain.handle('template:preview', async (_event, data: { template: string; recipient: any }) => {
    return interpolateTemplate(data.template, data.recipient);
  });
}
