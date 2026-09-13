import React, { useState } from 'react';
import { NetworkRequest } from '../types/index.js';
import { MethodBadge } from '../components/MethodBadge.js';
import { SecurityBadge } from '../components/SecurityBadge.js';
import { RequestDetail } from '../components/RequestDetail.js';
import { Search, Trash2, Shield, ArrowLeft, ExternalLink, Zap } from 'lucide-react';

interface PopupViewProps {
  requests: NetworkRequest[];
  onClear: () => void;
  isExtensionEnv: boolean;
}

export const PopupView: React.FC<PopupViewProps> = ({
  requests,
  onClear,
  isExtensionEnv,
}) => {
  const [selectedReq, setSelectedReq] = useState<NetworkRequest | null>(null);
  const [search, setSearch] = useState('');

  const filtered = requests.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.url.toLowerCase().includes(q) ||
      r.method.toLowerCase().includes(q) ||
      String(r.status).includes(q) ||
      r.graphql?.operationName?.toLowerCase().includes(q)
    );
  });

  const openSidePanel = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.sidePanel) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.windowId) {
          chrome.sidePanel.open({ windowId: tabs[0].windowId });
        }
      });
    }
  };

  return (
    <div className="w-[400px] h-[560px] flex flex-col bg-slate-950 font-mono text-xs overflow-hidden border border-slate-800 text-slate-200 select-none">
      {/* Top Header */}
      <div className="px-3 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedReq ? (
            <button
              onClick={() => setSelectedReq(null)}
              className="p-1 hover:bg-slate-800 rounded text-slate-300 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="text-2xs font-semibold">Back</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-indigo-600 text-white">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-slate-100 tracking-tight text-sm">
                APIScope
              </span>
              <span className="text-2xs px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded font-semibold">
                v1.0
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {isExtensionEnv && (
            <button
              onClick={openSidePanel}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-indigo-300 rounded text-2xs transition-colors"
              title="Open expanded Chrome Side Panel"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          {!selectedReq && (
            <button
              onClick={onClear}
              className="p-1.5 hover:bg-rose-950/40 hover:text-rose-400 text-slate-400 rounded text-2xs transition-colors"
              title="Clear tab requests"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {selectedReq ? (
        <div className="flex-1 overflow-hidden flex flex-col">
          <RequestDetail request={selectedReq} allRequests={requests} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search Bar */}
          <div className="p-2 bg-slate-900/60 border-b border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Filter requests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1 bg-slate-950 border border-slate-800 rounded text-2xs text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Request List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-850">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-2xs">
                No active tab requests captured yet.
              </div>
            ) : (
              filtered.map((req) => (
                <div
                  key={req.id}
                  onClick={() => setSelectedReq(req)}
                  className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-900/60 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MethodBadge
                      method={req.method}
                      isGraphQL={req.graphql?.isGraphQL}
                      size="sm"
                    />
                    <span
                      className={`font-bold text-2xs ${
                        req.status >= 200 && req.status < 300
                          ? 'text-emerald-400'
                          : req.status >= 400
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {req.status}
                    </span>
                    <div className="truncate flex-1 min-w-0">
                      <span className="font-semibold text-slate-200 block truncate text-2xs">
                        {req.graphql?.operationName || req.path}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate block">
                        {req.domain}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-400">{req.durationMs}ms</span>
                    {req.securityAudit && (
                      <SecurityBadge grade={req.securityAudit.grade} size="sm" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom quick tip */}
          <div className="px-3 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-slate-400">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>{requests.length} sniffed calls</span>
            </span>
            <span className="text-slate-500">Click row for audit</span>
          </div>
        </div>
      )}
    </div>
  );
};
