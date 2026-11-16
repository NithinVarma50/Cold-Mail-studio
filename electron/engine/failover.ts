import { MailboxRecord } from '../types';
import { setMailboxCooldown } from '../db/database';

export const RATE_LIMIT_REGEX = /421|452|550 5\.4\.5|daily user sending limit|quota|too many recipients|throttled|temporarily blocked/i;

export interface FailoverResult {
  isRateLimit: boolean;
  cooldownHours: number;
  reason: string;
}

/**
 * Checks an error message or SMTP server response code for rate-limit / throttling patterns
 */
export function checkRateLimitError(error: any): FailoverResult {
  const errString = `${error?.message || ''} ${error?.response || ''} ${error?.responseCode || ''} ${JSON.stringify(error || '')}`;
  
  if (RATE_LIMIT_REGEX.test(errString)) {
    return {
      isRateLimit: true,
      cooldownHours: 6,
      reason: `SMTP server rate limit/quota reached (${extractSmtpCode(errString) || 'throttled'}). Triggering 6-hour cooling period.`
    };
  }

  return {
    isRateLimit: false,
    cooldownHours: 0,
    reason: errString.substring(0, 200)
  };
}

function extractSmtpCode(text: string): string | null {
  const match = text.match(/\b(421|452|550 5\.4\.5)\b/);
  return match ? match[0] : null;
}

/**
 * Puts a mailbox into a 6-hour cooldown and updates database
 */
export function triggerMailboxCooldown(mailbox: MailboxRecord, reason: string): void {
  const sixHoursMs = 6 * 60 * 60 * 1000;
  setMailboxCooldown(mailbox.id, sixHoursMs, reason);
}

/**
 * Filters the given pool to find healthy, active mailboxes
 */
export function getHealthyMailboxes(mailboxes: MailboxRecord[]): MailboxRecord[] {
  const now = Date.now();
  return mailboxes.filter(m => {
    // Check if on cooldown
    if (m.status === 'cooldown' && m.cooldown_until && m.cooldown_until > now) {
      return false;
    }
    // Check if error status
    if (m.status === 'error') {
      return false;
    }
    // Check daily quota limit
    if (m.sent_today >= m.daily_limit) {
      return false;
    }
    return true;
  });
}
