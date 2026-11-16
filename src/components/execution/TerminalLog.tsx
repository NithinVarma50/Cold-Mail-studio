import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal as TerminalIcon, 
  Trash2, 
  Download, 
  ArrowDown, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Info,
  Clock
} from 'lucide-react';
import { SendLog, LogLevel } from '../../types';

interface TerminalLogProps {
  logs: SendLog[];
  onClear: () => void;
}

export const TerminalLog: React.FC<TerminalLogProps> = ({ logs, onClear }) => {
  const [filter, setFilter] = useState<'ALL' | 'SENT' | 'FAILED' | 'BURST' | 'PACING'>('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(log => {
    if (filter === 'ALL') return true;
    if (filter === 'SENT') return log.status_code === 'SENT';
    if (filter === 'FAILED') return log.status_code === 'FAILED' || log.status_code === 'COOLDOWN';
    if (filter === 'BURST') return log.status_code === 'BURST';
    if (filter === 'PACING') return log.status_code === 'PACING';
    return true;
  });

  const getBadgeStyle = (code: LogLevel) => {
    switch (code) {
      case 'SENT':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'FAILED':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'COOLDOWN':
        return 'text-amber-400 bg-amber-500/15 border-amber-500/30 animate-pulse';
      case 'BURST':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'PACING':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'INFO':
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  const handleExport = () => {
    const text = logs.map(l => 
      `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.status_code}] [Mailbox: ${l.mailbox_email || l.mailbox_id}] [To: ${l.recipient}] ${l.message || ''}`
    ).join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coldmail_telemetry_${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="terminal-window rounded-2xl flex flex-col h-[420px] overflow-hidden border border-slate-800">
      {/* Terminal Title Bar */}
      <div className="px-4 py-2.5 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5 ml-2">
            <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
            live_transmission_stream.log
          </span>
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center gap-2 text-xs">
          {/* Level Filter */}
          <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded-lg border border-slate-800 font-mono text-[11px]">
            <Filter className="w-3 h-3 text-slate-500" />
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as any)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer text-[10px]"
            >
              <option value="ALL">All Events ({logs.length})</option>
              <option value="SENT">Sent (250 OK)</option>
              <option value="FAILED">Errors / Cooldowns</option>
              <option value="BURST">Burst Ceilings</option>
              <option value="PACING">Pacing Jitters</option>
            </select>
          </div>

          {/* Auto Scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all flex items-center gap-1 ${
              autoScroll ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle automatic scrolling to latest log"
          >
            <ArrowDown className="w-2.5 h-2.5" />
            Auto-Scroll
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Export raw log text"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Clear */}
          <button
            onClick={onClear}
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Clear terminal logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div 
        ref={scrollRef}
        className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1.5 selection:bg-cyan-500/20"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs">
            <span className="font-mono">-- No transmission telemetry captured yet --</span>
            <span className="text-[11px] text-slate-700 mt-1">Logs will stream here in real-time as the campaign dispatches</span>
          </div>
        ) : (
          filteredLogs.map(log => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString();

            return (
              <div 
                key={log.id} 
                className="flex items-start gap-2.5 py-0.5 leading-relaxed text-[11px] hover:bg-slate-900/40 rounded px-1 -mx-1"
              >
                <span className="text-slate-500 shrink-0 select-none">[{timeStr}]</span>
                
                <span className={`px-1.5 py-0.2 rounded border text-[9px] font-bold shrink-0 ${getBadgeStyle(log.status_code)}`}>
                  {log.status_code}
                </span>

                {log.mailbox_email && (
                  <span className="text-cyan-400/90 shrink-0">
                    [{log.mailbox_email}]
                  </span>
                )}

                {log.recipient && log.recipient !== 'system' && log.recipient !== 'all' && (
                  <span className="text-indigo-300 shrink-0">
                    -&gt; {log.recipient}:
                  </span>
                )}

                <span className={`break-all ${
                  log.status_code === 'SENT' ? 'text-emerald-300' :
                  log.status_code === 'FAILED' ? 'text-rose-300 font-semibold' :
                  log.status_code === 'COOLDOWN' ? 'text-amber-300 font-semibold' :
                  log.status_code === 'BURST' ? 'text-cyan-300' :
                  log.status_code === 'PACING' ? 'text-purple-300' : 'text-slate-300'
                }`}>
                  {log.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
