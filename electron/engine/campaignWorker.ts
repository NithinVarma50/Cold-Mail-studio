import { BrowserWindow } from 'electron';
import { 
  getCampaignById, 
  getAllMailboxes, 
  getPendingContacts, 
  updateContactStatus, 
  incrementMailboxSentToday, 
  insertSendLog, 
  updateCampaignStatus, 
  getCampaignContactStats 
} from '../db/database';
import { 
  MailboxRecord, 
  CampaignRecord, 
  ContactRecord, 
  LogLevel, 
  CampaignStatus 
} from '../types';
import { 
  sendEmailDirect, 
  MailboxBurstTracker, 
  getBurstCeiling 
} from './smtpPool';
import { 
  checkRateLimitError, 
  triggerMailboxCooldown, 
  getHealthyMailboxes 
} from './failover';
import { 
  resolvePacingProfile, 
  getRandomJitter, 
  cancellableSleep 
} from './pacing';
import { interpolateTemplate } from './template';
import crypto from 'crypto';

export class CampaignExecutionWorker {
  private activeCampaignId: string | null = null;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private shouldAbort: boolean = false;
  private burstTracker: MailboxBurstTracker = new MailboxBurstTracker();
  private batchCounter: number = 0;
  private currentMailboxIndex: number = 0;
  private currentPacingStatus: string = 'Idle';
  private mainWindow: BrowserWindow | null = null;

  setWindow(win: BrowserWindow | null) {
    this.mainWindow = win;
  }

  private emit(channel: string, data: any) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  private broadcastLog(
    campaignId: string, 
    mailboxId: string, 
    mailboxEmail: string, 
    recipient: string, 
    statusCode: LogLevel, 
    message: string
  ) {
    const timestamp = Date.now();
    const logRecord = {
      id: crypto.randomUUID(),
      campaign_id: campaignId,
      mailbox_id: mailboxId,
      recipient,
      status_code: statusCode,
      message,
      timestamp
    };

    insertSendLog(logRecord);

    this.emit('campaign:log', {
      ...logRecord,
      mailbox_email: mailboxEmail
    });
  }

  public getStatus() {
    if (!this.activeCampaignId) {
      return {
        campaign_id: null,
        status: 'idle',
        isRunning: false,
        isPaused: false
      };
    }

    const campaign = getCampaignById(this.activeCampaignId);
    const stats = getCampaignContactStats(this.activeCampaignId);

    return {
      campaign_id: this.activeCampaignId,
      campaign_name: campaign?.name || 'Campaign',
      status: this.isPaused ? 'paused' : (this.isRunning ? 'running' : campaign?.status || 'idle'),
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      total: stats?.total || 0,
      sent: stats?.sent || 0,
      failed: stats?.failed || 0,
      pending: stats?.pending || 0,
      pacing_status: this.currentPacingStatus
    };
  }

  public async start(campaignId: string): Promise<{ success: boolean; message: string }> {
    if (this.isRunning && !this.isPaused) {
      return { success: false, message: 'Another campaign is already executing.' };
    }

    const campaign = getCampaignById(campaignId);
    if (!campaign) {
      return { success: false, message: 'Campaign not found in local database.' };
    }

    this.activeCampaignId = campaignId;
    this.isRunning = true;
    this.isPaused = false;
    this.shouldAbort = false;
    this.batchCounter = 0;
    this.currentPacingStatus = 'Initializing pool...';

    updateCampaignStatus(campaignId, 'running');
    this.emit('campaign:status_changed', { campaign_id: campaignId, status: 'running' });

    // Execute in background
    this.runCampaignLoop(campaign).catch(err => {
      console.error('Campaign worker error:', err);
      this.broadcastLog(campaignId, 'SYSTEM', 'system', 'system', 'WARN', `Worker crashed: ${err.message}`);
      this.finishExecution('paused');
    });

    return { success: true, message: `Campaign "${campaign.name}" started.` };
  }

  public pause(): { success: boolean; message: string } {
    if (!this.isRunning || this.isPaused) {
      return { success: false, message: 'Campaign is not currently running.' };
    }
    this.isPaused = true;
    this.currentPacingStatus = 'Paused by operator';
    if (this.activeCampaignId) {
      updateCampaignStatus(this.activeCampaignId, 'paused');
      this.emit('campaign:status_changed', { campaign_id: this.activeCampaignId, status: 'paused' });
      this.broadcastLog(this.activeCampaignId, 'SYSTEM', 'system', 'all', 'INFO', 'Campaign execution paused by user.');
    }
    return { success: true, message: 'Campaign paused.' };
  }

  public resume(): { success: boolean; message: string } {
    if (!this.isRunning || !this.isPaused) {
      return { success: false, message: 'Campaign is not paused.' };
    }
    this.isPaused = false;
    this.currentPacingStatus = 'Resuming transmission...';
    if (this.activeCampaignId) {
      updateCampaignStatus(this.activeCampaignId, 'running');
      this.emit('campaign:status_changed', { campaign_id: this.activeCampaignId, status: 'running' });
      this.broadcastLog(this.activeCampaignId, 'SYSTEM', 'system', 'all', 'INFO', 'Campaign execution resumed.');
    }
    return { success: true, message: 'Campaign resumed.' };
  }

