import React from 'react';
import { X, Keyboard, Command, Sparkles, Monitor, Laptop } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Keyboard Shortcuts & Hotkeys</h2>
              <p className="text-xs text-slate-400">Control ColdMail Studio with instant desktop keys</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Section 1: System-Wide Global Hotkeys */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Laptop className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                System-Wide Global Shortcuts (Works Anywhere on Desktop)
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Press these keys even when ColdMail Studio is minimized or you are working inside other applications:
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-white font-medium">Reveal & Focus Dashboard</span>
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-cyan-300 shadow-sm">Ctrl</kbd>
                  <span className="text-slate-500">+</span>
                  <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-cyan-300 shadow-sm">M</kbd>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-xs text-white font-medium">Fail-Safe Global Hotkey</span>
                  <p className="text-[10px] text-slate-500">Guaranteed collision-free if Ctrl+M is hooked by another app</p>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-indigo-300 shadow-sm">Ctrl</kbd>
                  <span className="text-slate-500">+</span>
                  <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-indigo-300 shadow-sm">Shift</kbd>
                  <span className="text-slate-500">+</span>
                  <kbd className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-indigo-300 shadow-sm">M</kbd>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-white font-medium">Single-Key Instant Launcher</span>
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <kbd className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-emerald-300 shadow-sm">F9</kbd>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: In-App Navigation Shortcuts */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Command className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                In-App Quick Navigation
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Inboxes / Dashboard</span>
                <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-indigo-300 font-mono text-[10px]">Ctrl + 1</kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300">New Campaign Wizard</span>
                <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-indigo-300 font-mono text-[10px]">Ctrl + 2</kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Live Telemetry Console</span>
                <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-indigo-300 font-mono text-[10px]">Ctrl + 3</kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Transmission Logs</span>
                <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-indigo-300 font-mono text-[10px]">Ctrl + 4</kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Quick New Campaign</span>
                <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-indigo-300 font-mono text-[10px]">Ctrl + N</kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-300">Connect Mailbox Modal</span>
                <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-indigo-300 font-mono text-[10px]">Ctrl + B</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
