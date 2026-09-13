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
import { maskSensitiveValue } from '../audit/piiScanner.js';
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
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
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
  const [maskSensitive, setMaskSensitive] = useState(false);
  const [copiedJwtIndex, setCopiedJwtIndex] = useState<number | null>(null);

  if (!request) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 font-mono text-xs bg-slate-950">
        <Layers className="w-10 h-10 mb-3 text-slate-700" />
        <p className="font-semibold text-slate-400">No Request Selected</p>
        <p className="text-[11px] text-slate-600 mt-1 max-w-xs">
          Select a captured API call from the list to inspect telemetry, headers, and security audit details.
        </p>
      </div>
    );
  }

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(request.url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyJwt = (rawToken: string, index: number) => {
    navigator.clipboard.writeText(rawToken);
    setCopiedJwtIndex(index);
    setTimeout(() => setCopiedJwtIndex(null), 2000);
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (status >= 300 && status < 400) return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
    if (status >= 400 && status < 500) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    if (status >= 500) return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    return 'text-slate-400 bg-slate-800 border-slate-700';
  };

  const displayUrl = maskSensitive
    ? request.url.replace(/([?&](?:token|key|secret|password)=)[^&]+/gi, '$1••••••••')
    : request.url;

  // Mask headers if maskSensitive is true
  const processedRequestHeaders = maskSensitive
    ? Object.fromEntries(Object.entries(request.requestHeaders).map(([k, v]) => [k, maskSensitiveValue(k, v)]))
    : request.requestHeaders;

  const processedResponseHeaders = maskSensitive
    ? Object.fromEntries(Object.entries(request.responseHeaders).map(([k, v]) => [k, maskSensitiveValue(k, v)]))
    : request.responseHeaders;

  const hasJwt = request.jwtTokens && request.jwtTokens.length > 0;
  const hasPii = request.piiWarnings && request.piiWarnings.length > 0;

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
              {displayUrl}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Sensitive Data Masking Toggle */}
            <button
              onClick={() => setMaskSensitive(!maskSensitive)}
              className={`p-1.5 rounded text-[11px] transition-colors flex items-center gap-1.5 border ${
                maskSensitive
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
              }`}
              title={maskSensitive ? 'Sensitive values masked (Click to unmask)' : 'Mask sensitive values (API keys, JWT, passwords)'}
            >
              {maskSensitive ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{maskSensitive ? 'Masked' : 'Mask Secrets'}</span>
            </button>

            <button
              onClick={handleCopyUrl}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors flex items-center gap-1"
              title="Copy URL"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 text-[11px]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span className="text-[11px]">URL</span>
                </>
              )}
            </button>

            <a
              href={request.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
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
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-indigo-400" />
            <span>Duration: {request.durationMs}ms</span>
          </span>
          <span>Time: {request.timestamp}</span>
          <span>Type: {request.type}</span>
          {request.sizeBytes && <span>Size: {request.sizeBytes} B</span>}
          {request.initiator && (
            <span className="truncate max-w-xs text-slate-500">
              Initiator: {request.initiator}
            </span>
          )}
        </div>
      </div>

      {/* PII Alert Banner if present */}
      {hasPii && (
        <div className="px-4 py-2 bg-rose-950/40 border-b border-rose-800/50 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-rose-300 min-w-0">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-semibold text-rose-200">Security Warning:</span>
            <span className="truncate text-rose-300/90">
              {request.piiWarnings![0].message}
            </span>
          </div>
          <button
            onClick={() => setActiveTab('security')}
            className="text-[11px] text-rose-300 underline hover:text-white shrink-0 font-medium"
          >
            Inspect ({request.piiWarnings!.length} alerts)
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="px-3 bg-slate-900/40 border-b border-slate-800 flex items-center gap-1 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-2 border-b-2 font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
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
          className={`px-3 py-2 border-b-2 font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
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
          className={`px-3 py-2 border-b-2 font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
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
          className={`px-3 py-2 border-b-2 font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'security'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>Security Audit</span>
          {request.securityAudit && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
              {request.securityAudit.grade}
            </span>
          )}
        </button>

        {hasJwt && (
          <button
            onClick={() => setActiveTab('jwt')}
            className={`px-3 py-2 border-b-2 font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'jwt'
                ? 'border-emerald-500 text-emerald-300'
                : 'border-transparent text-emerald-400/80 hover:text-emerald-300'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-emerald-400" />
            <span>JWT & Auth</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              {request.jwtTokens!.length}
            </span>
          </button>
        )}

        {request.graphql?.isGraphQL && (
          <button
            onClick={() => setActiveTab('graphql')}
            className={`px-3 py-2 border-b-2 font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
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
          className={`px-3 py-2 border-b-2 font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
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
          className={`px-3 py-2 border-b-2 font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
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
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Response Status</span>
                <div className="text-base font-bold text-slate-100 mt-1">
                  {request.status} {request.statusText}
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Round-Trip Latency</span>
                <div className="text-base font-bold text-slate-100 mt-1">
                  {request.durationMs} ms
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Security Grade</span>
                <div className="mt-1">
                  <SecurityBadge
                    grade={request.securityAudit?.grade}
                    score={request.securityAudit?.score}
                    showScore={true}
                  />
                </div>
              </div>
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Payload Size</span>
                <div className="text-base font-bold text-slate-100 mt-1">
                  {request.sizeBytes ? `${request.sizeBytes} B` : 'Streaming'}
                </div>
              </div>
            </div>

            {/* URL Breakdown */}
            <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/40">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                Endpoint Target
              </span>
              <div className="text-slate-200 break-all select-text font-mono text-xs">
                {displayUrl}
              </div>
            </div>

            {/* Quick Snippet Preview */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                Quick cURL Preview
              </span>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-emerald-400/90 font-mono whitespace-pre-wrap select-text max-h-36 overflow-auto">
                curl -X {request.method} '{displayUrl}'
              </div>
            </div>
          </div>
        )}

        {activeTab === 'headers' && (
          <HeaderBreakdown
            requestHeaders={processedRequestHeaders}
            responseHeaders={processedResponseHeaders}
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

        {activeTab === 'jwt' && hasJwt && (
          <div className="space-y-4 font-mono text-xs">
            {request.jwtTokens!.map((jwt, idx) => (
              <div key={idx} className="border border-slate-800 rounded-lg bg-slate-950 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-slate-200">
                      JWT Token #{idx + 1} ({jwt.source}: {jwt.sourceKey})
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      jwt.isExpired
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {jwt.statusText}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopyJwt(jwt.rawToken, idx)}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
                  >
                    {copiedJwtIndex === idx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Token</span>
                      </>
                    )}
                  </button>
                </div>

                {jwt.timeRemainingStr && (
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Status: <strong className={jwt.isExpired ? 'text-rose-400' : 'text-emerald-400'}>{jwt.timeRemainingStr}</strong></span>
                  </div>
                )}

                {/* Claims Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  {jwt.subject && (
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800/60">
                      <span className="text-slate-500 block text-[10px] uppercase">Subject (sub)</span>
                      <span className="text-slate-200 font-semibold">{jwt.subject}</span>
                    </div>
                  )}
                  {jwt.issuer && (
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800/60">
                      <span className="text-slate-500 block text-[10px] uppercase">Issuer (iss)</span>
                      <span className="text-slate-200 font-semibold">{jwt.issuer}</span>
                    </div>
                  )}
                  {jwt.expiresAt && (
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-800/60">
                      <span className="text-slate-500 block text-[10px] uppercase">Expires At</span>
                      <span className="text-slate-200">{jwt.expiresAt.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Decoded Payload */}
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                    Decoded Payload Claims
                  </span>
                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded text-slate-200 font-mono text-[11px] overflow-auto max-h-48 whitespace-pre">
                    {JSON.stringify(jwt.payload, null, 2)}
                  </div>
                </div>

                {/* Decoded Header */}
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                    Header Details
                  </span>
                  <div className="p-2.5 bg-slate-900/50 border border-slate-800 rounded text-slate-400 font-mono text-[11px] overflow-auto whitespace-pre">
                    {JSON.stringify(jwt.header, null, 2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
