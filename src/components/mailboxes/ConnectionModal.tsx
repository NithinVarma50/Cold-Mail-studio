import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  ShieldCheck, 
  Key, 
  Server, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  HelpCircle,
  Zap
} from 'lucide-react';
import { ProviderType } from '../../types';
import { apiClient } from '../../utils/apiClient';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<ProviderType>('gmail');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [host, setHost] = useState('smtp.gmail.com');
  const [port, setPort] = useState(465);
  const [dailyLimit, setDailyLimit] = useState(100);
  
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTabChange = (provider: ProviderType) => {
    setActiveTab(provider);
    setTestStatus(null);
    switch (provider) {
      case 'gmail':
        setHost('smtp.gmail.com');
        setPort(465);
        setDailyLimit(100);
        break;
      case 'outlook':
        setHost('smtp.office365.com');
        setPort(587);
        setDailyLimit(100);
        break;
      case 'zoho':
        setHost('smtp.zoho.com');
        setPort(465);
        setDailyLimit(100);
        break;
      case 'custom':
        setHost('');
        setPort(465);
        setDailyLimit(500);
        break;
    }
  };

  const handleEmailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (activeTab === 'custom' && val.includes('@')) {
      const domain = val.split('@')[1];
      if (domain) {
        setHost(`smtp.${domain}`);
      }
    }
  };

  const handleTestConnection = async () => {
    if (!email || !password) {
      setTestStatus({ success: false, message: 'Please enter both email and password / app password.' });
      return;
    }

    setIsTesting(true);
    setTestStatus(null);
    try {
      const res = await apiClient.testMailboxConnection({
        host,
        port,
        email,
        password
      });
      setTestStatus(res);
    } catch (err: any) {
      setTestStatus({ success: false, message: err?.message || 'SMTP Handshake error' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !host || !port) return;

    setIsSaving(true);
    try {
      await apiClient.createMailbox({
        email,
        password,
        host,
        port,
        provider: activeTab,
        daily_limit: dailyLimit
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setTestStatus({ success: false, message: err?.message || 'Failed to save mailbox locally' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Connect Outgoing Mailbox</h2>
              <p className="text-xs text-slate-400">Credentials are encrypted with AES-256 and stored 100% locally.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabbed Provider Selector */}
        <div className="grid grid-cols-4 p-2 bg-slate-950/80 border-b border-slate-800 gap-1.5">
          <button
            type="button"
            onClick={() => handleTabChange('gmail')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
              activeTab === 'gmail' 
                ? 'bg-red-500/15 text-red-300 border border-red-500/30 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span className="font-bold">Google / Gmail</span>
            <span className="text-[10px] opacity-75">SSL : 465</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('outlook')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
              activeTab === 'outlook' 
                ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span className="font-bold">Outlook / 365</span>
            <span className="text-[10px] opacity-75">TLS : 587</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('zoho')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
              activeTab === 'zoho' 
                ? 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span className="font-bold">Zoho Mail</span>
            <span className="text-[10px] opacity-75">SSL : 465</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('custom')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
              activeTab === 'custom' 
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span className="font-bold">Custom SMTP</span>
            <span className="text-[10px] opacity-75">Dedicated Domain</span>
          </button>
        </div>

        {/* Tabbed Setup Guide Banner */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 text-xs">
          {activeTab === 'gmail' && (
            <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/20 text-red-200 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Gmail / Workspace Setup Instruction:</p>
                <p className="text-[11px] text-red-200/90 mt-0.5 leading-relaxed">
                  Google requires a 16-character <strong>App Password</strong>. Navigate to: 
                  <span className="text-white font-mono ml-1">myaccount.google.com &gt; Security &gt; 2-Step Verification &gt; App passwords</span>. Generate an app password named "ColdMail" and paste it below.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'outlook' && (
            <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/20 text-blue-200 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Microsoft 365 / Outlook Setup Instruction:</p>
                <p className="text-[11px] text-blue-200/90 mt-0.5 leading-relaxed">
                  Uses authenticated STARTTLS on Port 587. If Multi-Factor Authentication is enabled on your tenant, generate an <strong>App Password</strong> in your Microsoft Security Dashboard.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'zoho' && (
            <div className="p-3 rounded-xl bg-yellow-950/30 border border-yellow-500/20 text-yellow-200 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Zoho Mail Setup Instruction:</p>
                <p className="text-[11px] text-yellow-200/90 mt-0.5 leading-relaxed">
                  Go to <span className="font-mono text-white">Zoho Accounts &gt; Security &gt; Application Specific Passwords</span>. Generate a dedicated password for SMTP client transmission.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-cyan-200 flex items-start gap-2.5">
              <Server className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Custom Business Domain SMTP:</p>
                <p className="text-[11px] text-cyan-200/90 mt-0.5 leading-relaxed">
                  Connect your business relay (SendGrid, Postmark, Amazon SES, or private Postfix/cPanel). Supports direct SSL (465) or TLS (587).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Sender Email Address <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={handleEmailChange}
                placeholder={activeTab === 'gmail' ? 'outreach@gmail.com' : 'you@company.com'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password or App-Specific Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                SMTP Host <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={host}
                onChange={e => setHost(e.target.value)}
                placeholder="smtp.example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Port & Protocol <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  required
                  value={port}
                  onChange={e => setPort(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
                <div className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 shrink-0 flex items-center font-semibold">
                  {port === 465 ? 'SSL' : port === 587 ? 'TLS' : 'PLAIN'}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Daily Send Limit (Quota Cap)
              </label>
              <span className="text-xs font-mono font-bold text-indigo-400">
                {dailyLimit} emails / day
              </span>
            </div>
            <input
              type="range"
              min={20}
              max={activeTab === 'custom' ? 2000 : 300}
              step={10}
              value={dailyLimit}
              onChange={e => setDailyLimit(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Conservative (Safe)</span>
              <span>Maximum recommended for {activeTab.toUpperCase()}</span>
            </div>
          </div>

          {/* Test Status Banner */}
          {testStatus && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              testStatus.success 
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
            }`}>
              {testStatus.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="leading-snug">{testStatus.message}</div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all disabled:opacity-50"
            >
              {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" /> : <Zap className="w-3.5 h-3.5 text-cyan-400" />}
              {isTesting ? 'Verifying...' : 'Verify Connection First'}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Save Mailbox
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