  public stop(): { success: boolean; message: string } {
    if (!this.isRunning && !this.activeCampaignId) {
      return { success: false, message: 'No campaign is currently active.' };
    }
    this.shouldAbort = true;
    this.isPaused = false;
    this.isRunning = false;
    this.currentPacingStatus = 'Stopped';
    if (this.activeCampaignId) {
      updateCampaignStatus(this.activeCampaignId, 'stopped');
      this.emit('campaign:status_changed', { campaign_id: this.activeCampaignId, status: 'stopped' });
      this.broadcastLog(this.activeCampaignId, 'SYSTEM', 'system', 'all', 'INFO', 'Campaign forcefully stopped.');
      this.activeCampaignId = null;
    }
    return { success: true, message: 'Campaign stopped.' };
  }

  private finishExecution(finalStatus: CampaignStatus) {
    this.isRunning = false;
    this.isPaused = false;
    this.currentPacingStatus = finalStatus === 'completed' ? 'Completed successfully' : 'Execution halted';

    if (this.activeCampaignId) {
      updateCampaignStatus(this.activeCampaignId, finalStatus);
      this.emit('campaign:status_changed', { campaign_id: this.activeCampaignId, status: finalStatus });
      this.broadcastLog(
        this.activeCampaignId, 
        'SYSTEM', 
        'system', 
        'all', 
        finalStatus === 'completed' ? 'SENT' : 'WARN', 
        `Campaign finished with status: ${finalStatus.toUpperCase()}`
      );
    }
  }

