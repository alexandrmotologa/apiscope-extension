import React, { useState } from 'react';
import { MockRule, HttpMethod } from '../types/index.js';
import { X, Plus, Trash2, Sliders } from 'lucide-react';

interface MockRuleModalProps {
  rules: MockRule[];
  onSaveRules: (rules: MockRule[]) => void;
  onClose: () => void;
}

export const MockRuleModal: React.FC<MockRuleModalProps> = ({
  rules,
  onSaveRules,
  onClose,
}) => {
  const [currentRules, setCurrentRules] = useState<MockRule[]>(rules);
  const [editingRule, setEditingRule] = useState<MockRule | null>(null);

  const handleToggleRule = (id: string) => {
    const updated = currentRules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r);
    setCurrentRules(updated);
    onSaveRules(updated);
  };

  const handleDeleteRule = (id: string) => {
    const updated = currentRules.filter(r => r.id !== id);
    setCurrentRules(updated);
    onSaveRules(updated);
    if (editingRule?.id === id) setEditingRule(null);
  };

  const handleAddNew = () => {
    const newRule: MockRule = {
      id: `rule_${Date.now()}`,
      name: 'Simulate 500 Server Error',
      enabled: true,
      urlPattern: '/api/v1/',
      method: 'ALL',
      overrideStatus: 500,
      overrideBody: JSON.stringify({ error: 'Internal server error simulated by APIScope', code: 'SIMULATED_500' }, null, 2),
      delayMs: 500,
    };
    setEditingRule(newRule);
  };

  const handleSaveEdit = () => {
    if (!editingRule) return;
    const exists = currentRules.some(r => r.id === editingRule.id);
    let updated: MockRule[];
    if (exists) {
      updated = currentRules.map(r => r.id === editingRule.id ? editingRule : r);
    } else {
      updated = [...currentRules, editingRule];
    }
    setCurrentRules(updated);
    onSaveRules(updated);
    setEditingRule(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Mock Rules & Error Interceptor</h2>
              <p className="text-xs text-slate-400">Intercept calls, simulate 500/401 responses, and inject latency</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {editingRule ? (
            /* Editing Form */
            <div className="space-y-4 bg-slate-950/50 p-4 border border-slate-800 rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">
                  {currentRules.some(r => r.id === editingRule.id) ? 'Edit Mock Rule' : 'New Mock Rule'}
                </h3>
                <button
                  onClick={() => setEditingRule(null)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Rule Name</label>
                <input
                  type="text"
                  value={editingRule.name}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-brand-500"
                  placeholder="e.g. Reject Checkout with 402"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">URL Match (Substring / Regex)</label>
                  <input
                    type="text"
                    value={editingRule.urlPattern}
                    onChange={(e) => setEditingRule({ ...editingRule, urlPattern: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-brand-500"
                    placeholder="/api/v1/payment"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Method</label>
                  <select
                    value={editingRule.method || 'ALL'}
                    onChange={(e) => setEditingRule({ ...editingRule, method: e.target.value as HttpMethod | 'ALL' })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-brand-500"
                  >
                    <option value="ALL">ALL Methods</option>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Override HTTP Status</label>
                  <input
                    type="number"
                    value={editingRule.overrideStatus || 200}
                    onChange={(e) => setEditingRule({ ...editingRule, overrideStatus: parseInt(e.target.value, 10) || 200 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Artificial Delay (ms)</label>
                  <input
                    type="number"
                    value={editingRule.delayMs || 0}
                    onChange={(e) => setEditingRule({ ...editingRule, delayMs: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-brand-500"
                    placeholder="e.g. 1500 for slow network"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Override Response JSON Body</label>
                <textarea
                  rows={4}
                  value={editingRule.overrideBody || ''}
                  onChange={(e) => setEditingRule({ ...editingRule, overrideBody: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-brand-500"
                  placeholder='{ "error": "Simulated error" }'
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded text-xs font-medium transition-colors"
                >
                  Save Rule
                </button>
              </div>
            </div>
          ) : (
            /* Rules List */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {currentRules.length === 0 ? 'No active mock rules configured' : `${currentRules.length} rule(s) defined`}
                </span>
                <button
                  onClick={handleAddNew}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600/90 hover:bg-brand-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Mock Rule
                </button>
              </div>

              {currentRules.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-800 rounded-lg p-6 bg-slate-950/30">
                  <Sliders className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Create rules to test how your frontend handles 500 errors, 401 unauthorized, or high latency.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40">
                  {currentRules.map((rule) => (
                    <div key={rule.id} className="p-3.5 flex items-center justify-between hover:bg-slate-900/60 transition-colors">
                      <div className="min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="checkbox"
                            checked={rule.enabled}
                            onChange={() => handleToggleRule(rule.id)}
                            className="rounded border-slate-700 text-brand-600 focus:ring-brand-500"
                          />
                          <span className={`text-xs font-semibold ${rule.enabled ? 'text-slate-200' : 'text-slate-500 line-through'}`}>
                            {rule.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            HTTP {rule.overrideStatus || 200}
                          </span>
                          {rule.delayMs ? (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              +{rule.delayMs}ms
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] font-mono text-slate-400 truncate">
                          Match: {rule.method || 'ALL'} &rarr; {rule.urlPattern}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setEditingRule(rule)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
