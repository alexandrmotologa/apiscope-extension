import React, { useState } from 'react';
import { Copy, Check, Code, FileText, Search, Braces, Sparkles } from 'lucide-react';
import { generateTypeScriptInterface, generateZodSchema } from '../exporters/typeGenerator.js';

interface PayloadInspectorProps {
  payload?: string | null;
  title?: string;
  emptyMessage?: string;
}

export type PayloadFormatMode = 'pretty' | 'raw' | 'typescript' | 'zod';

export const PayloadInspector: React.FC<PayloadInspectorProps> = ({
  payload,
  title = 'Payload Content',
  emptyMessage = 'No payload content present in this request.',
}) => {
  const [copied, setCopied] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [formatMode, setFormatMode] = useState<PayloadFormatMode>('pretty');

  if (!payload || payload.trim() === '') {
    return (
      <div className="p-8 text-center border border-slate-800 rounded-lg bg-slate-900/40 text-slate-500 font-mono text-xs">
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
        {emptyMessage}
      </div>
    );
  }

  // Check if JSON
  let formatted = payload;
  let isJson = false;
  try {
    const parsed = JSON.parse(payload);
    formatted = JSON.stringify(parsed, null, 2);
    isJson = true;
  } catch {
    formatted = payload;
    isJson = false;
  }

  let displayText = payload;
  if (formatMode === 'pretty') {
    displayText = formatted;
  } else if (formatMode === 'raw') {
    displayText = payload;
  } else if (formatMode === 'typescript') {
    displayText = isJson ? generateTypeScriptInterface(payload) : '// Payload is not valid JSON, cannot generate TypeScript interface.';
  } else if (formatMode === 'zod') {
    displayText = isJson ? generateZodSchema(payload) : '// Payload is not valid JSON, cannot generate Zod schema.';
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = displayText.split('\n');
  const filteredLines = searchFilter
    ? lines.filter((line) => line.toLowerCase().includes(searchFilter.toLowerCase()))
    : lines;

  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950 font-mono text-xs shadow-sm">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-900 border-b border-slate-800 text-slate-400">
        <div className="flex items-center gap-2">
          <Code className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold text-slate-200">{title}</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
            {isJson ? 'JSON' : 'TEXT'}
          </span>
          <span className="text-[11px] text-slate-500">
            {new Blob([payload]).size} bytes • {lines.length} lines
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isJson && (
            <div className="flex border border-slate-700 rounded overflow-hidden text-[11px]">
              <button
                onClick={() => setFormatMode('pretty')}
                className={`px-2 py-0.5 transition-colors ${
                  formatMode === 'pretty'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Pretty
              </button>
              <button
                onClick={() => setFormatMode('raw')}
                className={`px-2 py-0.5 transition-colors ${
                  formatMode === 'raw'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Raw
              </button>
              <button
                onClick={() => setFormatMode('typescript')}
                className={`px-2 py-0.5 flex items-center gap-1 transition-colors ${
                  formatMode === 'typescript'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Generate TypeScript Interface"
              >
                <Braces className="w-3 h-3" />
                TS Types
              </button>
              <button
                onClick={() => setFormatMode('zod')}
                className={`px-2 py-0.5 flex items-center gap-1 transition-colors ${
                  formatMode === 'zod'
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="Generate Zod Validation Schema"
              >
                <Sparkles className="w-3 h-3" />
                Zod
              </button>
            </div>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
            title="Copy content to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="px-3 py-1.5 bg-slate-900/60 border-b border-slate-800 flex items-center gap-2">
        <Search className="w-3 h-3 text-slate-500" />
        <input
          type="text"
          placeholder={`Filter ${formatMode} lines...`}
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="bg-transparent text-slate-200 placeholder-slate-600 outline-none w-full text-xs font-mono"
        />
        {searchFilter && (
          <span className="text-[11px] text-slate-500 whitespace-nowrap">
            {filteredLines.length} / {lines.length} lines
          </span>
        )}
      </div>

      {/* Payload content */}
      <div className="p-3 max-h-[360px] overflow-auto select-text text-slate-300 leading-relaxed font-mono">
        <pre className="whitespace-pre">
          {filteredLines.map((line, idx) => (
            <div key={idx} className="flex hover:bg-slate-900/60 rounded px-1 -mx-1">
              <span className="text-slate-600 select-none w-8 shrink-0 text-right pr-3">
                {idx + 1}
              </span>
              <span className={formatMode === 'typescript' ? 'text-blue-300' : formatMode === 'zod' ? 'text-purple-300' : 'text-indigo-200/90'}>
                {line}
              </span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
};
