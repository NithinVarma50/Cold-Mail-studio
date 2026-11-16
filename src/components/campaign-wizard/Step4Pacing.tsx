import React from 'react';
import { 
  Clock, 
  ShieldCheck, 
  Flame, 
  Zap, 
  Sliders, 
  ArrowRight, 
  ArrowLeft,
  Activity,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { PacingMode, Mailbox } from '../../types';

interface Step4PacingProps {
  pacingMode: PacingMode;
  setPacingMode: (mode: PacingMode) => void;
  mailboxes: Mailbox[];
  selectedMailboxIds: string[];
  totalContacts: number;
  onNext: () => void;
  onBack: () => void;
}

export const Step4Pacing: React.FC<Step4PacingProps> = ({
  pacingMode,
  setPacingMode,
  mailboxes,
  selectedMailboxIds,
  totalContacts,
  onNext,
  onBack
}) => {
  const selectedBoxes = mailboxes.filter(m => selectedMailboxIds.includes(m.id));
  const hasConsumerMailbox = selectedBoxes.some(m => m.provider !== 'custom');

  // Estimate completion time based on settings
  let avgDelaySeconds = 1.6;
  if (pacingMode === 'stealth') {
    avgDelaySeconds = 30; // Average between 15s and 45s
  } else if (!hasConsumerMailbox) {
    avgDelaySeconds = 0.28; // Average between 150ms and 400ms for business
  }

  const estimatedTotalSeconds = totalContacts * avgDelaySeconds;
  const estimatedHours = (estimatedTotalSeconds / 3600).toFixed(1);
  const estimatedMinutes = Math.round(estimatedTotalSeconds / 60);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Step 4: Configure Organic Human Pacing</h2>
        <p className="text-xs text-slate-400">
          Our pacing engine protects your sender reputation by enforcing natural micro-jitters and batch cooldowns, preventing provider rate-limit flags.
        </p>
      </div>

      {/* Stealth Human Warmup Master Toggle Card */}
      <div className={`p-5 rounded-2xl border transition-all ${
        pacingMode === 'stealth'
          ? 'bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border-purple-500/50 shadow-lg shadow-purple-500/10'
          : 'glass-panel border-slate-800'
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              pacingMode === 'stealth'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-slate-800 text-slate-400'
            }`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Stealth Human Warmup Mode</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Recommended for New Inboxes
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                Emulates a meticulous human typing and sending individual emails. Random jitter delays between 
                <strong className="text-purple-300 font-mono"> 15s to 45s </strong> per message with 30s-60s batch cooldowns. Minimizes spam filter detection on fresh domains.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            onClick={() => setPacingMode(pacingMode === 'stealth' ? 'standard' : 'stealth')}
            className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
              pacingMode === 'stealth' ? 'bg-purple-600' : 'bg-slate-800'
            }`}
          >
            <div className={`w-6 h-6 rounded-full bg-white transition-transform ${
              pacingMode === 'stealth' ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* Profile Comparison Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Consumer Free Mailboxes Profile */}
        <div className={`p-5 rounded-2xl border ${
          hasConsumerMailbox && pacingMode === 'standard'
            ? 'bg-indigo-950/20 border-indigo-500/40 ring-1 ring-indigo-500/30'
            : 'glass-panel border-slate-800 opacity-75'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Consumer Profile (@gmail, @outlook, @zoho)
            </span>
            {hasConsumerMailbox && pacingMode === 'standard' && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Auto-Selected for Pool
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Batch Size:</span>
              <span className="font-mono font-bold text-white">10 emails / batch</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Per-Email Jitter Delay:</span>
              <span className="font-mono font-bold text-indigo-300">850ms - 2,500ms</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Batch Cooldown:</span>
              <span className="font-mono font-bold text-emerald-400">3.0s - 6.0s</span>
            </div>
          </div>
        </div>

        {/* Custom Business Domains Profile */}
        <div className={`p-5 rounded-2xl border ${
          !hasConsumerMailbox && pacingMode === 'standard'
            ? 'bg-indigo-950/20 border-indigo-500/40 ring-1 ring-indigo-500/30'
            : 'glass-panel border-slate-800 opacity-75'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-indigo-400" />
              Business Domain Profile (@company.com)
            </span>
            {!hasConsumerMailbox && pacingMode === 'standard' && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                High Throughput
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Batch Size:</span>
              <span className="font-mono font-bold text-white">35 emails / batch</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Per-Email Jitter Delay:</span>
              <span className="font-mono font-bold text-indigo-300">150ms - 400ms</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Batch Cooldown:</span>
              <span className="font-mono font-bold text-emerald-400">500ms - 1.0s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Time Forecast */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Estimated Sequence Duration</h4>
            <p className="text-[11px] text-slate-400">
              For {totalContacts} recipients under {pacingMode === 'stealth' ? 'Stealth Warmup' : 'Standard'} pacing
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xl font-extrabold text-cyan-400 font-mono">
            {estimatedMinutes > 60 ? `~${estimatedHours} hours` : `~${estimatedMinutes} mins`}
          </span>
          <span className="text-[10px] text-slate-500 block">Subject to dynamic jitter</span>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <span>Continue to Review & Launch</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
