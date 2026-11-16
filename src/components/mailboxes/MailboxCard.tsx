import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Trash2, 
  Flame, 
  Mail, 
  ShieldCheck, 
  Zap, 
  Clock 
} from 'lucide-react';
import { Mailbox } from '../../types';
import { apiClient } from '../../utils/apiClient';

interface MailboxCardProps {
  mailbox: Mailbox;
  onRefresh: () => void;
  onDelete: (id: string) => void;
}

export const MailboxCard: React.FC<MailboxCardProps> = ({ mailbox, onRefresh, onDelete }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const providerIcons: Record<string, { label: string; color: string; badge: string }> = {
    gmail: { label: 'Google Workspace / Gmail', color: 'text-red-400', badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
    outlook: { label: 'Microsoft 365 / Outlook', color: 'text-blue-400', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    zoho: { label: 'Zoho Mail', color: 'text-yellow-400', badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    custom: { label: 'Custom Domain SMTP', color: 'text-cyan-400', badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' }
  };

  const provider = providerIcons[mailbox.provider] || providerIcons.custom;
  const burstCeilings: Record<string, number> = { gmail: 40, outlook: 30, zoho: 25, custom: 60 };
  const burstCeiling = burstCeilings[mailbox.provider] || 60;

  // Calculate cooldown remaining if on cooldown
  const now = Date.now();
  const isOnCooldown = mailbox.status === 'cooldown' && mailbox.cooldown_until && mailbox.cooldown_until > now;
  const cooldownRemainingHours = isOnCooldown 
    ? ((mailbox.cooldown_until! - now) / (1000 * 60 * 60)).toFixed(1)
    : null;

  const quotaPercent = Math.min(100, Math.round((mailbox.sent_today / mailbox.daily_limit) * 100));

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await apiClient.testMailboxConnection({
        host: mailbox.host,
        port: mailbox.port,
        email: mailbox.email,
        encrypted_password: (mailbox as any).encrypted_password
      });
      setTestResult(res);
      if (res.success && mailbox.status === 'error') {
        await apiClient.updateMailbox({ id: mailbox.id, status: 'active', error_message: '' });
        onRefresh();
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'SMTP Handshake failed' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between relative group">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
              <Mail className={`w-5 h-5 ${provider.color}`} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white truncate max-w-[190px]" title={mailbox.email}>
                {mailbox.email}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${provider.badge}`}>
                  {provider.label}
                </span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div>
            {isOnCooldown ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                <Clock className="w-3 h-3" />
                Cooldown ({cooldownRemainingHours}h)
              </span>
            ) : mailbox.status === 'active' ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Active & Healthy
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <XCircle className="w-3 h-3" />
                Auth / Error
              </span>
            )}
          </div>
        </div>

        {/* Cooldown / Error Explanation Note */}
        {isOnCooldown && (
          <div className="mb-3.5 p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Auto-Failover engaged: Inbox hit server rate-limit. Temporarily resting for 6 hours to protect domain reputation.
            </span>
          </div>
        )}

        {mailbox.status === 'error' && mailbox.error_message && (
          <div className="mb-3.5 p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/20 text-[11px] text-rose-300 flex items-start gap-2">
            <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
            <span className="truncate">{mailbox.error_message}</span>
          </div>
        )}

        {/* Server & Rotation Specs */}
        <div className="grid grid-cols-2 gap-2 mb-4 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Outgoing Relay</span>
            <span className="text-slate-200 text-[11px] truncate block">{mailbox.host}:{mailbox.port}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Proactive Burst Ceiling</span>
            <span className="text-indigo-300 text-[11px] flex items-center gap-1">
              <Zap className="w-3 h-3 text-indigo-400" />
              {burstCeiling} emails / burst
            </span>
          </div>
        </div>

        {/* Daily Quota Progress */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              Daily Bandwidth Quota
            </span>
            <span className="font-semibold text-slate-200 font-mono">
              {mailbox.sent_today} / {mailbox.daily_limit} ({quotaPercent}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                quotaPercent > 90 
                  ? 'bg-rose-500' 
                  : quotaPercent > 70 
                  ? 'bg-amber-500' 
                  : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
              }`}
              style={{ width: `${quotaPercent}%` }}
            />
          </div>
        </div>

        {/* Test Result Feedback */}
        {testResult && (
          <div className={`mb-3 p-2 rounded-lg text-xs flex items-center gap-2 ${
            testResult.success 
              ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
          }`}>
            {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
            <span className="truncate">{testResult.message}</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
        <button
          onClick={handleTestConnection}
          disabled={isTesting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-cyan-400' : ''}`} />
          {isTesting ? 'Verifying TLS...' : 'Verify SMTP'}
        </button>

        <button
          onClick={() => onDelete(mailbox.id)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Remove mailbox from pool"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
