import React, { useState } from 'react';
import { SecurityAuditResult } from '../types/index.js';
import { SecurityBadge } from './SecurityBadge.js';
import { ShieldAlert, AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Info } from 'lucide-react';

interface SecurityAuditCardProps {
  audit?: SecurityAuditResult;
}

export const SecurityAuditCard: React.FC<SecurityAuditCardProps> = ({ audit }) => {
  const [filter, setFilter] = useState<'all' | 'fail' | 'warning' | 'pass'>('all');
  const [expandedFindings, setExpandedFindings] = useState<Record<string, boolean>>({});

  if (!audit) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-xs border border-slate-800 rounded-lg bg-slate-900/40">
        No security audit data available for this request.
      </div>
    );
  }

  const toggleFinding = (id: string) => {
    setExpandedFindings((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const fails = audit.findings.filter((f) => f.status === 'fail');
  const warnings = audit.findings.filter((f) => f.status === 'warning');
  const passes = audit.findings.filter((f) => f.status === 'pass');

  const visibleFindings = audit.findings.filter((f) => {
    if (filter === 'fail') return f.status === 'fail';
    if (filter === 'warning') return f.status === 'warning';
    if (filter === 'pass') return f.status === 'pass';
    return true;
  });

  return (
    <div className="flex flex-col gap-4 font-mono text-xs">
      {/* Hero Score Banner */}
      <div className="p-4 rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <SecurityBadge grade={audit.grade} size="lg" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-100">
                OWASP Security Audit Score: {audit.score}/100
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed max-w-xl">
              {audit.summary}
            </p>
          </div>
        </div>

        {/* Quick Stats Pills */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-2xs font-semibold">
            <ShieldAlert className="w-3 h-3" />
            {fails.length} Critical
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-2xs font-semibold">
            <AlertTriangle className="w-3 h-3" />
            {warnings.length} Warnings
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-2xs font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            {passes.length} Passed
          </span>
        </div>
      </div>

      {/* Header Coverage Matrix */}
      <div className="p-3 border border-slate-800 rounded-lg bg-slate-950/70">
        <div className="text-slate-400 text-2xs uppercase tracking-wider font-semibold mb-2">
          Audited Security Policies
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {Object.entries(audit.headersChecked).map(([key, present]) => {
            const labels: Record<string, string> = {
              hsts: 'HSTS',
              csp: 'CSP',
              cors: 'CORS',
              xContentType: 'MIME Sniff',
              xFrame: 'Frame Options',
              referrerPolicy: 'Referrer',
              permissionsPolicy: 'Permissions',
            };
            return (
              <div
                key={key}
                className={`p-2 rounded border flex flex-col gap-1 items-start ${
                  present
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-bold uppercase">{labels[key] || key}</span>
                  {present ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <span className="text-[10px] text-slate-600">Missing</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-2xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              filter === 'all'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Findings ({audit.findings.length})
          </button>
          <button
            onClick={() => setFilter('fail')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              filter === 'fail'
                ? 'bg-rose-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Critical ({fails.length})
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              filter === 'warning'
                ? 'bg-amber-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Warnings ({warnings.length})
          </button>
          <button
            onClick={() => setFilter('pass')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              filter === 'pass'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Passed ({passes.length})
          </button>
        </div>
      </div>

      {/* Findings List */}
      <div className="flex flex-col gap-2">
        {visibleFindings.length === 0 ? (
          <div className="p-6 text-center border border-slate-800 rounded-lg text-slate-500">
            No findings in this category.
          </div>
        ) : (
          visibleFindings.map((finding) => {
            const isExpanded = expandedFindings[finding.id] !== false; // default expanded

            const borderClass =
              finding.status === 'fail'
                ? 'border-rose-500/30 bg-rose-950/10'
                : finding.status === 'warning'
                ? 'border-amber-500/30 bg-amber-950/10'
                : finding.status === 'pass'
                ? 'border-emerald-500/30 bg-emerald-950/10'
                : 'border-slate-800 bg-slate-900/30';

            const badgeClass =
              finding.status === 'fail'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : finding.status === 'warning'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : finding.status === 'pass'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700';

            return (
              <div
                key={finding.id}
                className={`border rounded-lg overflow-hidden transition-all ${borderClass}`}
              >
                <div
                  onClick={() => toggleFinding(finding.id)}
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-900/40 select-none"
                >
                  <div className="flex items-center gap-2.5">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}

                    <span
                      className={`text-2xs uppercase px-1.5 py-0.5 rounded border font-bold ${badgeClass}`}
                    >
                      {finding.status}
                    </span>

                    <span className="font-semibold text-slate-200">{finding.title}</span>
                    <span className="text-2xs text-slate-500 font-normal">
                      [{finding.header}]
                    </span>
                  </div>

                  {finding.scoreImpact > 0 && (
                    <span className="text-2xs font-semibold text-rose-400">
                      -{finding.scoreImpact} pts
                    </span>
                  )}
                </div>

                {isExpanded && (
                  <div className="px-4 pb-3 pt-1 border-t border-slate-850/60 flex flex-col gap-2 text-xs">
                    <p className="text-slate-300 leading-relaxed">{finding.description}</p>

                    <div className="mt-1 p-2.5 rounded bg-slate-950 border border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-2xs text-indigo-400 font-semibold mb-1">
                        <Info className="w-3 h-3" />
                        <span>Recommended Remediation:</span>
                      </div>
                      <code className="text-2xs text-emerald-300/90 select-text block font-mono bg-slate-900 px-2 py-1 rounded">
                        {finding.recommendation}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
