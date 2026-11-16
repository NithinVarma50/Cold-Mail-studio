import nodemailer from 'nodemailer';
import { MailboxRecord, ProviderType } from '../types';
import { decryptPassword } from '../db/crypto';

export interface ProviderConfig {
  provider: ProviderType;
  host: string;
  port: number;
  secure: boolean;
  burstCeiling: number;
}

export function detectProvider(email: string): ProviderConfig {
  const lower = email.toLowerCase().trim();
  const domain = lower.split('@')[1] || '';

  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return {
      provider: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      burstCeiling: 40
    };
  }

  if (
    domain === 'outlook.com' ||
    domain === 'hotmail.com' ||
    domain === 'office365.com' ||
    domain === 'live.com' ||
    domain.endsWith('.outlook.com')
  ) {
    return {
      provider: 'outlook',
      host: 'smtp.office365.com',
      port: 587,
      secure: false, // port 587 uses STARTTLS
      burstCeiling: 30
    };
  }

  if (domain === 'zoho.com' || domain.endsWith('.zoho.com')) {
    return {
      provider: 'zoho',
      host: 'smtp.zoho.com',
      port: 465,
      secure: true,
      burstCeiling: 25
    };
  }

  // Custom domain defaults
  return {
    provider: 'custom',
    host: `smtp.${domain}`,
    port: 465,
    secure: true,
    burstCeiling: 60
  };
}

export function getBurstCeiling(provider: ProviderType): number {
  switch (provider) {
    case 'gmail':
      return 40;
    case 'outlook':
      return 30;
    case 'zoho':
      return 25;
    case 'custom':
    default:
      return 60;
  }
}

/**
 * Creates a configured Nodemailer direct SMTP transporter
 */
export function createTransporter(mailbox: {
  host: string;
  port: number;
  email: string;
  password?: string;
  encrypted_password?: string;
}) {
  const password = mailbox.password || decryptPassword(mailbox.encrypted_password || '');
  const isPort465 = mailbox.port === 465;

  return nodemailer.createTransport({
    host: mailbox.host,
    port: mailbox.port,
    secure: isPort465, // true for 465, false for 587/25
    auth: {
      user: mailbox.email,
      pass: password
    },
    tls: {
      rejectUnauthorized: false // Allow custom internal certificates if needed
    },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000
  });
}

/**
 * Verifies SMTP connection and authentication
 */
export async function verifySmtpConnection(mailbox: {
  host: string;
  port: number;
  email: string;
  password?: string;
  encrypted_password?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = createTransporter(mailbox);
    await transporter.verify();
    return { success: true, message: 'SMTP handshake and TLS authentication successful!' };
  } catch (error: any) {
    const errorMsg = error?.message || error?.response || 'Connection failed';
    return { success: false, message: errorMsg };
  }
}

/**
 * Sends a single email using direct TLS connection
 */
export async function sendEmailDirect({
  mailbox,
  to,
  subject,
  html,
  text
}: {
  mailbox: MailboxRecord;
  to: string;
  subject: string;
  html?: string;
  text?: string;
}): Promise<{ success: boolean; messageId: string; response: string }> {
  const transporter = createTransporter(mailbox);

  const mailOptions = {
    from: `"${mailbox.email.split('@')[0]}" <${mailbox.email}>`,
    to,
    subject,
    text: text || '',
    html: html || undefined
  };

  const info = await transporter.sendMail(mailOptions);
  return {
    success: true,
    messageId: info.messageId || '',
    response: info.response || 'Message sent successfully'
  };
}

/**
 * In-memory state tracking burst counts for proactive burst rotation
 */
export class MailboxBurstTracker {
  private burstMap: Map<string, number> = new Map();

  getBurst(mailboxId: string): number {
    return this.burstMap.get(mailboxId) || 0;
  }

  increment(mailboxId: string): number {
    const current = this.getBurst(mailboxId);
    const next = current + 1;
    this.burstMap.set(mailboxId, next);
    return next;
  }

  reset(mailboxId: string): void {
    this.burstMap.set(mailboxId, 0);
  }

  hasReachedCeiling(mailbox: MailboxRecord): boolean {
    const ceiling = getBurstCeiling(mailbox.provider);
    return this.getBurst(mailbox.id) >= ceiling;
  }
}
