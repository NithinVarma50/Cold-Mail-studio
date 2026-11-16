import React, { useEffect } from 'react';
import { 
  Inbox, 
  Send, 
  Terminal, 
  ScrollText, 
  ShieldCheck, 
  Sparkles, 
  Command, 
  Laptop
} from 'lucide-react';
import { CampaignProgress } from '../types';

interface NavbarProps {
  currentTab: 'mailboxes' | 'wizard' | 'console' | 'logs';
  setCurrentTab: (tab: 'mailboxes' | 'wizard' | 'console' | 'logs') => void;
  activeProgress?: CampaignProgress | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  activeProgress
}) => {
  // Listen for local Ctrl+M or Cmd+M to toggle/switch to Dashboard view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setCurrentTab('mailboxes');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCurrentTab]);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between select-none z-30 sticky top-0">
      {/* Brand & Local Zero-Backend Badge */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Send className="w-4 h-4 text-cyan-400 -rotate-12 translate-x-0.5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">ColdMail<span className="text-cyan-400 font-extrabold">Studio</span></span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                100% Local DB
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Standalone Zero-Cloud Outreach Engine</p>
          </div>
        </div>

        {/* Global Shortcut Hint Pill */}
        <div 
          onClick={() => setCurrentTab('mailboxes')}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs hover:border-indigo-500/50 hover:text-white transition-all cursor-pointer group"
          title="Press Ctrl+M anywhere on desktop to instantly bring up the ColdMail Studio dashboard"
        >
          <Laptop className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] text-slate-400">Desktop Hotkey:</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-950 text-indigo-300 rounded border border-slate-700 shadow-sm">
            Ctrl + M
          </kbd>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setCurrentTab('mailboxes')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentTab === 'mailboxes'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Inbox className="w-4 h-4" />
          Mailboxes
        </button>

        <button
          onClick={() => setCurrentTab('wizard')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentTab === 'wizard'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          New Campaign
        </button>

        <button
          onClick={() => setCurrentTab('console')}
          className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentTab === 'console'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Live Console
          {activeProgress && activeProgress.status === 'running' && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
        </button>

        <button
          onClick={() => setCurrentTab('logs')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentTab === 'logs'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <ScrollText className="w-4 h-4" />
          Telemetry Logs
        </button>
      </nav>

      {/* Mini Active Campaign Ticker */}
      <div className="flex items-center gap-3">
        {activeProgress && activeProgress.status === 'running' ? (
          <div 
            onClick={() => setCurrentTab('console')}
            className="cursor-pointer flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-500/60 transition-all text-xs"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold text-emerald-300 truncate max-w-[130px]">
                {activeProgress.campaign_name}
              </span>
              <span className="text-[10px] text-emerald-400/80 font-mono">
                {activeProgress.sent}/{activeProgress.total} sent ({Math.round((activeProgress.sent / (activeProgress.total || 1)) * 100)}%)
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800/40 border border-slate-800 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
            <span>Engine Idle</span>
          </div>
        )}
      </div>
    </header>
  );
};
