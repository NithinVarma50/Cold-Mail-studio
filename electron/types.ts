export type ProviderType = 'gmail' | 'outlook' | 'zoho' | 'custom';
export type MailboxStatus = 'active' | 'cooldown' | 'error' | 'verifying';
export type CampaignStatus = 'draft' | 'running' | 'paused' | 'completed' | 'stopped';
export type PacingMode = 'standard' | 'stealth';
export type ContactStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'bounced' | 'queued';
export type LogLevel = 'INFO' | 'SENT' | 'FAILED' | 'COOLDOWN' | 'BURST' | 'PACING' | 'WARN';

export interface MailboxRecord {
  id: string;
  email: string;
  host: string;
  port: number;
  encrypted_password: string;
  provider: ProviderType;
  daily_limit: number;
  sent_today: number;
  status: MailboxStatus;
  cooldown_until?: number | null;
  created_at: number;
  error_message?: string;
}

export interface CampaignRecord {
  id: string;
  name: string;
  template_subject: string;
  template_body: string;
  status: CampaignStatus;
  mailbox_ids: string; // JSON array string
  pacing_mode: PacingMode;
  created_at: number;
}

export interface ContactRecord {
  id: string;
  campaign_id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  company?: string | null;
  custom_data?: string | null; // JSON string
  status: ContactStatus;
  sent_at?: number | null;
  mailbox_used?: string | null;
  error_log?: string | null;
}

export interface SendLogRecord {
  id: string;
  campaign_id?: string | null;
  mailbox_id: string;
  recipient: string;
  status_code: LogLevel;
  message?: string | null;
  timestamp: number;
}

export interface PacingProfileConfig {
  name: string;
  type: 'consumer' | 'business' | 'stealth';
  batch_size: number;
  min_delay_ms: number;
  max_delay_ms: number;
  batch_cooldown_min_ms: number;
  batch_cooldown_max_ms: number;
  description: string;
}

