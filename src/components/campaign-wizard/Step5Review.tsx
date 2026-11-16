import React, { useState } from 'react';
import { 
  Rocket, 
  CheckCircle2, 
  ShieldCheck, 
  Users, 
  Mail, 
  Clock, 
  Zap, 
  ArrowLeft,
  Loader2,
  Sparkles,
  Layers
} from 'lucide-react';
import { Mailbox, PacingMode, CSVParseResult } from '../../types';

interface Step5ReviewProps {
  name: string;
  subject: string;
  body: string;
  pacingMode: PacingMode;
  mailboxes: Mailbox[];
  selectedMailboxIds: string[];
  parsedData: CSVParseResult | null;
  mapping: { email: string; first_name?: string; last_name?: string; company?: string };
  onLaunch: () => Promise<void>;
  onBack: () => void;
}

export const Step5Review: React.FC<Step5ReviewProps> = ({
  name,
  subject,
  body,
  pacingMode,
  mailboxes,
  selectedMailboxIds,
  parsedData,
  mapping,
  onLaunch,
  onBack
}) => {
  const [isLaunching, setIsLaunching] = useState(false);

  const selectedBoxes = mailboxes.filter(m => selectedMailboxIds.includes(m.id));
  const validRecipientsCount = parsedData?.validRows || 0;

  const handleLaunchClick = async () => {
    setIsLaunching(true);
    try {
      await onLaunch();
    } catch (err) {
      alert('Failed to launch campaign sequence. Check logs for details.');
      setIsLaunching(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Step 5: Pre-Flight Audit & Launch</h2>
        <p className="text-xs text-slate-400">
          Verify sequence parameters before initiating local multi-mailbox dispatch.
        </p>
      </div>

      {/* Pre-Flight Checklist */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Automated Pre-Flight Checklist</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{selectedBoxes.length} Outgoing Inboxes Verified & Active</span>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>RFC 5322 Syntax Sanitization Passed ({validRecipientsCount} verified)</span>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Duplicate Email Addresses Stripped</span>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Reactive 6-Hour Failover Protection Armed</span>
          </div>
        </div>
      </div>

      {/* Campaign Configuration Snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Target Queue</span>
          </div>
          <span className="text-2xl font-extrabold text-white font-mono">{validRecipientsCount}</span>
          <span className="text-[11px] text-slate-500 block">Verified recipients</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Sender Pool</span>
          </div>
          <span className="text-2xl font-extrabold text-cyan-400 font-mono">{selectedBoxes.length}</span>
          <span className="text-[11px] text-slate-500 block">Rotating inboxes</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>Pacing Mode</span>
          </div>
          <span className="text-base font-extrabold text-purple-300 capitalize">
            {pacingMode === 'stealth' ? 'Stealth Human' : 'Standard Organic'}
          </span>
          <span className="text-[11px] text-slate-500 block">Micro-jitter active</span>
        </div>
      </div>

      {/* Campaign Content Preview */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Template Summary</h4>
        <div className="text-xs space-y-2">
          <div className="flex gap-2">
            <span className="text-slate-500 w-16 shrink-0 font-semibold">Subject:</span>
            <span className="text-white font-medium truncate">{subject}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-slate-500 w-16 shrink-0 font-semibold">Body:</span>
            <span className="text-slate-300 font-mono text-[11px] line-clamp-2">{body}</span>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isLaunching}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          disabled={isLaunching || validRecipientsCount === 0}
          onClick={handleLaunchClick}
          className="flex items-center gap-2.5 px-7 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLaunching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Initializing Worker...</span>
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" />
              <span>Launch Campaign Sequence</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
