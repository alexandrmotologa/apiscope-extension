import React from 'react';
import { NetworkRequest } from '../types/index.js';
import { SecurityBadge } from './SecurityBadge.js';
import { MethodBadge } from './MethodBadge.js';
import { calculateAverageGrade } from '../audit/securityReport.js';
import { X, BarChart3, Activity, Clock, ShieldAlert, Database, AlertTriangle, ArrowUpRight } from 'lucide-react';

interface AnalyticsDashboardProps {
  requests: NetworkRequest[];
  onClose: () => void;
  onSelectRequest?: (req: NetworkRequest) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  requests,
  onClose,
  onSelectRequest,
}) => {
  const total = requests.length;

  // 1. Method Distribution
  const methodCounts: Record<string, number> = {};
  for (const r of requests) {
    methodCounts[r.method] = (methodCounts[r.method] || 0) + 1;
  }

  // 2. Status Distribution
  let count2xx = 0, count3xx = 0, count4xx = 0, count5xx = 0;
  for (const r of requests) {
    if (r.status >= 200 && r.status < 300) count2xx++;
    else if (r.status >= 300 && r.status < 400) count3xx++;
    else if (r.status >= 400 && r.status < 500) count4xx++;
    else if (r.status >= 500) count5xx++;
  }

  // 3. Top 5 Slowest Endpoints
  const slowestRequests = [...requests]
    .sort((a, b) => (b.durationMs || 0) - (a.durationMs || 0))
    .slice(0, 5);

  const avgLatency = total > 0
    ? Math.round(requests.reduce((acc, r) => acc + (r.durationMs || 0), 0) / total)
    : 0;

  // 4. Security Average
  const audited = requests.filter(r => r.securityAudit);
  const scores = audited.map(r => r.securityAudit!.score);
  const { score: avgScore, grade: avgGrade } = calculateAverageGrade(scores);

  // 5. Total Payload Size
  const totalBytes = requests.reduce((acc, r) => acc + (r.sizeBytes || 0), 0);
  const formattedSize = totalBytes > 1024 * 1024
    ? `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`
    : `${(totalBytes / 1024).toFixed(1)} KB`;

  // 6. PII & Critical Issues
  const totalPii = requests.reduce((acc, r) => acc + (r.piiWarnings?.length || 0), 0);
  const totalFails = requests.reduce((acc, r) => acc + (r.securityAudit?.findings.filter(f => f.status === 'fail').length || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Traffic & Performance Analytics</h2>
              <p className="text-xs text-slate-400">Aggregated insights across {total} captured requests</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
                <Activity className="w-4 h-4 text-emerald-400" />
                Success Rate
              </div>
              <div className="text-2xl font-bold text-slate-100">
                {total > 0 ? Math.round((count2xx / total) * 100) : 100}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">{count2xx} successful / {total} total</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
                <Clock className="w-4 h-4 text-amber-400" />
                Avg Latency
              </div>
              <div className="text-2xl font-bold text-slate-100">{avgLatency} ms</div>
              <div className="text-[11px] text-slate-500 mt-1">Across all endpoints</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                OWASP Score
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold text-slate-100">{avgScore}/100</div>
                <SecurityBadge grade={avgGrade} size="sm" />
              </div>
              <div className="text-[11px] text-slate-500 mt-1">{totalFails} failed OWASP rules</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
                <Database className="w-4 h-4 text-purple-400" />
                Data Volume
              </div>
              <div className="text-2xl font-bold text-slate-100">{formattedSize}</div>
              <div className="text-[11px] text-slate-500 mt-1">{totalPii > 0 ? `⚠️ ${totalPii} PII alerts` : 'No PII leaks detected'}</div>
            </div>
          </div>

          {/* Middle Row: Method Distribution & Status Codes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Method Breakdown */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">HTTP Methods</h3>
              <div className="space-y-2.5">
                {Object.entries(methodCounts).map(([m, count]) => {
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={m}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-mono text-slate-300">{m}</span>
                        <span className="text-slate-400 font-mono">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status Code Breakdown */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Response Status Codes</h3>
              <div className="space-y-2.5">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-emerald-400 font-mono">2xx Success</span>
                    <span className="text-slate-400 font-mono">{count2xx}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${total ? (count2xx / total) * 100 : 0}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-cyan-400 font-mono">3xx Redirect</span>
                    <span className="text-slate-400 font-mono">{count3xx}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${total ? (count3xx / total) * 100 : 0}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-amber-400 font-mono">4xx Client Error</span>
                    <span className="text-slate-400 font-mono">{count4xx}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${total ? (count4xx / total) * 100 : 0}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-rose-400 font-mono">5xx Server Error</span>
                    <span className="text-slate-400 font-mono">{count5xx}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${total ? (count5xx / total) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Slowest Endpoints Table */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Slowest Captured Endpoints
              </h3>
              <span className="text-[11px] text-slate-500">Sorted by duration</span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {slowestRequests.map((req) => (
                <div
                  key={req.id}
                  onClick={() => {
                    if (onSelectRequest) {
                      onSelectRequest(req);
                      onClose();
                    }
                  }}
                  className="py-2.5 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-4">
                    <MethodBadge method={req.method} size="sm" />
                    <span className="text-xs font-mono text-slate-200 truncate">{req.path}</span>
                    <span className="text-[11px] text-slate-500 truncate hidden sm:inline">{req.domain}</span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-mono font-medium ${req.durationMs > 500 ? 'text-rose-400' : req.durationMs > 200 ? 'text-amber-400' : 'text-slate-300'}`}>
                      {req.durationMs} ms
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PII Warnings banner if any */}
          {totalPii > 0 && (
            <div className="bg-rose-950/30 border border-rose-800/50 rounded-lg p-3.5 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-rose-300">Security Warning: Sensitive Data Detected</h4>
                <p className="text-xs text-rose-400/90 mt-0.5">
                  {totalPii} sensitive credential or PII item was identified across captured requests (e.g. auth tokens passed in URL query parameters). Review the Security & JWT tabs for details.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
