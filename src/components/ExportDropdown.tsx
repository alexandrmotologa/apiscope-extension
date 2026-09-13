import React, { useState } from 'react';
import { NetworkRequest } from '../types/index.js';
import { generateCurlCommand } from '../exporters/curlExporter.js';
import { generatePythonRequests, generateFetchCode, generateHttpieCommand } from '../exporters/codeGenerators.js';
import {
  exportToRestPocketRequest,
  exportToRestPocketCollection,
  generateRestPocketDeepLink,
} from '../exporters/restpocketExporter.js';
import {
  Terminal,
  FileCode,
  Globe,
  Zap,
  Download,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

interface ExportDropdownProps {
  request: NetworkRequest;
  allRequests?: NetworkRequest[];
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
  request,
  allRequests = [],
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadCollection = () => {
    const collection = exportToRestPocketCollection(
      allRequests.length > 0 ? allRequests : [request]
    );
    const blob = new Blob([JSON.stringify(collection, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apiscope_collection_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const curl = generateCurlCommand(request);
  const python = generatePythonRequests(request);
  const fetchCode = generateFetchCode(request);
  const httpie = generateHttpieCommand(request);
  const restpocketJson = JSON.stringify(exportToRestPocketRequest(request), null, 2);
  const restpocketLink = generateRestPocketDeepLink(request);

  return (
    <div className="flex flex-col gap-4 font-mono text-xs">
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
        <span className="font-bold text-slate-200">Export & Replay Integration</span>
        <p className="text-2xs text-slate-400 mt-0.5">
          Generate production-ready code snippets and replay captured API traffic in external tools.
        </p>
      </div>

      {/* RestPocket Fast Action Card */}
      <div className="p-3.5 rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Zap className="w-4 h-4 fill-amber-400" />
          </div>
          <div>
            <div className="font-bold text-slate-100 flex items-center gap-1.5">
              <span>RestPocket Interoperability</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-semibold">
                Instant Replay
              </span>
            </div>
            <p className="text-2xs text-slate-400 mt-0.5">
              Replay this request directly in your local RestPocket instance or save to collection.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <a
            href={restpocketLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded text-xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in RestPocket</span>
          </a>

          <button
            onClick={() => copyToClipboard(restpocketJson, 'restpocket')}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
          >
            {copiedKey === 'restpocket' ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>JSON</span>
          </button>

          <button
            onClick={handleDownloadCollection}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
            title="Download full session as RestPocket Collection JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Collection</span>
          </button>
        </div>
      </div>

      {/* Snippet Tabs / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* cURL */}
        <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
          <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>cURL Command</span>
            </div>
            <button
              onClick={() => copyToClipboard(curl, 'curl')}
              className="flex items-center gap-1 text-2xs px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
            >
              {copiedKey === 'curl' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'curl' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3 text-2xs text-emerald-300/90 overflow-auto max-h-40 whitespace-pre-wrap leading-relaxed">
            <code>{curl}</code>
          </pre>
        </div>

        {/* Python Requests */}
        <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
          <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <FileCode className="w-3.5 h-3.5 text-sky-400" />
              <span>Python (requests)</span>
            </div>
            <button
              onClick={() => copyToClipboard(python, 'python')}
              className="flex items-center gap-1 text-2xs px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
            >
              {copiedKey === 'python' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'python' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3 text-2xs text-sky-300/90 overflow-auto max-h-40 whitespace-pre-wrap leading-relaxed">
            <code>{python}</code>
          </pre>
        </div>

        {/* JavaScript Fetch */}
        <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
          <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>Node / Browser (fetch)</span>
            </div>
            <button
              onClick={() => copyToClipboard(fetchCode, 'fetch')}
              className="flex items-center gap-1 text-2xs px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
            >
              {copiedKey === 'fetch' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'fetch' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3 text-2xs text-amber-300/90 overflow-auto max-h-40 whitespace-pre-wrap leading-relaxed">
            <code>{fetchCode}</code>
          </pre>
        </div>

        {/* HTTPie */}
        <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
          <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              <span>HTTPie CLI</span>
            </div>
            <button
              onClick={() => copyToClipboard(httpie, 'httpie')}
              className="flex items-center gap-1 text-2xs px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
            >
              {copiedKey === 'httpie' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'httpie' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3 text-2xs text-purple-300/90 overflow-auto max-h-40 whitespace-pre-wrap leading-relaxed">
            <code>{httpie}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
