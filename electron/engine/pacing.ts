import { MailboxRecord, PacingMode, PacingProfileConfig } from '../types';

export const PACING_PROFILES: Record<'consumer' | 'business' | 'stealth', PacingProfileConfig> = {
  consumer: {
    name: 'Consumer Mailbox Profile',
    type: 'consumer',
    batch_size: 10,
    min_delay_ms: 850,
    max_delay_ms: 2500,
    batch_cooldown_min_ms: 3000,
    batch_cooldown_max_ms: 6000,
    description: 'Designed for @gmail, @outlook, @zoho with natural human typing and sending jitters.'
  },
  business: {
    name: 'Custom Domain Profile',
    type: 'business',
    batch_size: 35,
    min_delay_ms: 150,
    max_delay_ms: 400,
    batch_cooldown_min_ms: 500,
    batch_cooldown_max_ms: 1000,
    description: 'Optimized for high-throughput business domains and dedicated mail relays.'
  },
  stealth: {
    name: 'Stealth Human Warmup',
    type: 'stealth',
    batch_size: 5,
    min_delay_ms: 15000,
    max_delay_ms: 45000,
    batch_cooldown_min_ms: 30000,
    batch_cooldown_max_ms: 60000,
    description: 'Maximum deliverability protection: 15-45s random delays simulating a human operator.'
  }
};

/**
 * Returns a random number between min and max (inclusive)
 */
export function getRandomJitter(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Automatically resolves the pacing profile based on current mailbox and campaign mode
 */
export function resolvePacingProfile(
  mailbox: MailboxRecord,
  pacingMode: PacingMode
): PacingProfileConfig {
  if (pacingMode === 'stealth') {
    return PACING_PROFILES.stealth;
  }

  if (mailbox.provider === 'custom') {
    return PACING_PROFILES.business;
  }

  return PACING_PROFILES.consumer;
}

/**
 * Interruptible sleep that checks a cancellation/pause signal periodically
 */
export async function cancellableSleep(
  durationMs: number,
  checkIntervalMs: number = 200,
  shouldStop: () => boolean,
  onTick?: (remainingMs: number) => void
): Promise<boolean> {
  const start = Date.now();
  const end = start + durationMs;

  while (Date.now() < end) {
    if (shouldStop()) {
      return false; // Interrupted
    }
    const remaining = Math.max(0, end - Date.now());
    if (onTick) {
      onTick(remaining);
    }
    const step = Math.min(checkIntervalMs, remaining);
    await new Promise(resolve => setTimeout(resolve, step));
  }

  return true; // Completed fully
}
