import React, { useState, useRef, useEffect } from 'react';
import { NetworkRequest, FilterMethod, FilterStatus, QuickChipId, DensityMode, MockRule } from '../types/index.js';
import { MethodBadge } from './MethodBadge.js';
import { SecurityBadge } from './SecurityBadge.js';
import { AnalyticsDashboard } from './AnalyticsDashboard.js';
import { MockRuleModal } from './MockRuleModal.js';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal.js';
import { generateCurlCommand } from '../exporters/curlExporter.js';
import { exportToHar, importFromHar } from '../exporters/harExporter.js';
import { generateHtmlSecurityReport } from '../audit/securityReport.js';
import {
  Search,
  Trash2,
  GitCompare,
  Wifi,
  WifiOff,
  Star,
  BarChart3,
  Sliders,
  FileDown,
  Upload,
  ShieldAlert,
  HelpCircle,
  Minimize2,
  Maximize2,
  Key,
  AlertTriangle,
} from 'lucide-react';

interface RequestTableProps {
  requests: NetworkRequest[];
  selectedRequest: NetworkRequest | null;
  onSelectRequest: (req: NetworkRequest) => void;
  diffRequest: NetworkRequest | null;
  onSelectDiff: (req: NetworkRequest) => void;
  onClear: () => void;
  isStreaming?: boolean;
  onToggleStreaming?: () => void;
  onUpdateRequests?: (reqs: NetworkRequest[]) => void;
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
  onUpdateRequests,
}) => {
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<FilterMethod>('ALL');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [quickChip, setQuickChip] = useState<QuickChipId>('ALL');
  const [density, setDensity] = useState<DensityMode>('normal');

  // Modals state
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showMockRules, setShowMockRules] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [mockRules, setMockRules] = useState<MockRule[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toggle Star / Pin
  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdateRequests) {
      const updated = requests.map(r => r.id === id ? { ...r, isPinned: !r.isPinned } : r);
      onUpdateRequests(updated);
    }
  };

  // Export HAR file
  const handleExportHar = () => {
    const harObj = exportToHar(filteredRequests.length > 0 ? filteredRequests : requests);
    const blob = new Blob([JSON.stringify(harObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apiscope_traffic_${Date.now()}.har`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import HAR file
  const handleImportHarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content && onUpdateRequests) {
        try {
          const imported = importFromHar(content);
          onUpdateRequests([...imported, ...requests]);
          if (imported.length > 0) {
            onSelectRequest(imported[0]);
          }
        } catch (err) {
          alert(`Failed to import HAR: ${(err as Error).message}`);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Download Security HTML Report
  const handleDownloadSecurityReport = () => {
    const html = generateHtmlSecurityReport(filteredRequests.length > 0 ? filteredRequests : requests);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apiscope_owasp_report_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Power Search & Filter Logic
  const filteredRequests = requests.filter((req) => {
    // 1. Quick Chips Filter
    if (quickChip === 'ERRORS') {
      if (req.status < 400 && req.status !== 0) return false;
    } else if (quickChip === 'SLOW') {
      if ((req.durationMs || 0) < 500) return false;
    } else if (quickChip === 'GRAPHQL') {
      if (!req.graphql?.isGraphQL) return false;
    } else if (quickChip === 'AUTH') {
      const hasAuthHeader = Boolean(req.requestHeaders['authorization'] || req.requestHeaders['x-access-token']);
      const hasJwt = Boolean(req.jwtTokens && req.jwtTokens.length > 0);
      if (!hasAuthHeader && !hasJwt) return false;
    } else if (quickChip === 'SECURITY') {
      const isLowGrade = req.securityAudit?.grade === 'F' || req.securityAudit?.grade === 'D';
      const hasPii = Boolean(req.piiWarnings && req.piiWarnings.length > 0);
      if (!isLowGrade && !hasPii) return false;
    } else if (quickChip === 'PINNED') {
      if (!req.isPinned) return false;
    }

    // 2. Search Syntax Parser
    if (search.trim()) {
      const tokens = search.trim().split(/\s+/);
      for (const token of tokens) {
        const lowerToken = token.toLowerCase();

        // status:4xx or status:500
        if (lowerToken.startsWith('status:')) {
          const val = lowerToken.slice(7);
          if (val === '2xx' && (req.status < 200 || req.status >= 300)) return false;
          if (val === '3xx' && (req.status < 300 || req.status >= 400)) return false;
          if (val === '4xx' && (req.status < 400 || req.status >= 500)) return false;
          if (val === '5xx' && (req.status < 500 || req.status >= 600)) return false;
          if (/^\d+$/.test(val) && req.status !== parseInt(val, 10)) return false;
          continue;
        }

        // method:POST
        if (lowerToken.startsWith('method:')) {
          const val = lowerToken.slice(7).toUpperCase();
          if (req.method !== val) return false;
          continue;
        }

        // domain:stripe.com
        if (lowerToken.startsWith('domain:')) {
          const val = lowerToken.slice(7);
          if (!req.domain.toLowerCase().includes(val)) return false;
          continue;
        }

        // grade:F or grade:A+
        if (lowerToken.startsWith('grade:')) {
          const val = lowerToken.slice(6).toUpperCase();
          if (req.securityAudit?.grade !== val) return false;
          continue;
        }

        // is:error
        if (lowerToken === 'is:error' || lowerToken === 'has:error') {
          if (req.status < 400 && req.status !== 0) return false;
          continue;
        }

        // is:slow
        if (lowerToken === 'is:slow' || lowerToken === 'slower:500ms') {
          if ((req.durationMs || 0) < 500) return false;
          continue;
        }

        // has:jwt
        if (lowerToken === 'has:jwt' || lowerToken === 'is:jwt') {
          if (!req.jwtTokens || req.jwtTokens.length === 0) return false;
          continue;
        }

        // has:auth
        if (lowerToken === 'has:auth') {
          const hasAuth = Boolean(req.requestHeaders['authorization'] || req.jwtTokens?.length);
          if (!hasAuth) return false;
          continue;
        }

        // is:starred
        if (lowerToken === 'is:starred' || lowerToken === 'is:pinned') {
          if (!req.isPinned) return false;
          continue;
        }

        // Generic text match across URL, path, method, status, graphql
        const matchUrl = req.url.toLowerCase().includes(lowerToken);
        const matchPath = req.path.toLowerCase().includes(lowerToken);
        const matchMethod = req.method.toLowerCase().includes(lowerToken);
        const matchStatus = String(req.status).includes(lowerToken);
        const matchGql = req.graphql?.operationName?.toLowerCase().includes(lowerToken);
        if (!matchUrl && !matchPath && !matchMethod && !matchStatus && !matchGql) {
          return false;
        }
      }
    }

    // 3. Method filter bar
    if (methodFilter !== 'ALL') {
      if (methodFilter === 'GRAPHQL') {
        if (!req.graphql?.isGraphQL) return false;
      } else if (req.method !== methodFilter) {
        return false;
      }
    }

    // 4. Status filter bar
    if (statusFilter !== 'ALL') {
      if (statusFilter === '2xx' && (req.status < 200 || req.status >= 300)) return false;
      if (statusFilter === '3xx' && (req.status < 300 || req.status >= 400)) return false;
      if (statusFilter === '4xx' && (req.status < 400 || req.status >= 500)) return false;
      if (statusFilter === '5xx' && (req.status < 500 || req.status >= 600)) return false;
      if (statusFilter === 'ERR' && req.status !== 0 && !req.error) return false;
    }

    return true;
  });

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid capturing when typing inside input / textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
          searchInputRef.current?.blur();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
        return;
      }

      if (e.key.toLowerCase() === 'a') {
        setShowAnalytics(prev => !prev);
        return;
      }

      if (e.key.toLowerCase() === 'm') {
        setShowMockRules(prev => !prev);
        return;
      }

      if (e.key.toLowerCase() === 'c' && selectedRequest) {
        navigator.clipboard.writeText(generateCurlCommand(selectedRequest));
        return;
      }

      if (e.key.toLowerCase() === 's' && selectedRequest && onUpdateRequests) {
        const updated = requests.map(r => r.id === selectedRequest.id ? { ...r, isPinned: !r.isPinned } : r);
        onUpdateRequests(updated);
        return;
      }

      if (e.key.toLowerCase() === 'd' && selectedRequest) {
        onSelectDiff(selectedRequest);
        return;
      }

      // Navigate up/down (J/K or ArrowUp/ArrowDown)
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (filteredRequests.length === 0) return;
        const currentIdx = selectedRequest ? filteredRequests.findIndex(r => r.id === selectedRequest.id) : -1;
        const nextIdx = Math.min(currentIdx + 1, filteredRequests.length - 1);
        onSelectRequest(filteredRequests[nextIdx]);
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (filteredRequests.length === 0) return;
        const currentIdx = selectedRequest ? filteredRequests.findIndex(r => r.id === selectedRequest.id) : 0;
        const prevIdx = Math.max(currentIdx - 1, 0);
        onSelectRequest(filteredRequests[prevIdx]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredRequests, selectedRequest, requests, onSelectRequest, onSelectDiff, onUpdateRequests]);

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
      <div className="p-2.5 border-b border-slate-800 flex items-center gap-1.5 bg-slate-900/70">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search (or status:500, method:POST, grade:F, is:slow)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-brand-500 font-mono transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-[11px]"
            >
              ×
            </button>
          )}
        </div>

        {/* Analytics Dashboard Trigger */}
        <button
          onClick={() => setShowAnalytics(true)}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-md transition-colors"
          title="Analytics & Performance Dashboard (A)"
        >
          <BarChart3 className="w-3.5 h-3.5 text-brand-400" />
        </button>

        {/* Mock Rules Trigger */}
        <button
          onClick={() => setShowMockRules(true)}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-md transition-colors"
          title="Mock Rules & Error Interceptor (M)"
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
        </button>

        {/* Export HAR */}
        <button
          onClick={handleExportHar}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-md transition-colors"
          title="Export as HTTP Archive (HAR 1.2)"
        >
          <FileDown className="w-3.5 h-3.5 text-cyan-400" />
        </button>

        {/* Import HAR */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-md transition-colors"
          title="Import HAR File"
        >
          <Upload className="w-3.5 h-3.5 text-amber-400" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".har,application/json"
          onChange={handleImportHarFile}
          className="hidden"
        />

        {/* OWASP Security Report HTML */}
        <button
          onClick={handleDownloadSecurityReport}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-md transition-colors"
          title="Download OWASP Security Compliance Report (HTML)"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
        </button>

        {/* Density Toggle */}
        <button
          onClick={() => setDensity(density === 'normal' ? 'compact' : 'normal')}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-md transition-colors"
          title={density === 'normal' ? 'Switch to Compact row density' : 'Switch to Normal row density'}
        >
          {density === 'normal' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        {/* Live Stream Toggle */}
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

        {/* Clear buffer */}
        <button
          onClick={onClear}
          className="p-1.5 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 text-slate-400 border border-slate-700 hover:border-rose-500/30 rounded-md transition-colors"
          title="Clear all captured requests"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* Shortcuts Cheat Sheet */}
        <button
          onClick={() => setShowShortcuts(true)}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 rounded-md transition-colors"
          title="Keyboard Shortcuts (?)"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Chips Bar */}
      <div className="px-2.5 py-1.5 border-b border-slate-800/80 bg-slate-900/40 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        {(
          [
            { id: 'ALL', label: 'All' },
            { id: 'ERRORS', label: 'Errors (4xx/5xx)' },
            { id: 'SLOW', label: 'Slow (>500ms)' },
            { id: 'GRAPHQL', label: 'GraphQL' },
            { id: 'AUTH', label: 'Auth & JWT' },
            { id: 'SECURITY', label: 'Security Alerts' },
            { id: 'PINNED', label: '⭐ Starred' },
          ] as Array<{ id: QuickChipId; label: string }>
        ).map((chip) => (
          <button
            key={chip.id}
            onClick={() => setQuickChip(chip.id)}
            className={`px-2 py-0.5 rounded-full transition-colors whitespace-nowrap text-[11px] font-semibold border ${
              quickChip === chip.id
                ? 'bg-brand-600 border-brand-500 text-white'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Filter Pills (Method & Status) */}
      <div className="px-2.5 py-1.5 border-b border-slate-800/60 bg-slate-900/20 flex items-center justify-between gap-1 overflow-x-auto text-[11px]">
        {/* Method filter */}
        <div className="flex items-center gap-1">
          {(['ALL', 'GET', 'POST', 'PUT', 'DELETE', 'GRAPHQL'] as FilterMethod[]).map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-2 py-0.5 rounded transition-colors font-semibold ${
                methodFilter === m
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
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
              className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
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
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-mono text-xs">
            No network requests match criteria.
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isSelected = selectedRequest?.id === req.id;
            const isDiff = diffRequest?.id === req.id;
            const isCompact = density === 'compact';

            return (
              <div
                key={req.id}
                onClick={() => onSelectRequest(req)}
                className={`flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                  isCompact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-2 text-xs'
                } ${
                  isSelected
                    ? 'bg-indigo-950/40 border-l-2 border-indigo-500 text-slate-100'
                    : isDiff
                    ? 'bg-fuchsia-950/30 border-l-2 border-fuchsia-500 text-slate-200'
                    : 'hover:bg-slate-900/50 text-slate-300'
                }`}
              >
                {/* Left info: Star, Method, Path, Operation */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <button
                    onClick={(e) => handleTogglePin(req.id, e)}
                    className="p-0.5 text-slate-600 hover:text-amber-400 transition-colors shrink-0"
                    title={req.isPinned ? 'Unstar request' : 'Star request'}
                  >
                    <Star
                      className={`w-3 h-3 ${
                        req.isPinned ? 'text-amber-400 fill-amber-400' : ''
                      }`}
                    />
                  </button>

                  <MethodBadge
                    method={req.method}
                    isGraphQL={req.graphql?.isGraphQL}
                    size={isCompact ? 'sm' : 'sm'}
                  />

                  <span className={`font-bold shrink-0 ${getStatusColor(req.status)}`}>
                    {req.status || 'ERR'}
                  </span>

                  <div className="truncate flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="truncate font-semibold text-slate-200">
                        {req.graphql?.operationName ? (
                          <span className="text-fuchsia-300">
                            {req.graphql.operationName}
                          </span>
                        ) : (
                          req.path
                        )}
                      </span>
                      {req.jwtTokens && req.jwtTokens.length > 0 && (
                        <span title="Contains JWT" className="shrink-0 inline-flex">
                          <Key className="w-2.5 h-2.5 text-emerald-400" />
                        </span>
                      )}
                      {req.piiWarnings && req.piiWarnings.length > 0 && (
                        <span title="Sensitive Data Alert" className="shrink-0 inline-flex">
                          <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                        </span>
                      )}
                    </div>
                    {!isCompact && (
                      <span className="text-[10px] text-slate-500 truncate">
                        {req.domain}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right info: Latency, Security Grade, Diff action */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`font-mono text-[11px] ${req.durationMs > 500 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {req.durationMs}ms
                  </span>

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
                    title="Compare with selected request (D)"
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
      <div className="px-3 py-1.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span>
          {filteredRequests.length} of {requests.length} calls
        </span>
        <span className="text-slate-500 flex items-center gap-2">
          <span>Press <kbd className="px-1 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">?</kbd> shortcuts</span>
        </span>
      </div>

      {/* Analytics Modal */}
      {showAnalytics && (
        <AnalyticsDashboard
          requests={filteredRequests.length > 0 ? filteredRequests : requests}
          onClose={() => setShowAnalytics(false)}
          onSelectRequest={onSelectRequest}
        />
      )}

      {/* Mock Rules Modal */}
      {showMockRules && (
        <MockRuleModal
          rules={mockRules}
          onSaveRules={setMockRules}
          onClose={() => setShowMockRules(false)}
        />
      )}

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}
    </div>
  );
};
