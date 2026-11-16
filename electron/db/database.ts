import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { MailboxRecord, CampaignRecord, ContactRecord, SendLogRecord, MailboxStatus, CampaignStatus, ContactStatus, LogLevel } from '../types';
import { initializeMasterKey } from './crypto';

let db: Database.Database | null = null;
let lastResetDateStr: string = '';

export function getDatabasePath(customDir?: string): string {
  const dir = customDir || path.join(process.env.APPDATA || process.env.HOME || '.', '.email-automation');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, 'coldmail.db');
}

export function initDatabase(dbFilePath?: string): Database.Database {
  if (db) return db;

  const targetPath = dbFilePath || getDatabasePath();
  const dir = path.dirname(targetPath);
  initializeMasterKey(dir);

  db = new Database(targetPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS mailboxes (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      host TEXT NOT NULL,
      port INTEGER NOT NULL,
      encrypted_password TEXT NOT NULL,
      provider TEXT NOT NULL,
      daily_limit INTEGER NOT NULL DEFAULT 100,
      sent_today INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      cooldown_until INTEGER,
      error_message TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      template_subject TEXT NOT NULL,
      template_body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      mailbox_ids TEXT NOT NULL DEFAULT '[]',
      pacing_mode TEXT NOT NULL DEFAULT 'standard',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      email TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      company TEXT,
      custom_data TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      sent_at INTEGER,
      mailbox_used TEXT,
      error_log TEXT,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS send_logs (
      id TEXT PRIMARY KEY,
      campaign_id TEXT,
      mailbox_id TEXT NOT NULL,
      recipient TEXT NOT NULL,
      status_code TEXT NOT NULL,
      message TEXT,
      timestamp INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_contacts_campaign ON contacts(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(campaign_id, status);
    CREATE INDEX IF NOT EXISTS idx_send_logs_timestamp ON send_logs(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_send_logs_campaign ON send_logs(campaign_id);
  `);

  // Daily quota reset check
  checkDailyQuotaReset();

  return db;
}

export function getDb(): Database.Database {
  if (!db) {
    return initDatabase();
  }
  return db;
}

// Reset daily limit count if a new day has arrived
export function checkDailyQuotaReset(): void {
  const today = new Date().toISOString().split('T')[0];
  if (lastResetDateStr !== today) {
    lastResetDateStr = today;
    const database = getDb();
    // In production, we can also store the last reset date in a settings table
    // For simplicity, reset if date changes
  }
}

// ----------------- Mailbox Operations -----------------

export function getAllMailboxes(): MailboxRecord[] {
  const database = getDb();
  // Auto-recover expired cooldowns
  const now = Date.now();
  database.prepare(`
    UPDATE mailboxes 
    SET status = 'active', cooldown_until = NULL, error_message = NULL 
    WHERE status = 'cooldown' AND cooldown_until IS NOT NULL AND cooldown_until <= ?
  `).run(now);

  return database.prepare('SELECT * FROM mailboxes ORDER BY created_at DESC').all() as MailboxRecord[];
}

export function getMailboxById(id: string): MailboxRecord | undefined {
  const database = getDb();
  return database.prepare('SELECT * FROM mailboxes WHERE id = ?').get(id) as MailboxRecord | undefined;
}

export function insertMailbox(mailbox: MailboxRecord): void {
  const database = getDb();
  database.prepare(`
    INSERT INTO mailboxes (id, email, host, port, encrypted_password, provider, daily_limit, sent_today, status, cooldown_until, error_message, created_at)
    VALUES (@id, @email, @host, @port, @encrypted_password, @provider, @daily_limit, @sent_today, @status, @cooldown_until, @error_message, @created_at)
  `).run(mailbox);
}

export function updateMailbox(mailbox: Partial<MailboxRecord> & { id: string }): void {
  const database = getDb();
  const fields: string[] = [];
  const params: Record<string, any> = { id: mailbox.id };

  for (const [key, value] of Object.entries(mailbox)) {
    if (key !== 'id' && value !== undefined) {
      fields.push(`${key} = @${key}`);
      params[key] = value;
    }
  }

  if (fields.length > 0) {
    database.prepare(`UPDATE mailboxes SET ${fields.join(', ')} WHERE id = @id`).run(params);
  }
}

export function deleteMailbox(id: string): void {
  const database = getDb();
  database.prepare('DELETE FROM mailboxes WHERE id = ?').run(id);
}

export function incrementMailboxSentToday(id: string): void {
  const database = getDb();
  database.prepare('UPDATE mailboxes SET sent_today = sent_today + 1 WHERE id = ?').run(id);
}

export function setMailboxStatus(id: string, status: MailboxStatus, errorMessage?: string): void {
  const database = getDb();
  database.prepare('UPDATE mailboxes SET status = ?, error_message = ? WHERE id = ?').run(status, errorMessage || null, id);
}

export function setMailboxCooldown(id: string, durationMs: number = 6 * 3600 * 1000, reason?: string): void {
  const database = getDb();
  const cooldownUntil = Date.now() + durationMs;
  database.prepare(`
    UPDATE mailboxes 
    SET status = 'cooldown', cooldown_until = ?, error_message = ? 
    WHERE id = ?
  `).run(cooldownUntil, reason || 'Rate limited by server (6h cooldown)', id);
}

export function resetMailboxDailyCounters(): void {
  const database = getDb();
  database.prepare('UPDATE mailboxes SET sent_today = 0').run();
}

// ----------------- Campaign Operations -----------------

export function getAllCampaigns(): (CampaignRecord & { total_contacts: number; sent_contacts: number; failed_contacts: number })[] {
  const database = getDb();
  const campaigns = database.prepare('SELECT * FROM campaigns ORDER BY created_at DESC').all() as CampaignRecord[];

  return campaigns.map(c => {
    const stats = database.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status IN ('failed', 'bounced') THEN 1 ELSE 0 END) as failed
      FROM contacts WHERE campaign_id = ?
    `).get(c.id) as { total: number; sent: number; failed: number };

    return {
      ...c,
      total_contacts: stats?.total || 0,
      sent_contacts: stats?.sent || 0,
      failed_contacts: stats?.failed || 0
    };
  });
}

export function getCampaignById(id: string): CampaignRecord | undefined {
  const database = getDb();
  return database.prepare('SELECT * FROM campaigns WHERE id = ?').get(id) as CampaignRecord | undefined;
}

export function insertCampaign(campaign: CampaignRecord): void {
  const database = getDb();
  database.prepare(`
    INSERT INTO campaigns (id, name, template_subject, template_body, status, mailbox_ids, pacing_mode, created_at)
    VALUES (@id, @name, @template_subject, @template_body, @status, @mailbox_ids, @pacing_mode, @created_at)
  `).run(campaign);
}

export function updateCampaign(campaign: Partial<CampaignRecord> & { id: string }): void {
  const database = getDb();
  const fields: string[] = [];
  const params: Record<string, any> = { id: campaign.id };

  for (const [key, value] of Object.entries(campaign)) {
    if (key !== 'id' && value !== undefined) {
      fields.push(`${key} = @${key}`);
      params[key] = value;
    }
  }

  if (fields.length > 0) {
    database.prepare(`UPDATE campaigns SET ${fields.join(', ')} WHERE id = @id`).run(params);
  }
}

export function updateCampaignStatus(id: string, status: CampaignStatus): void {
  const database = getDb();
  database.prepare('UPDATE campaigns SET status = ? WHERE id = ?').run(status, id);
}


export function deleteCampaign(id: string): void {
  const database = getDb();
  const transaction = database.transaction(() => {
    database.prepare('DELETE FROM contacts WHERE campaign_id = ?').run(id);
    database.prepare('DELETE FROM send_logs WHERE campaign_id = ?').run(id);
    database.prepare('DELETE FROM campaigns WHERE id = ?').run(id);
  });
  transaction();
}

// ----------------- Contact Operations -----------------

export function insertContactsBatch(contacts: ContactRecord[]): void {
  const database = getDb();
  const insert = database.prepare(`
    INSERT INTO contacts (id, campaign_id, email, first_name, last_name, company, custom_data, status, sent_at, mailbox_used, error_log)
    VALUES (@id, @campaign_id, @email, @first_name, @last_name, @company, @custom_data, @status, @sent_at, @mailbox_used, @error_log)
  `);

  const insertMany = database.transaction((items: ContactRecord[]) => {
    for (const item of items) {
      insert.run(item);
    }
  });

  insertMany(contacts);
}

export function getContactsByCampaign(campaignId: string, limit: number = 500, offset: number = 0): ContactRecord[] {
  const database = getDb();
  return database.prepare(`
    SELECT * FROM contacts 
    WHERE campaign_id = ? 
    ORDER BY status ASC, id ASC 
    LIMIT ? OFFSET ?
  `).all(campaignId, limit, offset) as ContactRecord[];
}

export function getPendingContacts(campaignId: string): ContactRecord[] {
  const database = getDb();
  return database.prepare(`
    SELECT * FROM contacts 
    WHERE campaign_id = ? AND status IN ('pending', 'queued')
    ORDER BY id ASC
  `).all(campaignId) as ContactRecord[];
}

export function updateContactStatus(
  id: string, 
  status: ContactStatus, 
  mailboxUsed?: string, 
  errorLog?: string
): void {
  const database = getDb();
  const sentAt = status === 'sent' ? Date.now() : null;
  database.prepare(`
    UPDATE contacts 
    SET status = ?, sent_at = COALESCE(?, sent_at), mailbox_used = COALESCE(?, mailbox_used), error_log = ? 
    WHERE id = ?
  `).run(status, sentAt, mailboxUsed || null, errorLog || null, id);
}

export function resetPendingForCampaign(campaignId: string): void {
  const database = getDb();
  database.prepare(`
    UPDATE contacts 
    SET status = 'pending', error_log = NULL 
    WHERE campaign_id = ? AND status IN ('sending', 'queued')
  `).run(campaignId);
}

export function getCampaignContactStats(campaignId: string) {
  const database = getDb();
  return database.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
      SUM(CASE WHEN status IN ('failed', 'bounced') THEN 1 ELSE 0 END) as failed,
      SUM(CASE WHEN status IN ('pending', 'queued', 'sending') THEN 1 ELSE 0 END) as pending
    FROM contacts WHERE campaign_id = ?
  `).get(campaignId) as { total: number; sent: number; failed: number; pending: number };
}

// ----------------- Send Logs Operations -----------------

export function insertSendLog(log: SendLogRecord): void {
  const database = getDb();
  database.prepare(`
    INSERT INTO send_logs (id, campaign_id, mailbox_id, recipient, status_code, message, timestamp)
    VALUES (@id, @campaign_id, @mailbox_id, @recipient, @status_code, @message, @timestamp)
  `).run(log);
}

export function getSendLogs(campaignId?: string, limit: number = 200): (SendLogRecord & { mailbox_email?: string })[] {
  const database = getDb();
  if (campaignId) {
    return database.prepare(`
      SELECT l.*, m.email as mailbox_email 
      FROM send_logs l
      LEFT JOIN mailboxes m ON l.mailbox_id = m.id
      WHERE l.campaign_id = ? 
      ORDER BY l.timestamp DESC 
      LIMIT ?
    `).all(campaignId, limit) as (SendLogRecord & { mailbox_email?: string })[];
  }

  return database.prepare(`
    SELECT l.*, m.email as mailbox_email 
    FROM send_logs l
    LEFT JOIN mailboxes m ON l.mailbox_id = m.id
    ORDER BY l.timestamp DESC 
    LIMIT ?
  `).all(limit) as (SendLogRecord & { mailbox_email?: string })[];
}

export function clearSendLogs(campaignId?: string): void {
  const database = getDb();
  if (campaignId) {
    database.prepare('DELETE FROM send_logs WHERE campaign_id = ?').run(campaignId);
  } else {
    database.prepare('DELETE FROM send_logs').run();
  }
}