  private async runCampaignLoop(campaign: CampaignRecord) {
    const campaignId = campaign.id;
    let selectedMailboxIds: string[] = [];

    try {
      selectedMailboxIds = JSON.parse(campaign.mailbox_ids || '[]');
    } catch {
      selectedMailboxIds = [];
    }

    this.broadcastLog(
      campaignId, 
      'SYSTEM', 
      'system', 
      'engine', 
      'INFO', 
      `Launching campaign "${campaign.name}" with pacing mode: ${campaign.pacing_mode.toUpperCase()}`
    );

    while (this.isRunning && !this.shouldAbort) {
      // 1. Check for pause condition
      while (this.isPaused && !this.shouldAbort) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      if (this.shouldAbort) break;

      // 2. Fetch healthy mailbox pool
      const allBoxes = getAllMailboxes();
      const campaignBoxes = allBoxes.filter(m => selectedMailboxIds.length === 0 || selectedMailboxIds.includes(m.id));
      const healthyPool = getHealthyMailboxes(campaignBoxes);

      if (healthyPool.length === 0) {
        this.currentPacingStatus = 'All mailboxes exhausted or in cooldown';
        this.broadcastLog(
          campaignId, 
          'SYSTEM', 
          'system', 
          'pool', 
          'WARN', 
          'CRITICAL: All configured mailboxes are exhausted (daily limit) or currently in 6-hour cooldown. Pausing campaign.'
        );
        this.finishExecution('paused');
        return;
      }

      // 3. Fetch pending contacts
      const pendingContacts = getPendingContacts(campaignId);
      if (pendingContacts.length === 0) {
        this.broadcastLog(campaignId, 'SYSTEM', 'system', 'contacts', 'INFO', 'All contacts processed! Campaign complete.');
        this.finishExecution('completed');
        return;
      }

      const contact = pendingContacts[0];

      // 4. Select Mailbox with Round-Robin & Burst Tracking
      if (this.currentMailboxIndex >= healthyPool.length) {
        this.currentMailboxIndex = 0;
      }

      let activeMailbox = healthyPool[this.currentMailboxIndex];
      const burstCeiling = getBurstCeiling(activeMailbox.provider);
      const currentBurst = this.burstTracker.getBurst(activeMailbox.id);

      // Check if burst ceiling reached for current mailbox
      if (currentBurst >= burstCeiling) {
        this.broadcastLog(
          campaignId,
          activeMailbox.id,
          activeMailbox.email,
          'pool',
          'BURST',
          `Proactive burst ceiling reached (${currentBurst}/${burstCeiling} for ${activeMailbox.provider}). Rotating to next inbox in pool.`
        );
        this.burstTracker.reset(activeMailbox.id);
        this.currentMailboxIndex = (this.currentMailboxIndex + 1) % healthyPool.length;
        activeMailbox = healthyPool[this.currentMailboxIndex];
      }

      const activeCeiling = getBurstCeiling(activeMailbox.provider);
      const burstCount = this.burstTracker.getBurst(activeMailbox.id) + 1;

      // 5. Resolve Pacing Profile & Delays
      const pacingProfile = resolvePacingProfile(activeMailbox, campaign.pacing_mode);
      const emailDelayMs = getRandomJitter(pacingProfile.min_delay_ms, pacingProfile.max_delay_ms);

      // Update UI Progress Broadcast
      const stats = getCampaignContactStats(campaignId);
      this.currentPacingStatus = `Preparing dispatch via ${activeMailbox.email}...`;
      this.emit('campaign:progress', {
        campaign_id: campaignId,
        campaign_name: campaign.name,
        total: stats.total,
        sent: stats.sent,
        failed: stats.failed,
        pending: stats.pending,
        active_mailbox_email: activeMailbox.email,
        current_recipient: contact.email,
        status: 'running',
        current_burst: burstCount,
        burst_ceiling: activeCeiling,
        pacing_status: this.currentPacingStatus
      });

      // 6. Interpolate Template
      const interpolatedSubject = interpolateTemplate(campaign.template_subject, contact);
      const interpolatedBody = interpolateTemplate(campaign.template_body, contact);

      // Mark contact as 'sending'
      updateContactStatus(contact.id, 'sending', activeMailbox.email);

      // 7. Direct SMTP Dispatch
      try {
        this.broadcastLog(
          campaignId,
          activeMailbox.id,
          activeMailbox.email,
          contact.email,
          'INFO',
          `Transmitting: ${activeMailbox.email} -> ${contact.email} [Burst ${burstCount}/${activeCeiling}]`
        );

        const result = await sendEmailDirect({
          mailbox: activeMailbox,
          to: contact.email,
          subject: interpolatedSubject,
          html: interpolatedBody.includes('<') && interpolatedBody.includes('>') ? interpolatedBody : undefined,
          text: interpolatedBody
        });

        // SUCCESS: Mark contact as sent
        updateContactStatus(contact.id, 'sent', activeMailbox.email);
        incrementMailboxSentToday(activeMailbox.id);
        this.burstTracker.increment(activeMailbox.id);
        this.batchCounter++;

        this.broadcastLog(
          campaignId,
          activeMailbox.id,
          activeMailbox.email,
          contact.email,
          'SENT',
          `Delivered (250 OK): ${result.response || 'Success'}`
        );

      } catch (err: any) {
        // ERROR HANDLING & REACTIVE FAILOVER
        const rateLimitCheck = checkRateLimitError(err);

        if (rateLimitCheck.isRateLimit) {
          // Put mailbox into 6-hour cooldown
          triggerMailboxCooldown(activeMailbox, rateLimitCheck.reason);
          this.burstTracker.reset(activeMailbox.id);

          this.broadcastLog(
            campaignId,
            activeMailbox.id,
            activeMailbox.email,
            contact.email,
            'COOLDOWN',
            `FAILOVER: ${rateLimitCheck.reason} - Mailbox paused for 6 hours. Re-queuing ${contact.email} for next mailbox.`
          );

          // Re-queue the contact to be picked up immediately by the next healthy mailbox
          updateContactStatus(contact.id, 'pending', undefined, 'Re-queued due to mailbox rate limit');
          this.currentMailboxIndex = (this.currentMailboxIndex + 1) % healthyPool.length;

          // Short backoff before retrying with next mailbox
          await new Promise(res => setTimeout(res, 1000));
          continue;
        } else {
          // Permanent or recipient-specific failure (invalid email, rejected domain, etc.)
          const errMsg = err?.message || 'SMTP transmission error';
          updateContactStatus(contact.id, 'failed', activeMailbox.email, errMsg);

          this.broadcastLog(
            campaignId,
            activeMailbox.id,
            activeMailbox.email,
            contact.email,
            'FAILED',
            `Transmission failed: ${errMsg}`
          );
        }
      }

      // 8. Human Organic Pacing Delay
      if (this.batchCounter >= pacingProfile.batch_size) {
        // Batch cooldown triggered
        const batchCooldownMs = getRandomJitter(
          pacingProfile.batch_cooldown_min_ms, 
          pacingProfile.batch_cooldown_max_ms
        );
        this.batchCounter = 0;
        this.broadcastLog(
          campaignId,
          activeMailbox.id,
          activeMailbox.email,
          'batch',
          'PACING',
          `Batch of ${pacingProfile.batch_size} completed. Organic cooldown sleeping ${(batchCooldownMs / 1000).toFixed(1)}s...`
        );

        await cancellableSleep(
          batchCooldownMs,
          250,
          () => this.shouldAbort || this.isPaused,
          remaining => {
            this.currentPacingStatus = `Batch cooldown (${(remaining / 1000).toFixed(1)}s left)`;
            this.emit('campaign:progress', {
              campaign_id: campaignId,
              pacing_status: this.currentPacingStatus
            });
          }
        );
      } else {
        // Individual email jitter delay
        await cancellableSleep(
          emailDelayMs,
          200,
          () => this.shouldAbort || this.isPaused,
          remaining => {
            this.currentPacingStatus = `Pacing jitter (${(remaining / 1000).toFixed(1)}s)...`;
            this.emit('campaign:progress', {
              campaign_id: campaignId,
              pacing_status: this.currentPacingStatus
            });
          }
        );
      }
    }

    if (this.shouldAbort) {
      this.finishExecution('stopped');
    }
  }
}

export const campaignWorker = new CampaignExecutionWorker();
