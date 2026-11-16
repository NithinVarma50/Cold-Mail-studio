import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Inbox, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  ShieldCheck, 
  RefreshCw, 
  Zap, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { Mailbox } from '../../types';
import { apiClient } from '../../utils/apiClient';
import { MailboxCard } from './MailboxCard';
import { ConnectionModal } from './ConnectionModal';

interface MailboxListProps {
  onStartCampaignClick: () => void;
}

export const MailboxList: React.FC<MailboxListProps> = ({ onStartCampaignClick }) => {
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadMailboxes = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.listMailboxes();
      setMailboxes(data);
    } catch (err) {
      console.error('Error fetching mailboxes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMailboxes();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this mailbox from your rotation pool?')) {
      await apiClient.deleteMailbox(id);
      loadMailboxes();
    }
  };

  // Calculations
  const totalInboxes = mailboxes.length;
  const now = Date.now();
  const activeHealthy = mailboxes.filter(m => m.status === 'active' && m.sent_today < m.daily_limit).length;
  const inCooldown = mailboxes.filter(m => m.status === 'cooldown' && m.cooldown_until && m.cooldown_until > now).length;
  const totalDailyBandwidth = mailboxes.reduce((acc, m) => acc + m.daily_limit, 0);
  const totalSentToday = mailboxes.reduce((acc, m) => acc + m.sent_today, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Stats Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Connected Outgoing Inboxes</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
              Rotation Pool
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Multi-inbox pool with automatic burst ceilings (Gmail: 40, Outlook: 30, Zoho: 25, Custom: 60) and 6-hour reactive failover.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadMailboxes}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh Inboxes"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Connect Mailbox
          </button>
        </div>
      </div>

      {/* Aggregate Pool Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Rotation Pool Size</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-white">{totalInboxes}</span>
              <span className="text-xs text-slate-500">inboxes</span>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Healthy & Ready</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-emerald-400">{activeHealthy}</span>
              <span className="text-xs text-slate-500">available now</span>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Cooldown / Failover</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-amber-400">{inCooldown}</span>
              <span className="text-xs text-slate-500">resting 6 hours</span>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Daily Bandwidth</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-white">{totalSentToday}</span>
              <span className="text-xs text-slate-500 font-mono">/ {totalDailyBandwidth} cap</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mailbox Cards Grid */}
      {mailboxes.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 border border-dashed border-slate-800 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No Outgoing Inboxes Connected</h3>
          <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
            Connect your Gmail, Microsoft 365, Zoho, or custom business domain SMTP inboxes to enable multi-mailbox rotation and protect sender reputation.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Connect Your First Inbox
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300">Active Pool Members ({mailboxes.length})</h2>
            {activeHealthy > 0 && (
              <button
                onClick={onStartCampaignClick}
                className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <span>Launch New Campaign with this Pool</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {mailboxes.map(mailbox => (
              <MailboxCard
                key={mailbox.id}
                mailbox={mailbox}
                onRefresh={loadMailboxes}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Connection Modal */}
      <ConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadMailboxes}
      />
    </div>
  );
};
