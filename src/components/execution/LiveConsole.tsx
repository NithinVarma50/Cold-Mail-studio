import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Layers, 
  Flame, 
  ShieldCheck, 
  Activity, 
  Zap, 
  Mail,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CampaignProgress, SendLog, Campaign } from '../../types';
import { apiClient } from '../../utils/apiClient';
import { TerminalLog } from './TerminalLog';

interface LiveConsoleProps {
  initialCampaignId?: string | null;
  onNavigateWizard: () => void;
}

export const LiveConsole: React.FC<LiveConsoleProps> = ({ initialCampaignId, onNavigateWizard }) => {
  const [progress, setProgress] = useState<CampaignProgress | null>(null);
  const [logs, setLogs] = useState<SendLog[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(initialCampaignId || '');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Load campaigns list
  useEffect(() => {
    apiClient.listCampaigns().then(list => {
      setCampaigns(list);
      if (!selectedCampaignId && list.length > 0) {
        // Default to running or first campaign
        const running = list.find(c => c.status === 'running' || c.status === 'paused');
        setSelectedCampaignId(running ? running.id : list[0].id);
      }
    });
  }, [selectedCampaignId]);

  // Fetch initial status and logs
  useEffect(() => {
    apiClient.getExecutionStatus().then(status => {
      if (status && status.campaign_id) {
        setProgress(status);
        if (!selectedCampaignId) setSelectedCampaignId(status.campaign_id);
      }
    });

    apiClient.listLogs({ campaignId: selectedCampaignId || undefined, limit: 150 }).then(setLogs);
  }, [selectedCampaignId]);

  // Subscribe to real-time events from Electron main process
  useEffect(() => {
    const unsubProgress = apiClient.onCampaignProgress((data: CampaignProgress) => {
      setProgress(data);
    });

    const unsubLog = apiClient.onCampaignLog((newLog: SendLog) => {
      setLogs(prev => [newLog, ...prev.slice(0, 400)]);
    });

    const unsubStatus = apiClient.onCampaignStatusChanged((data: { campaign_id: string; status: any }) => {
      setProgress(prev => prev ? { ...prev, status: data.status } : null);
      if (data.status === 'completed') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    });

    return () => {
      unsubProgress();
      unsubLog();
      unsubStatus();
    };
  }, []);

  const handlePause = async () => {
    setIsProcessingAction(true);
    await apiClient.pauseCampaign();
    setIsProcessingAction(false);
  };

  const handleResume = async () => {
    setIsProcessingAction(true);
    await apiClient.resumeCampaign();
    setIsProcessingAction(false);
  };

  const handleStop = async () => {
    if (window.confirm('Are you sure you want to stop the sequence? Unsent contacts will remain in queue.')) {
      setIsProcessingAction(true);
      await apiClient.stopCampaign();
      setIsProcessingAction(false);
    }
  };

  const handleStartSelected = async () => {
    if (!selectedCampaignId) return;
    setIsProcessingAction(true);
    await apiClient.startCampaign(selectedCampaignId);
    setIsProcessingAction(false);
  };

  const handleClearLogs = async () => {
    await apiClient.clearLogs(selectedCampaignId);
    setLogs([]);
  };

  const total = progress?.total || 0;
  const sent = progress?.sent || 0;
  const failed = progress?.failed || 0;
  const pending = progress?.pending || 0;
  const progressPercent = total > 0 ? Math.min(100, Math.round((sent / total) * 100)) : 0;
  const isRunning = progress?.status === 'running';
  const isPaused = progress?.status === 'paused';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Campaign Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Live Transmission Console</h1>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1.5 ${
              isRunning ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
              isPaused ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
              'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                isRunning ? 'bg-emerald-400 animate-pulse' :
                isPaused ? 'bg-amber-400' : 'bg-slate-500'
              }`} />
              {progress?.status ? progress.status.toUpperCase() : 'IDLE'}
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Real-time telemetry, burst tracking, organic micro-jitter status, and reactive error failover logs.
          </p>
        </div>

        {/* Campaign Switcher & Control Buttons */}
        <div className="flex items-center gap-3">
          {campaigns.length > 0 && (
            <select
              value={selectedCampaignId}
              onChange={e => setSelectedCampaignId(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
            >
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.status})
                </option>
              ))}
            </select>
          )}

          {/* Action Buttons */}
          {isRunning ? (
            <button
              onClick={handlePause}
              disabled={isProcessingAction}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/20 transition-all cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              Pause Sequence
            </button>
          ) : isPaused ? (
            <button
              onClick={handleResume}
              disabled={isProcessingAction}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Resume Sequence
            </button>
          ) : (
            selectedCampaignId && (
              <button
                onClick={handleStartSelected}
                disabled={isProcessingAction}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Start Dispatch
              </button>
            )
          )}

          {(isRunning || isPaused) && (
            <button
              onClick={handleStop}
              disabled={isProcessingAction}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 border border-slate-800 text-xs font-semibold transition-all cursor-pointer"
              title="Abort campaign"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sent Card */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Delivered (250 OK)</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-extrabold text-emerald-400 font-mono">{sent}</span>
              <span className="text-xs text-slate-500">/ {total}</span>
            </div>
          </div>
        </div>

        {/* Failed / Bounced Card */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Bounces & Errors</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-extrabold text-rose-400 font-mono">{failed}</span>
              <span className="text-xs text-slate-500">failed</span>
            </div>
          </div>
        </div>

        {/* Remaining in Queue */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Remaining Queue</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-extrabold text-amber-300 font-mono">{pending}</span>
              <span className="text-xs text-slate-500">pending</span>
            </div>
          </div>
        </div>

        {/* Active Mailbox & Burst */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <span className="text-xs text-slate-400 font-medium">Active Inbox Relay</span>
            <p className="text-xs font-bold text-white truncate max-w-[150px]" title={progress?.active_mailbox_email || 'None'}>
              {progress?.active_mailbox_email || 'Pool Idle'}
            </p>
            {progress?.burst_ceiling ? (
              <span className="text-[10px] text-cyan-400 font-mono block">
                Burst: {progress.current_burst}/{progress.burst_ceiling}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Progress & Current Dispatch Live Strip */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-white">Overall Campaign Progress</span>
          </div>
          <span className="font-mono font-bold text-slate-300">
            {progressPercent}% Complete ({sent}/{total})
          </span>
        </div>

        {/* Master Progress Bar */}
        <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Real-time Pacing Status Ticker */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
            <span>Current State:</span>
            <span className="font-mono text-cyan-300 font-semibold">
              {progress?.pacing_status || 'Engine standing by'}
            </span>
          </div>

          {progress?.current_recipient && (
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>Target:</span>
              <span className="font-mono text-white font-medium">
                {progress.current_recipient}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Live Terminal Log Stream */}
      <TerminalLog
        logs={logs}
        onClear={handleClearLogs}
      />
    </div>
  );
};
