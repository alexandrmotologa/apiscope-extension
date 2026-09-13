import React, { useState } from 'react';
import { NetworkRequest, ActiveTab } from '../types/index.js';
import { MethodBadge } from './MethodBadge.js';
import { SecurityBadge } from './SecurityBadge.js';
import { HeaderBreakdown } from './HeaderBreakdown.js';
import { PayloadInspector } from './PayloadInspector.js';
import { SecurityAuditCard } from './SecurityAuditCard.js';
import { GraphQLInspector } from './GraphQLInspector.js';
import { ReplaySimulator } from './ReplaySimulator.js';
import { ExportDropdown } from './ExportDropdown.js';
import {
  Clock,
  Shield,
  Layers,
  Code,
  FileJson,
  RotateCw,
  Share2,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

interface RequestDetailProps {
  request: NetworkRequest | null;
  allRequests?: NetworkRequest[];
}

export const RequestDetail: React.FC<RequestDetailProps> = ({
  request,
  allRequests = [],
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!request) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 font-mono text-xs bg-slate-950">
        <Layers className="w-10 h-10 mb-3 text-slate-700" />
        <p className="font-semibold text-slate-400">No Request Selected</p>
        <p className="text-2xs text-slate-600 mt-1 max-w-xs">
          Select a captured API call from the left list to inspect telemetry, headers, and security audit details.
        </p>
      </div>
    );
  }

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(request.url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (status >= 300 && status < 400) return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
    if (status >= 400 && status < 500) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    if (status >= 500) return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    return 'text-slate-400 bg-slate-800 border-slate-700';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 font-mono text-xs overflow-hidden">
      {/* Top Banner: URL, Method, Status, Latency */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <MethodBadge
              method={request.method}
              isGraphQL={request.graphql?.isGraphQL}
            />
            <span
              className={`px-2 py-0.5 rounded border text-xs font-bold ${getStatusColor(
                request.status
              )}`}
            >
              {request.status} {request.statusText}
            </span>
            <div className="truncate flex-1 font-mono text-xs text-slate-200" title={request.url}>
              {request.url}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyUrl}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-2xs transition-colors flex items-center gap-1"
              title="Copy URL"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 text-2xs">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span className="text-2xs">URL</span>
                </>
              )}
            </button>

            <a
              href={request.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-2xs transition-colors"
              title="Open URL in browser tab"
            >
              <ExternalLink className="w-3 h-3" />
            </a>

            {request.securityAudit && (
              <SecurityBadge
                grade={request.securityAudit.grade}
                score={request.securityAudit.score}
                showScore={true}
              />
            )}
          </div>
        </div>

        {/* Sub-bar: timing & metadata */}
        <div className="flex items-center gap-4 text-2xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-indigo-400" />
            <span>Duration: {request.durationMs}ms</span>
          </span>
          <span>Time: {request.timestamp}</span>
          <span>Type: {request.type}</span>
          {request.sizeBytes && <span>Size: {request.sizeBytes} bytes</span>}
          {request.initiator && (
            <span className="truncate max-w-xs text-slate-500">
              Initiator: {request.initiator}
            </span>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="px-3 bg-slate-900/40 border-b border-slate-800 flex items-center gap-1 text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-2 border-b-2 font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('headers')}
          className={`px-3 py-2 border-b-2 font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'headers'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Headers</span>
        </button>

        <button
          onClick={() => setActiveTab('payload')}
          className={`px-3 py-2 border-b-2 font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'payload'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileJson className="w-3.5 h-3.5" />
          <span>Payload</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-3 py-2 border-b-2 font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'security'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>Security Audit</span>
          {request.securityAudit && (
            <span className="text-2xs px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold">
              {request.securityAudit.grade}
            </span>
          )}
        </button>

        {request.graphql?.isGraphQL && (
          <button
            onClick={() => setActiveTab('graphql')}
            className={`px-3 py-2 border-b-2 font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'graphql'
                ? 'border-fuchsia-500 text-fuchsia-300'
                : 'border-transparent text-fuchsia-400/80 hover:text-fuchsia-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" />
            <span>GraphQL</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('replay')}
          className={`px-3 py-2 border-b-2 font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'replay'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Tamper & Replay</span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`px-3 py-2 border-b-2 font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'export'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>

      {/* Tab Body */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-4 font-mono text-xs">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
                <span className="text-2xs text-slate-500 uppercase font-semibold">Response Status</span>
                <div className="text-base font-bold text-slate-100 mt-1">
                  {request.status} {request.statusText}
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
                <span className="text-2xs text-slate-500 uppercase font-semibold">Round-Trip Latency</span>
                <div className="text-base font-bold text-slate-100 mt-1">
                  {request.durationMs} ms
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
                <span className="text-2xs text-slate-500 uppercase font-semibold">Security Grade</span>
                <div className="mt-1">
                  <SecurityBadge
                    grade={request.securityAudit?.grade}
                    score={request.securityAudit?.score}
                    showScore={true}
                  />
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
                <span className="text-2xs text-slate-500 uppercase font-semibold">Payload Size</span>
                <div className="text-base font-bold text-slate-100 mt-1">
                  {request.sizeBytes ? `${request.sizeBytes} B` : 'Streaming'}
                </div>
              </div>
            </div>

            {/* URL Breakdown */}
            <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/40">
              <span className="text-2xs text-slate-400 uppercase font-semibold block mb-1">
                Endpoint Target
              </span>
              <div className="text-slate-200 break-all select-text font-mono text-xs">
                {request.url}
              </div>
            </div>

            {/* Quick Snippet Preview */}
            <div className="flex flex-col gap-2">
              <span className="text-2xs text-slate-400 uppercase font-semibold">
                Quick cURL Preview
              </span>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-2xs text-emerald-400/90 font-mono whitespace-pre-wrap select-text max-h-36 overflow-auto">
                curl -X {request.method} '{request.url}'
              </div>
            </div>
          </div>
        )}

        {activeTab === 'headers' && (
          <HeaderBreakdown
            requestHeaders={request.requestHeaders}
            responseHeaders={request.responseHeaders}
          />
        )}

        {activeTab === 'payload' && (
          <div className="flex flex-col gap-4">
            <PayloadInspector
              payload={request.requestBody}
              title="Outgoing Request Body"
              emptyMessage="No body payload was sent with this request (standard for GET/HEAD queries)."
            />
            <PayloadInspector
              payload={request.responseBody}
              title="Incoming Response Body"
              emptyMessage="No response body recorded or response was transferred via binary streaming."
            />
          </div>
        )}

        {activeTab === 'security' && (
          <SecurityAuditCard audit={request.securityAudit} />
        )}

        {activeTab === 'graphql' && (
          <GraphQLInspector graphql={request.graphql} />
        )}

        {activeTab === 'replay' && (
          <ReplaySimulator request={request} />
        )}

        {activeTab === 'export' && (
          <ExportDropdown request={request} allRequests={allRequests} />
        )}
      </div>
    </div>
  );
};
