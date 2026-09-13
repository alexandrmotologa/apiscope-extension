import React, { useState } from 'react';
import { NetworkRequest } from '../types/index.js';
import { generateCurlCommand } from '../exporters/curlExporter.js';
import { generatePythonRequests, generateFetchCode, generateHttpieCommand } from '../exporters/codeGenerators.js';
import {
  exportToRestPocketRequest,
  exportToRestPocketCollection,
  generateRestPocketDeepLink,
} from '../exporters/restpocketExporter.js';
import { exportToPostmanCollection, exportToOpenApiSpec } from '../exporters/postmanOpenapiExporter.js';
import { exportToHar } from '../exporters/harExporter.js';
import {
  Terminal,
  FileCode,
  Globe,
  Zap,
  Download,
  Copy,
  Check,
  ExternalLink,
  Package,
  Layers,
  FileText,
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

  const downloadFile = (content: string, filename: string, type = 'application/json') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadRestPocket = () => {
    const collection = exportToRestPocketCollection(
      allRequests.length > 0 ? allRequests : [request]
    );
    downloadFile(JSON.stringify(collection, null, 2), `apiscope_restpocket_${Date.now()}.json`);
  };

  const handleDownloadPostman = () => {
    const postmanJson = exportToPostmanCollection(
      allRequests.length > 0 ? allRequests : [request],
      'APIScope Captured Requests'
    );
    downloadFile(postmanJson, `apiscope_postman_collection_${Date.now()}.json`);
  };

  const handleDownloadOpenApi = () => {
    const openapiJson = exportToOpenApiSpec(
      allRequests.length > 0 ? allRequests : [request],
      'APIScope Inferred API Specification'
    );
    downloadFile(openapiJson, `apiscope_openapi_spec_${Date.now()}.json`);
  };

  const handleDownloadHar = () => {
    const harObj = exportToHar(allRequests.length > 0 ? allRequests : [request]);
    downloadFile(JSON.stringify(harObj, null, 2), `apiscope_traffic_${Date.now()}.har`);
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
        <span className="font-bold text-slate-200">Export & Tool Interoperability</span>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Export captured traffic to industry standards: Postman, OpenAPI, HAR 1.2, RestPocket, or runnable code snippets.
        </p>
      </div>

      {/* Top Action Cards: Postman, OpenAPI, HAR, RestPocket */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Postman Collection Card */}
        <div className="p-3 bg-slate-950 border border-orange-500/30 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-200 text-xs">Postman Collection</div>
              <div className="text-[10px] text-slate-400">Format v2.1.0 schema</div>
            </div>
          </div>
          <button
            onClick={handleDownloadPostman}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs transition-colors font-medium"
          >
            <Download className="w-3 h-3" />
            <span>Export</span>
          </button>
        </div>

        {/* OpenAPI 3.0 Card */}
        <div className="p-3 bg-slate-950 border border-emerald-500/30 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-200 text-xs">OpenAPI 3.0 Spec</div>
              <div className="text-[10px] text-slate-400">Inferred Swagger JSON</div>
            </div>
          </div>
          <button
            onClick={handleDownloadOpenApi}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs transition-colors font-medium"
          >
            <Download className="w-3 h-3" />
            <span>Export</span>
          </button>
        </div>

        {/* HAR 1.2 Card */}
        <div className="p-3 bg-slate-950 border border-cyan-500/30 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-200 text-xs">HTTP Archive (HAR)</div>
              <div className="text-[10px] text-slate-400">Standard HAR 1.2 log</div>
            </div>
          </div>
          <button
            onClick={handleDownloadHar}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs transition-colors font-medium"
          >
            <Download className="w-3 h-3" />
            <span>Export</span>
          </button>
        </div>

        {/* RestPocket Card */}
        <div className="p-3 bg-slate-950 border border-amber-500/30 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <div className="font-bold text-slate-200 text-xs">RestPocket</div>
              <div className="text-[10px] text-slate-400">Deep link & collection</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <a
              href={restpocketLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded transition-colors"
              title="Open direct in RestPocket"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => copyToClipboard(restpocketJson, 'restpocket')}
              className="flex items-center gap-1 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
              title="Copy RestPocket JSON payload"
            >
              {copiedKey === 'restpocket' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>JSON</span>
            </button>
            <button
              onClick={handleDownloadRestPocket}
              className="flex items-center gap-1 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
              title="Download collection JSON"
            >
              <Download className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Code Snippets Section */}
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
              className="flex items-center gap-1 text-[11px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
            >
              {copiedKey === 'curl' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'curl' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3 text-[11px] text-emerald-300/90 overflow-auto max-h-40 whitespace-pre-wrap leading-relaxed font-mono">
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
              className="flex items-center gap-1 text-[11px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
            >
              {copiedKey === 'python' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'python' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3 text-[11px] text-sky-300/90 overflow-auto max-h-40 whitespace-pre-wrap leading-relaxed font-mono">
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
              className="flex items-center gap-1 text-[11px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
            >
              {copiedKey === 'fetch' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'fetch' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3 text-[11px] text-amber-300/90 overflow-auto max-h-40 whitespace-pre-wrap leading-relaxed font-mono">
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
              className="flex items-center gap-1 text-[11px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
            >
              {copiedKey === 'httpie' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedKey === 'httpie' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3 text-[11px] text-purple-300/90 overflow-auto max-h-40 whitespace-pre-wrap leading-relaxed font-mono">
            <code>{httpie}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
