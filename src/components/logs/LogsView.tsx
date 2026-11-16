import React, { useState, useEffect } from 'react';
import { 
  ScrollText, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Clock,
  Mail,
  Zap
} from 'lucide-react';
import { SendLog, Campaign, LogLevel } from '../../types';
import { apiClient } from '../../utils/apiClient';

export const LogsView: React.FC = () => {
  const [logs, setLogs] = useState<SendLog[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cmps, logList] = await Promise.all([
        apiClient.listCampaigns(),
        apiClient.listLogs({ campaignId: selectedCampaignId || undefined, limit: 300 })
      ]);
      setCampaigns(cmps);
      setLogs(logList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCampaignId]);

  const handleClear = async () => {
    if (window.confirm('Clear all logged records?')) {
      await apiClient.clearLogs(selectedCampaignId || undefined);
      loadData();
    }
  };

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Status', 'Mailbox', 'Recipient', 'Message'];
    const rows = filteredLogs.map(l => [
      new Date(l.timestamp).toISOString(),
      l.status_code,
      l.mailbox_email || l.mailbox_id,
      l.recipient,
      `"${(l.message || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coldmail_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(log => {
    if (statusFilter !== 'ALL' && log.status_code !== statusFilter) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchRecipient = log.recipient.toLowerCase().includes(query);
      const matchMsg = (log.message || '').toLowerCase().includes(query);
      const matchBox = (log.mailbox_email || '').toLowerCase().includes(query);
      if (!matchRecipient && !matchMsg && !matchBox) return false;
    }
    return true;
  });

  const getStatusBadge = (code: LogLevel) => {
    switch (code) {
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> SENT (250 OK)
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" /> FAILED
          </span>
        );
      case 'COOLDOWN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" /> 6H COOLDOWN
          </span>
        );
      case 'BURST':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Zap className="w-3 h-3" /> BURST ROTATION
          </span>
        );
      case 'PACING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Clock className="w-3 h-3" /> PACING JITTER
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            INFO
          </span>
        );
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Transmission Telemetry & Audit Logs</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold font-mono">
              {filteredLogs.length} Records
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Detailed low-level SMTP handshakes, delivery receipts, rate-limit detections, and auto-failover transitions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold transition-all disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            onClick={handleClear}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Clear all records"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search recipient, mailbox, or error..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Campaign & Level Selectors */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Campaign Selector */}
          <select
            value={selectedCampaignId}
            onChange={e => setSelectedCampaignId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">All Campaigns</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer font-mono"
          >
            <option value="ALL">All Event Types</option>
            <option value="SENT">SENT (250 OK)</option>
            <option value="FAILED">FAILED</option>
            <option value="COOLDOWN">6H COOLDOWN</option>
            <option value="BURST">BURST ROTATION</option>
            <option value="PACING">PACING JITTER</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto max-h-[580px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/90 text-slate-400 font-semibold border-b border-slate-800 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Timestamp</th>
                <th className="px-4 py-3 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 whitespace-nowrap">Sender Mailbox</th>
                <th className="px-4 py-3 whitespace-nowrap">Recipient</th>
                <th className="px-4 py-3 whitespace-nowrap">Message / Server Response</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300 font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-sans">
                    No telemetry records match the current filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-2.5 whitespace-nowrap text-slate-500">
                      {new Date(l.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap font-sans">
                      {getStatusBadge(l.status_code)}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-cyan-400">
                      {l.mailbox_email || l.mailbox_id}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-indigo-300">
                      {l.recipient}
                    </td>
                    <td className="px-4 py-2.5 max-w-md truncate text-slate-300" title={l.message || ''}>
                      {l.message || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
