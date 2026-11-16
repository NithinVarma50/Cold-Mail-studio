export type ProviderType = 'gmail' | 'outlook' | 'zoho' | 'custom';

export type MailboxStatus = 'active' | 'cooldown' | 'error' | 'verifying';

export interface Mailbox {
  id: string;
  email: string;
  host: string;
  port: number;
  provider: ProviderType;
  daily_limit: number;
  sent_today: number;
  status: MailboxStatus;
  cooldown_until?: number | null;
  consecutive_burst_count?: number;
  created_at: number;
  error_message?: string;
}

export interface MailboxInput {
  email: string;
  host?: string;
  port?: number;
  password?: string;
  provider?: ProviderType;
  daily_limit?: number;
}

export type CampaignStatus = 'draft' | 'running' | 'paused' | 'completed' | 'stopped';
export type PacingMode = 'standard' | 'stealth';

export interface Campaign {
  id: string;
  name: string;
  template_subject: string;
  template_body: string;
  status: CampaignStatus;
  mailbox_ids: string[];
  pacing_mode: PacingMode;
  created_at: number;
  total_contacts?: number;
  sent_contacts?: number;
  failed_contacts?: number;
}

export type ContactStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'bounced' | 'queued';

export interface Contact {
  id: string;
  campaign_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  custom_data?: Record<string, string>;
  status: ContactStatus;
  sent_at?: number | null;
  mailbox_used?: string | null;
  error_log?: string | null;
}

export type LogLevel = 'INFO' | 'SENT' | 'FAILED' | 'COOLDOWN' | 'BURST' | 'PACING' | 'WARN';

export interface SendLog {
  id: string;
  campaign_id?: string;
  mailbox_id: string;
  mailbox_email?: string;
  recipient: string;
  status_code: LogLevel;
  message?: string;
  timestamp: number;
}

export interface CampaignProgress {
  campaign_id: string;
  campaign_name: string;
  total: number;
  sent: number;
  failed: number;
  pending: number;
  active_mailbox_email: string | null;
  current_recipient: string | null;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'stopped' | 'exhausted';
  current_burst: number;
  burst_ceiling: number;
  pacing_status: string;
  estimated_seconds_remaining?: number;
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

export interface CSVParseResult {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  previewData: Record<string, string>[];
  detectedMapping: {
    email: string;
    first_name?: string;
    last_name?: string;
    company?: string;
  };
}
