import React from 'react';
import { Mail, Check, Layers, ShieldCheck, Flame, ArrowRight } from 'lucide-react';
import { Mailbox } from '../../types';

interface Step1DetailsProps {
  name: string;
  setName: (name: string) => void;
  mailboxes: Mailbox[];
  selectedMailboxIds: string[];
  setSelectedMailboxIds: React.Dispatch<React.SetStateAction<string[]>>;
  onNext: () => void;
}

export const Step1Details: React.FC<Step1DetailsProps> = ({
  name,
  setName,
  mailboxes,
  selectedMailboxIds,
  setSelectedMailboxIds,
  onNext
}) => {
  const toggleMailbox = (id: string) => {
    setSelectedMailboxIds(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedMailboxIds.length === mailboxes.length) {
      setSelectedMailboxIds([]);
    } else {
      setSelectedMailboxIds(mailboxes.map(m => m.id));
    }
  };

  const selectedBoxes = mailboxes.filter(m => selectedMailboxIds.includes(m.id));
  const combinedDailyLimit = selectedBoxes.reduce((acc, m) => acc + m.daily_limit, 0);

  const isValid = name.trim().length > 0 && selectedMailboxIds.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Step 1: Campaign Details & Sender Pool</h2>
        <p className="text-xs text-slate-400">
          Name your outreach sequence and select the inboxes that will participate in multi-mailbox burst rotation.
        </p>
      </div>

      {/* Campaign Name */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
        <label className="block text-xs font-bold text-slate-200">
          Campaign Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Q4 Growth Leaders Cold Outreach"
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Select Inboxes */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Select Senders for Rotation Pool</h3>
            <p className="text-xs text-slate-400">
              The engine will automatically rotate round-robin across selected inboxes based on their burst ceilings.
            </p>
          </div>
          <button
            type="button"
            onClick={selectAll}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {selectedMailboxIds.length === mailboxes.length ? 'Deselect All' : 'Select All Active'}
          </button>
        </div>

        {mailboxes.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-950 border border-dashed border-slate-800 text-center text-xs text-slate-400">
            No mailboxes connected yet. Please connect at least one mailbox before launching a campaign.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mailboxes.map(mailbox => {
              const isSelected = selectedMailboxIds.includes(mailbox.id);
              const isCooldown = mailbox.status === 'cooldown';

              return (
                <div
                  key={mailbox.id}
                  onClick={() => toggleMailbox(mailbox.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected 
                      ? 'bg-indigo-600/10 border-indigo-500/50 shadow-sm' 
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                      isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-700 bg-slate-900'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white truncate max-w-[170px]">{mailbox.email}</p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {mailbox.provider.toUpperCase()} • {mailbox.daily_limit}/day cap
                      </span>
                    </div>
                  </div>

                  {isCooldown && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Cooldown
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Pool Capacity Summary */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Selected Pool Bandwidth:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-indigo-300 font-mono">
              {selectedMailboxIds.length} inboxes selected
            </span>
            <span className="text-slate-600">|</span>
            <span className="font-bold text-emerald-400 font-mono">
              ~{combinedDailyLimit} emails/day capacity
            </span>
          </div>
        </div>
      </div>

      {/* Next Step Button */}
      <div className="flex justify-end">
        <button
          type="button"
          disabled={!isValid}
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Continue to Import Contacts</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
