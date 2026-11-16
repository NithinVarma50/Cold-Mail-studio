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
  ArrowRight,
  HelpCircle,
  Sparkles,
  Users,
  Send,
  Keyboard
} from 'lucide-react';
import { Mailbox } from '../../types';
import { apiClient } from '../../utils/apiClient';
import { MailboxCard } from './MailboxCard';
import { ConnectionModal } from './ConnectionModal';

interface MailboxListProps {
  onStartCampaignClick: () => void;
  isConnectModalOpen: boolean;
  setIsConnectModalOpen: (open: boolean) => void;
  onOpenShortcutsModal: () => void;
}

export const MailboxList: React.FC<MailboxListProps> = ({ 
  onStartCampaignClick, 
  isConnectModalOpen, 
  setIsConnectModalOpen,
  onOpenShortcutsModal
}) => {
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(true);

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
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Outgoing Inboxes & Pool Dashboard</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
              Rotation Engine
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Multi-inbox pool with automated burst ceilings (Gmail: 40, Outlook: 30, Zoho: 25, Custom: 60) and 6-hour reactive failover.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadMailboxes}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh Inboxes"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer group"
          >
            <Plus className="w-4 h-4" />
            <span>Connect Mailbox</span>
            <kbd className="hidden sm:inline px-1.5 py-0.2 bg-indigo-700/80 text-[10px] rounded font-mono">Ctrl+B</kbd>
          </button>

          <button
            onClick={onStartCampaignClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>New Campaign</span>
            <kbd className="hidden sm:inline px-1.5 py-0.2 bg-cyan-700/80 text-[10px] rounded font-mono">Ctrl+N</kbd>
          </button>
        </div>
      </div>

      {/* Interactive 4-Step Quick Start Onboarding Card */}
      {showHowItWorks && (
        <div className="glass-panel p-5 rounded-2xl border border-indigo-500/20 bg-indigo-950/10 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <HelpCircle className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Simple 4-Step Workflow Guide
              </h2>
            </div>
            <button
              onClick={() => setShowHowItWorks(false)}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Step 1 */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-white">
                <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-[10px] font-mono">1</span>
                <span>Connect Inboxes</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Add your Gmail, Outlook, Zoho, or business SMTP credentials. Encrypted with AES-256 locally.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-white">
                <span className="w-5 h-5 rounded-full bg-cyan-600/30 text-cyan-400 flex items-center justify-center text-[10px] font-mono">2</span>
                <span>Import Contacts</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Drag & drop any CSV or Excel file, or click <em>Load Demo Contacts</em>. Instant RFC 5322 validation.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-white">
                <span className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-400 flex items-center justify-center text-[10px] font-mono">3</span>
                <span>Compose & Pacing</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Use fallback variables like <code className="text-purple-300 font-mono">{"{{first_name | there}}"}</code> with human micro-jitter delays.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-white">
                <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center text-[10px] font-mono">4</span>
                <span>Auto-Rotation & Logs</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Automated burst rotation & 6-hour failover. Monitor live streaming terminal in real-time.
              </p>
            </div>
          </div>
        </div>
      )}

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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Connect Your First Inbox
            </button>
            <button
              onClick={onOpenShortcutsModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            >
              <Keyboard className="w-4 h-4 text-cyan-400" />
              <span>Shortcuts</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300">Active Pool Members ({mailboxes.length})</h2>
            {activeHealthy > 0 && (
              <button
                onClick={onStartCampaignClick}
                className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
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
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onSuccess={loadMailboxes}
      />
    </div>
  );
};
