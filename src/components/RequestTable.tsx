import React, { useState } from 'react';
import { NetworkRequest, FilterMethod, FilterStatus } from '../types/index.js';
import { MethodBadge } from './MethodBadge.js';
import { SecurityBadge } from './SecurityBadge.js';
import { Search, Trash2, GitCompare, Wifi, WifiOff } from 'lucide-react';

interface RequestTableProps {
  requests: NetworkRequest[];
  selectedRequest: NetworkRequest | null;
  onSelectRequest: (req: NetworkRequest) => void;
  diffRequest: NetworkRequest | null;
  onSelectDiff: (req: NetworkRequest) => void;
  onClear: () => void;
  isStreaming?: boolean;
  onToggleStreaming?: () => void;
}

export const RequestTable: React.FC<RequestTableProps> = ({
  requests,
  selectedRequest,
  onSelectRequest,
  diffRequest,
  onSelectDiff,
  onClear,
  isStreaming,
  onToggleStreaming,
}) => {
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<FilterMethod>('ALL');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');

  const filteredRequests = requests.filter((req) => {
    // Search filter
    if (search) {
      const q = search.toLowerCase();
      const matchUrl = req.url.toLowerCase().includes(q);
      const matchPath = req.path.toLowerCase().includes(q);
      const matchMethod = req.method.toLowerCase().includes(q);
      const matchStatus = String(req.status).includes(q);
      const matchGql = req.graphql?.operationName?.toLowerCase().includes(q);
      if (!matchUrl && !matchPath && !matchMethod && !matchStatus && !matchGql) {
        return false;
      }
    }

    // Method filter
    if (methodFilter !== 'ALL') {
      if (methodFilter === 'GRAPHQL') {
        if (!req.graphql?.isGraphQL) return false;
      } else if (req.method !== methodFilter) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      if (statusFilter === '2xx' && (req.status < 200 || req.status >= 300)) return false;
      if (statusFilter === '3xx' && (req.status < 300 || req.status >= 400)) return false;
      if (statusFilter === '4xx' && (req.status < 400 || req.status >= 500)) return false;
      if (statusFilter === '5xx' && (req.status < 500 || req.status >= 600)) return false;
      if (statusFilter === 'ERR' && req.status !== 0 && !req.error) return false;
    }

    return true;
  });

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-emerald-400';
    if (status >= 300 && status < 400) return 'text-sky-400';
    if (status >= 400 && status < 500) return 'text-amber-400';
    if (status >= 500) return 'text-rose-400';
    return 'text-slate-500';
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 font-mono text-xs border-r border-slate-800 select-none">
      {/* Search & Actions Bar */}
      <div className="p-2.5 border-b border-slate-800 flex items-center gap-2 bg-slate-900/60">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Filter requests (URL, method, GQL)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500 font-mono transition-colors"
          />
        </div>

        {onToggleStreaming && (
          <button
            onClick={onToggleStreaming}
            className={`p-1.5 rounded-md border text-2xs transition-colors flex items-center gap-1 ${
              isStreaming
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title={isStreaming ? 'Pause live mock stream' : 'Resume live mock stream'}
          >
            {isStreaming ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          </button>
        )}

        <button
          onClick={onClear}
          className="p-1.5 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 text-slate-400 border border-slate-700 hover:border-rose-500/30 rounded-md transition-colors"
          title="Clear all captured requests"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filter Pills */}
      <div className="px-2.5 py-1.5 border-b border-slate-800/80 bg-slate-900/30 flex items-center justify-between gap-1 overflow-x-auto text-[11px]">
        {/* Method filter */}
        <div className="flex items-center gap-1">
          {(['ALL', 'GET', 'POST', 'PUT', 'DELETE', 'GRAPHQL'] as FilterMethod[]).map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-2 py-0.5 rounded transition-colors font-semibold ${
                methodFilter === m
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
          {(['ALL', '2xx', '4xx', '5xx'] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-1.5 py-0.5 rounded text-2xs transition-colors ${
                statusFilter === s
                  ? 'bg-slate-700 text-slate-100 font-bold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Request Table Rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-850/60">
        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-mono text-xs">
            No network requests match criteria.
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isSelected = selectedRequest?.id === req.id;
            const isDiff = diffRequest?.id === req.id;

            return (
              <div
                key={req.id}
                onClick={() => onSelectRequest(req)}
                className={`px-3 py-2 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-indigo-950/40 border-l-2 border-indigo-500 text-slate-100'
                    : isDiff
                    ? 'bg-fuchsia-950/30 border-l-2 border-fuchsia-500 text-slate-200'
                    : 'hover:bg-slate-900/50 text-slate-300'
                }`}
              >
                {/* Left info: Method, Path, Operation */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <MethodBadge
                    method={req.method}
                    isGraphQL={req.graphql?.isGraphQL}
                    size="sm"
                  />

                  <span className={`font-bold shrink-0 ${getStatusColor(req.status)}`}>
                    {req.status || 'ERR'}
                  </span>

                  <div className="truncate flex flex-col min-w-0">
                    <span className="truncate font-semibold text-slate-200">
                      {req.graphql?.operationName ? (
                        <span className="text-fuchsia-300">
                          {req.graphql.operationName}
                        </span>
                      ) : (
                        req.path
                      )}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate">
                      {req.domain}
                    </span>
                  </div>
                </div>

                {/* Right info: Latency, Security Grade, Diff action */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-2xs text-slate-400">{req.durationMs}ms</span>

                  {req.securityAudit && (
                    <SecurityBadge grade={req.securityAudit.grade} size="sm" />
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDiff(req);
                    }}
                    className={`p-1 rounded transition-colors ${
                      isDiff
                        ? 'bg-fuchsia-600 text-white'
                        : 'text-slate-500 hover:text-fuchsia-400 hover:bg-slate-800'
                    }`}
                    title="Compare with selected request"
                  >
                    <GitCompare className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Status bar */}
      <div className="px-3 py-1.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-2xs text-slate-400">
        <span>
          {filteredRequests.length} of {requests.length} requests
        </span>
        <span className="text-slate-500">APIScope v1.0.0</span>
      </div>
    </div>
  );
};
