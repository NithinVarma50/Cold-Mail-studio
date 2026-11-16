import React, { useEffect } from 'react';
import { 
  Inbox, 
  Send, 
  Terminal, 
  ScrollText, 
  ShieldCheck, 
  Sparkles, 
  Command, 
  Laptop,
  Keyboard,
  Plus
} from 'lucide-react';
import { CampaignProgress } from '../types';

interface NavbarProps {
  currentTab: 'mailboxes' | 'wizard' | 'console' | 'logs';
  setCurrentTab: (tab: 'mailboxes' | 'wizard' | 'console' | 'logs') => void;
  activeProgress?: CampaignProgress | null;
  onOpenConnectModal?: () => void;
  onOpenShortcutsModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  activeProgress,
  onOpenConnectModal,
  onOpenShortcutsModal
}) => {
  // Listen for local keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when user is actively typing in an input or textarea
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      // Ctrl + / or ? opens shortcuts cheatsheet
      if (((e.ctrlKey || e.metaKey) && e.key === '/') || (!isInput && e.key === '?')) {
        e.preventDefault();
        onOpenShortcutsModal();
        return;
      }

      // Ctrl + M or Ctrl + Shift + M -> Inboxes/Dashboard
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setCurrentTab('mailboxes');
        return;
      }

      // Single F9 key -> Inboxes/Dashboard
      if (e.key === 'F9') {
        e.preventDefault();
        setCurrentTab('mailboxes');
        return;
      }

      // If user is typing in text field, don't hijack normal typing keys
      if (isInput) return;

      // Ctrl + 1, 2, 3, 4
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '1') { e.preventDefault(); setCurrentTab('mailboxes'); }
        if (e.key === '2') { e.preventDefault(); setCurrentTab('wizard'); }
        if (e.key === '3') { e.preventDefault(); setCurrentTab('console'); }
        if (e.key === '4') { e.preventDefault(); setCurrentTab('logs'); }
        if (e.key.toLowerCase() === 'n') { e.preventDefault(); setCurrentTab('wizard'); }
        if (e.key.toLowerCase() === 'b' && onOpenConnectModal) { e.preventDefault(); onOpenConnectModal(); }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCurrentTab, onOpenConnectModal, onOpenShortcutsModal]);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md px-6 flex items-center justify-between select-none z-30 sticky top-0 shadow-lg shadow-black/20">
      {/* Brand & Local Zero-Backend Badge */}
      <div className="flex items-center gap-4">
        <div 
          onClick={() => setCurrentTab('mailboxes')}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="Return to Dashboard (Ctrl + M)"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
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
          onClick={onOpenShortcutsModal}
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs hover:border-indigo-500/50 hover:text-white transition-all cursor-pointer group"
          title="Click to view all keyboard shortcuts (Ctrl + /)"
        >
          <Laptop className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] text-slate-400">Desktop Hotkey:</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-950 text-indigo-300 rounded border border-slate-700 shadow-sm">
            Ctrl + M
          </kbd>
          <span className="text-slate-600 text-[10px] font-mono">/</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-950 text-indigo-300 rounded border border-slate-700 shadow-sm">
            F9
          </kbd>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80">
        <button
          onClick={() => setCurrentTab('mailboxes')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentTab === 'mailboxes'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          title="Inboxes and Health (Ctrl + 1)"
        >
          <Inbox className="w-4 h-4" />
          <span>Inboxes</span>
        </button>

        <button
          onClick={() => setCurrentTab('wizard')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentTab === 'wizard'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          title="Create New Campaign (Ctrl + 2 or Ctrl + N)"
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>New Campaign</span>
        </button>

        <button
          onClick={() => setCurrentTab('console')}
          className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentTab === 'console'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          title="Live Transmission Telemetry (Ctrl + 3)"
        >
          <Terminal className="w-4 h-4" />
          <span>Live Console</span>
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
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          title="Audit Logs (Ctrl + 4)"
        >
          <ScrollText className="w-4 h-4" />
          <span>Telemetry Logs</span>
        </button>
      </nav>

      {/* Right Action & Status Area */}
      <div className="flex items-center gap-3">
        {/* Shortcuts Modal Trigger Button */}
        <button
          onClick={onOpenShortcutsModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
          title="Keyboard Shortcuts Cheat Sheet (Ctrl + /)"
        >
          <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline text-[11px] font-medium">Shortcuts</span>
          <kbd className="hidden md:inline px-1 py-0.2 bg-slate-950 text-[9px] font-mono text-slate-400 rounded border border-slate-700">?</kbd>
        </button>

        {/* Mini Active Campaign Ticker */}
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
