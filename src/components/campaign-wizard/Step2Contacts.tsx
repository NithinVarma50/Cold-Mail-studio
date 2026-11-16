import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  ArrowLeft,
  Trash2,
  Table,
  Check
} from 'lucide-react';
import { parseFile } from '../../utils/csvParser';
import { CSVParseResult } from '../../types';

interface Step2ContactsProps {
  parsedData: CSVParseResult | null;
  setParsedData: React.Dispatch<React.SetStateAction<CSVParseResult | null>>;
  mapping: { email: string; first_name?: string; last_name?: string; company?: string };
  setMapping: React.Dispatch<React.SetStateAction<{ email: string; first_name?: string; last_name?: string; company?: string }>>;
  onNext: () => void;
  onBack: () => void;
}

export const Step2Contacts: React.FC<Step2ContactsProps> = ({
  parsedData,
  setParsedData,
  mapping,
  setMapping,
  onNext,
  onBack
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const res = await parseFile(file);
      setParsedData(res);
      setMapping(res.detectedMapping);
    } catch (err) {
      alert('Failed to parse file. Please verify CSV or Excel format.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const isValid = Boolean(parsedData && mapping.email && parsedData.validRows > 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Step 2: Import Contacts & Map Columns</h2>
        <p className="text-xs text-slate-400">
          Upload your contact list via CSV or Excel (.xlsx). Instant RFC 5322 validation flags syntax errors and duplicates automatically.
        </p>
      </div>

      {/* Upload Zone */}
      {!parsedData ? (
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`glass-panel p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center text-center ${
            isDragging 
              ? 'border-indigo-500 bg-indigo-500/10' 
              : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            accept=".csv, .xlsx, .xls"
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">
            {isProcessing ? 'Validating and Parsing Columns...' : 'Drag & Drop CSV or Excel File Here'}
          </h3>
          <p className="text-xs text-slate-400 mb-4 max-w-sm">
            Supports CSV, XLSX, and XLS with automated header recognition and syntax auditing.
          </p>
          <span className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors">
            Browse Local File
          </span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File summary and audit pills */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Import File Processed</h4>
                <p className="text-xs text-slate-400">{parsedData.headers.length} columns detected</p>
              </div>
            </div>

            <button
              onClick={() => { setParsedData(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove & Re-upload
            </button>
          </div>

          {/* Validation Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Total Rows</span>
              <span className="text-lg font-extrabold text-white font-mono">{parsedData.totalRows}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20">
              <span className="text-[10px] text-emerald-400 block uppercase tracking-wider font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Valid RFC 5322
              </span>
              <span className="text-lg font-extrabold text-emerald-300 font-mono">{parsedData.validRows}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/20">
              <span className="text-[10px] text-amber-400 block uppercase tracking-wider font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Duplicates Flagged
              </span>
              <span className="text-lg font-extrabold text-amber-300 font-mono">{parsedData.duplicateRows}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/20">
              <span className="text-[10px] text-rose-400 block uppercase tracking-wider font-semibold flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Invalid Emails
              </span>
              <span className="text-lg font-extrabold text-rose-300 font-mono">{parsedData.invalidRows}</span>
            </div>
          </div>

          {/* Column Mapping Selectors */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-200">Map CSV Columns to Recipient Fields</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <select
                  value={mapping.email}
                  onChange={e => setMapping({ ...mapping, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select column...</option>
                  {parsedData.headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  First Name
                </label>
                <select
                  value={mapping.first_name || ''}
                  onChange={e => setMapping({ ...mapping, first_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">(None)</option>
                  {parsedData.headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Last Name
                </label>
                <select
                  value={mapping.last_name || ''}
                  onChange={e => setMapping({ ...mapping, last_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">(None)</option>
                  {parsedData.headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Company Name
                </label>
                <select
                  value={mapping.company || ''}
                  onChange={e => setMapping({ ...mapping, company: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">(None)</option>
                  {parsedData.headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table Preview */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-2">
                <Table className="w-3.5 h-3.5 text-indigo-400" />
                Raw Data Sample Preview (First 8 Rows)
              </span>
              <span className="text-slate-500">Only valid rows will be queued for dispatch</span>
            </div>

            <div className="overflow-x-auto max-h-60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    {parsedData.headers.map(h => (
                      <th key={h} className="px-4 py-2.5 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {parsedData.previewData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      {parsedData.headers.map(h => (
                        <td key={h} className="px-4 py-2 whitespace-nowrap max-w-xs truncate font-mono text-[11px]">
                          {row[h] || <span className="text-slate-600 italic">null</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
          disabled={!isValid}
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Continue to Compose Email</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
