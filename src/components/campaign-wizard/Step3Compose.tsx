import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  ArrowLeft, 
  User, 
  Building2, 
  Mail,
  Copy,
  Check
} from 'lucide-react';
import { interpolateTemplate } from '../../utils/template';
import { CSVParseResult } from '../../types';

interface Step3ComposeProps {
  subject: string;
  setSubject: (subject: string) => void;
  body: string;
  setBody: (body: string) => void;
  parsedData: CSVParseResult | null;
  mapping: { email: string; first_name?: string; last_name?: string; company?: string };
  onNext: () => void;
  onBack: () => void;
}

export const Step3Compose: React.FC<Step3ComposeProps> = ({
  subject,
  setSubject,
  body,
  setBody,
  parsedData,
  mapping,
  onNext,
  onBack
}) => {
  const [previewIndex, setPreviewIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Available dynamic variables based on mapped columns
  const availableVariables = [
    { label: 'First Name', tag: '{{first_name | there}}', desc: 'Falls back to "there"' },
    { label: 'Last Name', tag: '{{last_name}}', desc: 'Recipient last name' },
    { label: 'Company', tag: '{{company | your team}}', desc: 'Falls back to "your team"' },
    { label: 'Email', tag: '{{email}}', desc: 'Recipient email address' }
  ];

  // Add custom headers from CSV
  if (parsedData?.headers) {
    for (const h of parsedData.headers) {
      if (![mapping.email, mapping.first_name, mapping.last_name, mapping.company].includes(h)) {
        availableVariables.push({
          label: h,
          tag: `{{${h}}}`,
          desc: `Custom column "${h}"`
        });
      }
    }
  }

  const insertVariable = (tag: string) => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) {
      setBody(body + tag);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newBody = body.substring(0, start) + tag + body.substring(end);
    setBody(newBody);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  // Get recipient sample for live preview
  const rawPreviewRows = parsedData?.rows || [];
  const totalPreviewRows = rawPreviewRows.length;
  const currentRawRow = rawPreviewRows[previewIndex] || {};

  const currentRecipient = {
    email: mapping.email ? currentRawRow[mapping.email] || 'alex@acme.com' : 'alex@acme.com',
    first_name: mapping.first_name ? currentRawRow[mapping.first_name] : 'Alex',
    last_name: mapping.last_name ? currentRawRow[mapping.last_name] : 'Smith',
    company: mapping.company ? currentRawRow[mapping.company] : 'Acme Corp',
    ...currentRawRow
  };

  const renderedSubject = interpolateTemplate(subject, currentRecipient);
  const renderedBody = interpolateTemplate(body, currentRecipient);

  const isValid = subject.trim().length > 0 && body.trim().length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Step 3: Compose Email & Variable Interpolation</h2>
        <p className="text-xs text-slate-400">
          Craft your cold outreach template with dynamic variables and fallback syntax e.g. <code className="text-indigo-300 font-mono">{"{{first_name | there}}"}</code>. Live side-by-side preview shows actual recipient rendering.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Template Editor */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">Email Template Editor</h3>
            <span className="text-[11px] text-indigo-400 font-medium">Supports Fallback Syntax</span>
          </div>

          {/* Subject Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Subject Line <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Quick question regarding {{company | your company}}"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Dynamic Variable Insertion Helper Chips */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-2">
              Click to insert dynamic variable tag:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {availableVariables.slice(0, 6).map(v => (
                <button
                  key={v.tag}
                  type="button"
                  onClick={() => insertVariable(v.tag)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/60 hover:text-indigo-300 text-[11px] font-mono text-slate-300 transition-all cursor-pointer flex items-center gap-1"
                  title={v.desc}
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  {v.tag}
                </button>
              ))}
            </div>
          </div>

          {/* Email Body Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Body (Plain Text or HTML) <span className="text-red-400">*</span>
            </label>
            <textarea
              ref={bodyTextareaRef}
              rows={11}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder={`Hi {{first_name | there}},\n\nI came across {{company | your team}} and was really impressed by your recent growth...\n\nBest,\n[Your Name]`}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed resize-none"
            />
          </div>
        </div>

        {/* Right Column: Live Recipient Population Preview */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            {/* Live Preview Header & Contact Switcher */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Eye className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Live Recipient Preview</h3>
                  <span className="text-[10px] text-slate-400">Real-time dynamic interpolation</span>
                </div>
              </div>

              {totalPreviewRows > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={previewIndex <= 0}
                    onClick={() => setPreviewIndex(i => Math.max(0, i - 1))}
                    className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-slate-400 px-1">
                    {previewIndex + 1} / {totalPreviewRows}
                  </span>
                  <button
                    type="button"
                    disabled={previewIndex >= totalPreviewRows - 1}
                    onClick={() => setPreviewIndex(i => Math.min(totalPreviewRows - 1, i + 1))}
                    className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Recipient Snapshot Card */}
            <div className="p-3 my-3 rounded-xl bg-slate-950 border border-slate-800 text-xs grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-slate-300 truncate">
                <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate font-mono text-[11px]">{currentRecipient.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 truncate">
                <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">{currentRecipient.first_name || 'N/A'} {currentRecipient.last_name || ''}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 truncate col-span-2">
                <Building2 className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                <span className="truncate">{currentRecipient.company || <span className="text-slate-600 italic">No Company (triggers fallback)</span>}</span>
              </div>
            </div>

            {/* Rendered Email Simulator */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
                <span className="text-slate-500 font-semibold mr-2">Subject:</span>
                <span className="font-bold text-white">
                  {renderedSubject || <span className="text-slate-600 italic">No subject specified</span>}
                </span>
              </div>

              <div className="p-4 text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed min-h-[220px]">
                {renderedBody || <span className="text-slate-600 italic">Write your template body on the left to see live rendering here...</span>}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-[11px] text-indigo-300">
            <strong>Pro Tip:</strong> When a recipient has no company listed, <code className="font-mono text-cyan-300">{"{{company | your team}}"}</code> gracefully renders as "your team" rather than an empty space.
          </div>
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
          disabled={!isValid}
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Continue to Configure Pacing</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
