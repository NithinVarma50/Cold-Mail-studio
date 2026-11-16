import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { MailboxRecord, CampaignRecord, ContactRecord, SendLogRecord, MailboxStatus, CampaignStatus, ContactStatus, LogLevel } from '../types';
import { initializeMasterKey } from './crypto';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;
let currentDbPath: string = '';

export function getDatabasePath(customDir?: string): string {
  const dir = customDir || path.join(process.env.APPDATA || process.env.HOME || '.', '.email-automation');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, 'coldmail.db');
}

export async function initDatabase(dbFilePath?: string): Promise<Database> {
  if (db) return db;

  if (!SQL) {
    SQL = await initSqlJs();
  }

  currentDbPath = dbFilePath || getDatabasePath();
  const dir = path.dirname(currentDbPath);
  initializeMasterKey(dir);

  if (fs.existsSync(currentDbPath)) {
    try {
      const fileBuffer = fs.readFileSync(currentDbPath);
      db = new SQL.Database(fileBuffer);
    } catch {
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
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
      error_log TEXT
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
  `);

  persistDatabase();
  return db;
}

export function persistDatabase(): void {
  if (db && currentDbPath) {
    try {
      const data = db.export();
      fs.writeFileSync(currentDbPath, Buffer.from(data));
    } catch (err) {
      console.error('[DB] Failed to persist database to disk:', err);
    }
  }
}

function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

function queryAll<T>(sql: string, params: any[] = []): T[] {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

function queryOne<T>(sql: string, params: any[] = []): T | undefined {
  const list = queryAll<T>(sql, params);
  return list[0];
}

function execute(sql: string, params: any[] = []): void {
  const database = getDatabase();
  database.run(sql, params);
  persistDatabase();
}

// ----------------- Mailbox Operations -----------------

export function getAllMailboxes(): MailboxRecord[] {
  const now = Date.now();
  execute(
    `UPDATE mailboxes SET status = 'active', cooldown_until = NULL, error_message = NULL 
     WHERE status = 'cooldown' AND cooldown_until IS NOT NULL AND cooldown_until <= ?`,
    [now]
  );

  return queryAll<MailboxRecord>('SELECT * FROM mailboxes ORDER BY created_at DESC');
}

export function getMailboxById(id: string): MailboxRecord | undefined {
  return queryOne<MailboxRecord>('SELECT * FROM mailboxes WHERE id = ?', [id]);
}

export function insertMailbox(mailbox: MailboxRecord): void {
  execute(
    `INSERT INTO mailboxes (id, email, host, port, encrypted_password, provider, daily_limit, sent_today, status, cooldown_until, error_message, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      mailbox.id,
      mailbox.email,
      mailbox.host,
      mailbox.port,
      mailbox.encrypted_password,
      mailbox.provider,
      mailbox.daily_limit,
      mailbox.sent_today,
      mailbox.status,
      mailbox.cooldown_until || null,
      mailbox.error_message || null,
      mailbox.created_at
    ]
  );
}

export function updateMailbox(mailbox: Partial<MailboxRecord> & { id: string }): void {
  const fields: string[] = [];
  const params: any[] = [];

  for (const [key, value] of Object.entries(mailbox)) {
    if (key !== 'id' && value !== undefined) {
      fields.push(`${key} = ?`);
      params.push(value);
    }
  }

  if (fields.length > 0) {
    params.push(mailbox.id);
    execute(`UPDATE mailboxes SET ${fields.join(', ')} WHERE id = ?`, params);
  }
}

export function deleteMailbox(id: string): void {
  execute('DELETE FROM mailboxes WHERE id = ?', [id]);
}

export function incrementMailboxSentToday(id: string): void {
  execute('UPDATE mailboxes SET sent_today = sent_today + 1 WHERE id = ?', [id]);
}

export function setMailboxStatus(id: string, status: MailboxStatus, errorMessage?: string): void {
  execute('UPDATE mailboxes SET status = ?, error_message = ? WHERE id = ?', [status, errorMessage || null, id]);
}

export function setMailboxCooldown(id: string, durationMs: number = 6 * 3600 * 1000, reason?: string): void {
  const cooldownUntil = Date.now() + durationMs;
  execute(
    `UPDATE mailboxes SET status = 'cooldown', cooldown_until = ?, error_message = ? WHERE id = ?`,
    [cooldownUntil, reason || 'Rate limited by server (6h cooldown)', id]
  );
}

// ----------------- Campaign Operations -----------------

export function getAllCampaigns(): (CampaignRecord & { total_contacts: number; sent_contacts: number; failed_contacts: number })[] {
  const campaigns = queryAll<CampaignRecord>('SELECT * FROM campaigns ORDER BY created_at DESC');

  return campaigns.map(c => {
    const stats = queryOne<{ total: number; sent: number; failed: number }>(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status IN ('failed', 'bounced') THEN 1 ELSE 0 END) as failed
      FROM contacts WHERE campaign_id = ?`,
      [c.id]
    );

    return {
      ...c,
      total_contacts: stats?.total || 0,
      sent_contacts: stats?.sent || 0,
      failed_contacts: stats?.failed || 0
    };
  });
}

export function getCampaignById(id: string): CampaignRecord | undefined {
  return queryOne<CampaignRecord>('SELECT * FROM campaigns WHERE id = ?', [id]);
}

export function insertCampaign(campaign: CampaignRecord): void {
  execute(
    `INSERT INTO campaigns (id, name, template_subject, template_body, status, mailbox_ids, pacing_mode, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      campaign.id,
      campaign.name,
      campaign.template_subject,
      campaign.template_body,
      campaign.status,
      campaign.mailbox_ids,
      campaign.pacing_mode,
      campaign.created_at
    ]
  );
}

export function updateCampaign(campaign: Partial<CampaignRecord> & { id: string }): void {
  const fields: string[] = [];
  const params: any[] = [];

  for (const [key, value] of Object.entries(campaign)) {
    if (key !== 'id' && value !== undefined) {
      fields.push(`${key} = ?`);
      params.push(value);
    }
  }

  if (fields.length > 0) {
    params.push(campaign.id);
    execute(`UPDATE campaigns SET ${fields.join(', ')} WHERE id = ?`, params);
  }
}

export function updateCampaignStatus(id: string, status: CampaignStatus): void {
  execute('UPDATE campaigns SET status = ? WHERE id = ?', [status, id]);
}

export function deleteCampaign(id: string): void {
  execute('DELETE FROM contacts WHERE campaign_id = ?', [id]);
  execute('DELETE FROM send_logs WHERE campaign_id = ?', [id]);
  execute('DELETE FROM campaigns WHERE id = ?', [id]);
}

// ----------------- Contact Operations -----------------

export function insertContactsBatch(contacts: ContactRecord[]): void {
  const database = getDatabase();
  database.run('BEGIN TRANSACTION;');
  try {
    for (const c of contacts) {
      database.run(
        `INSERT INTO contacts (id, campaign_id, email, first_name, last_name, company, custom_data, status, sent_at, mailbox_used, error_log)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          c.id,
          c.campaign_id,
          c.email,
          c.first_name || null,
          c.last_name || null,
          c.company || null,
          c.custom_data || null,
          c.status,
          c.sent_at || null,
          c.mailbox_used || null,
          c.error_log || null
        ]
      );
    }
    database.run('COMMIT;');
  } catch (err) {
    database.run('ROLLBACK;');
    throw err;
  }
  persistDatabase();
}

export function getContactsByCampaign(campaignId: string, limit: number = 500, offset: number = 0): ContactRecord[] {
  return queryAll<ContactRecord>(
    `SELECT * FROM contacts WHERE campaign_id = ? ORDER BY status ASC, id ASC LIMIT ? OFFSET ?`,
    [campaignId, limit, offset]
  );
}

export function getPendingContacts(campaignId: string): ContactRecord[] {
  return queryAll<ContactRecord>(
    `SELECT * FROM contacts WHERE campaign_id = ? AND status IN ('pending', 'queued') ORDER BY id ASC`,
    [campaignId]
  );
}

export function updateContactStatus(
  id: string, 
  status: ContactStatus, 
  mailboxUsed?: string, 
  errorLog?: string
): void {
  const sentAt = status === 'sent' ? Date.now() : null;
  execute(
    `UPDATE contacts 
     SET status = ?, sent_at = COALESCE(?, sent_at), mailbox_used = COALESCE(?, mailbox_used), error_log = ? 
     WHERE id = ?`,
    [status, sentAt, mailboxUsed || null, errorLog || null, id]
  );
}

export function getCampaignContactStats(campaignId: string) {
  const stats = queryOne<{ total: number; sent: number; failed: number; pending: number }>(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
      SUM(CASE WHEN status IN ('failed', 'bounced') THEN 1 ELSE 0 END) as failed,
      SUM(CASE WHEN status IN ('pending', 'queued', 'sending') THEN 1 ELSE 0 END) as pending
    FROM contacts WHERE campaign_id = ?`,
    [campaignId]
  );

  return {
    total: stats?.total || 0,
    sent: stats?.sent || 0,
    failed: stats?.failed || 0,
    pending: stats?.pending || 0
  };
}

// ----------------- Send Logs Operations -----------------

export function insertSendLog(log: SendLogRecord): void {
  execute(
    `INSERT INTO send_logs (id, campaign_id, mailbox_id, recipient, status_code, message, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [log.id, log.campaign_id || null, log.mailbox_id, log.recipient, log.status_code, log.message || null, log.timestamp]
  );
}

export function getSendLogs(campaignId?: string, limit: number = 200): (SendLogRecord & { mailbox_email?: string })[] {
  if (campaignId) {
    return queryAll<SendLogRecord & { mailbox_email?: string }>(
      `SELECT l.*, m.email as mailbox_email 
       FROM send_logs l
       LEFT JOIN mailboxes m ON l.mailbox_id = m.id
       WHERE l.campaign_id = ? 
       ORDER BY l.timestamp DESC 
       LIMIT ?`,
      [campaignId, limit]
    );
  }

  return queryAll<SendLogRecord & { mailbox_email?: string }>(
    `SELECT l.*, m.email as mailbox_email 
     FROM send_logs l
     LEFT JOIN mailboxes m ON l.mailbox_id = m.id
     ORDER BY l.timestamp DESC 
     LIMIT ?`,
    [limit]
  );
}

export function clearSendLogs(campaignId?: string): void {
  if (campaignId) {
    execute('DELETE FROM send_logs WHERE campaign_id = ?', [campaignId]);
  } else {
    execute('DELETE FROM send_logs');
  }
}
