import React from 'react';
import { NetworkRequest } from '../types/index.js';
import { MethodBadge } from './MethodBadge.js';
import { SecurityBadge } from './SecurityBadge.js';
import { GitCompare, X } from 'lucide-react';

interface DiffViewerProps {
  requestA: NetworkRequest;
  requestB: NetworkRequest | null;
  onClearDiff: () => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  requestA,
  requestB,
  onClearDiff,
}) => {
  if (!requestB) {
    return (
      <div className="p-8 text-center border border-slate-800 rounded-lg bg-slate-900/40 text-slate-400 font-mono text-xs">
        <GitCompare className="w-8 h-8 mx-auto mb-2 text-indigo-400 opacity-60" />
        <p className="font-semibold text-slate-200">Side-by-Side Comparison Mode</p>
        <p className="text-2xs text-slate-500 mt-1 max-w-md mx-auto">
          Request A is selected ({requestA.method} {requestA.path}).
          Click the "Compare" icon on any other request in the list to inspect header and payload differences.
        </p>
      </div>
    );
  }

  // Calculate header diffs
  const allReqHeaders = Array.from(
    new Set([
      ...Object.keys(requestA.requestHeaders || {}),
      ...Object.keys(requestB.requestHeaders || {}),
    ])
  ).sort();

  const allRespHeaders = Array.from(
    new Set([
      ...Object.keys(requestA.responseHeaders || {}),
      ...Object.keys(requestB.responseHeaders || {}),
    ])
  ).sort();

  return (
    <div className="flex flex-col gap-4 font-mono text-xs">
      {/* Header bar */}
      <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-slate-200">Request Difference Comparison</span>
        </div>
        <button
          onClick={onClearDiff}
          className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-2xs transition-colors"
        >
          <X className="w-3 h-3" />
          <span>Exit Diff</span>
        </button>
      </div>

      {/* Overview Comparison Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Request A */}
        <div className="p-3 rounded-lg border border-indigo-500/30 bg-indigo-950/10">
          <div className="text-2xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
            Base: Request A
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            <MethodBadge method={requestA.method} />
            <span className="font-bold text-slate-200">{requestA.status}</span>
            <span className="text-slate-400 text-2xs">{requestA.durationMs}ms</span>
            {requestA.securityAudit && (
              <SecurityBadge grade={requestA.securityAudit.grade} size="sm" />
            )}
          </div>
          <div className="text-slate-300 break-all text-2xs font-mono">{requestA.url}</div>
        </div>

        {/* Request B */}
        <div className="p-3 rounded-lg border border-fuchsia-500/30 bg-fuchsia-950/10">
          <div className="text-2xs font-bold text-fuchsia-400 uppercase tracking-wider mb-2">
            Target: Request B
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            <MethodBadge method={requestB.method} />
            <span className="font-bold text-slate-200">{requestB.status}</span>
            <span className="text-slate-400 text-2xs">{requestB.durationMs}ms</span>
            {requestB.securityAudit && (
              <SecurityBadge grade={requestB.securityAudit.grade} size="sm" />
            )}
          </div>
          <div className="text-slate-300 break-all text-2xs font-mono">{requestB.url}</div>
        </div>
      </div>

      {/* Request Headers Comparison */}
      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
        <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 font-semibold text-slate-300 text-2xs uppercase tracking-wider">
          Request Headers Comparison
        </div>
        <div className="overflow-x-auto max-h-56">
          <table className="w-full text-left border-collapse text-2xs">
            <thead>
              <tr className="bg-slate-900/60 text-slate-400 border-b border-slate-800">
                <th className="py-2 px-3 w-1/4">Header Name</th>
                <th className="py-2 px-3 w-[37%]">Request A Value</th>
                <th className="py-2 px-3 w-[37%]">Request B Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {allReqHeaders.map((name) => {
                const valA = requestA.requestHeaders?.[name];
                const valB = requestB.requestHeaders?.[name];
                const isDifferent = valA !== valB;

                return (
                  <tr
                    key={name}
                    className={`${
                      isDifferent ? 'bg-indigo-950/20' : 'hover:bg-slate-900/30'
                    }`}
                  >
                    <td className="py-2 px-3 font-semibold text-slate-300 break-all">
                      {name}
                    </td>
                    <td className="py-2 px-3 font-mono break-all text-slate-400">
                      {valA || <span className="text-slate-600 italic">None</span>}
                    </td>
                    <td className="py-2 px-3 font-mono break-all text-slate-300">
                      {valB || <span className="text-slate-600 italic">None</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Response Headers Diff Table */}
      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
        <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 font-semibold text-slate-300 text-2xs uppercase tracking-wider">
          Response Headers Comparison
        </div>
        <div className="overflow-x-auto max-h-60">
          <table className="w-full text-left border-collapse text-2xs">
            <thead>
              <tr className="bg-slate-900/60 text-slate-400 border-b border-slate-800">
                <th className="py-2 px-3 w-1/4">Header Name</th>
                <th className="py-2 px-3 w-[37%]">Request A Value</th>
                <th className="py-2 px-3 w-[37%]">Request B Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {allRespHeaders.map((name) => {
                const valA = requestA.responseHeaders?.[name] || requestA.responseHeaders?.[name.toLowerCase()];
                const valB = requestB.responseHeaders?.[name] || requestB.responseHeaders?.[name.toLowerCase()];
                const isDifferent = valA !== valB;

                return (
                  <tr
                    key={name}
                    className={`${
                      isDifferent ? 'bg-amber-950/15' : 'hover:bg-slate-900/30'
                    }`}
                  >
                    <td className="py-2 px-3 font-semibold text-slate-300 break-all">
                      {name}
                    </td>
                    <td className="py-2 px-3 font-mono break-all text-slate-400">
                      {valA || <span className="text-slate-600 italic">None</span>}
                    </td>
                    <td className="py-2 px-3 font-mono break-all text-slate-300">
                      {valB || <span className="text-slate-600 italic">None</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Body Diff */}
      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
        <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 font-semibold text-slate-300 text-2xs uppercase tracking-wider">
          Payload Comparison
        </div>
        <div className="grid grid-cols-2 divide-x divide-slate-800 p-3 max-h-56 overflow-auto">
          <div>
            <div className="text-2xs text-indigo-400 mb-1 font-semibold">Request A Body</div>
            <pre className="text-slate-300 whitespace-pre-wrap">
              {requestA.requestBody || <span className="text-slate-600 italic">(Empty)</span>}
            </pre>
          </div>
          <div className="pl-3">
            <div className="text-2xs text-fuchsia-400 mb-1 font-semibold">Request B Body</div>
            <pre className="text-slate-300 whitespace-pre-wrap">
              {requestB.requestBody || <span className="text-slate-600 italic">(Empty)</span>}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
