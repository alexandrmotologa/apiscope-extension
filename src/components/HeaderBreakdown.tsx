import React, { useState } from 'react';
import { Search, ShieldAlert, ShieldCheck } from 'lucide-react';

interface HeaderBreakdownProps {
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
}

const SECURITY_HEADERS = new Set([
  'strict-transport-security',
  'content-security-policy',
  'access-control-allow-origin',
  'access-control-allow-credentials',
  'x-content-type-options',
  'x-frame-options',
  'referrer-policy',
  'permissions-policy',
  'feature-policy',
  'set-cookie',
]);

export const HeaderBreakdown: React.FC<HeaderBreakdownProps> = ({
  requestHeaders,
  responseHeaders,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'response' | 'request'>('response');
  const [search, setSearch] = useState('');

  const targetHeaders = activeSubTab === 'response' ? responseHeaders : requestHeaders;
  const entries = Object.entries(targetHeaders || {});

  const filtered = entries.filter(([k, v]) => {
    const s = search.toLowerCase();
    return k.toLowerCase().includes(s) || v.toLowerCase().includes(s);
  });

  return (
    <div className="flex flex-col gap-3 font-mono text-xs">
      {/* Subtab selector & search */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveSubTab('response')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeSubTab === 'response'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Response Headers ({Object.keys(responseHeaders || {}).length})
          </button>
          <button
            onClick={() => setActiveSubTab('request')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeSubTab === 'request'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Request Headers ({Object.keys(requestHeaders || {}).length})
          </button>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1 text-slate-300 w-52">
          <Search className="w-3 h-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search headers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-2xs w-full placeholder-slate-600"
          />
        </div>
      </div>

      {/* Table container */}
      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 text-2xs uppercase tracking-wider">
              <th className="py-2 px-3 w-1/3">Header Name</th>
              <th className="py-2 px-3">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-6 text-center text-slate-500">
                  No headers match your search.
                </td>
              </tr>
            ) : (
              filtered.map(([name, value]) => {
                const isSec = SECURITY_HEADERS.has(name.toLowerCase());
                return (
                  <tr
                    key={name}
                    className={`hover:bg-slate-900/50 transition-colors ${
                      isSec ? 'bg-indigo-950/20' : ''
                    }`}
                  >
                    <td className="py-2 px-3 text-slate-300 font-semibold align-top break-all flex items-center gap-1.5">
                      {name}
                      {isSec && (
                        <span
                          className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-bold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                          title="OWASP Security Header"
                        >
                          <ShieldCheck className="w-2.5 h-2.5 mr-0.5 inline" />
                          Security
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-indigo-200/85 break-all font-mono select-text">
                      {value}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {activeSubTab === 'response' && (
        <div className="flex items-center gap-2 text-2xs text-slate-500 px-1">
          <ShieldAlert className="w-3 h-3 text-indigo-400" />
          <span>
            Highlighted rows denote HTTP security headers assessed by the OWASP audit engine.
          </span>
        </div>
      )}
    </div>
  );
};
