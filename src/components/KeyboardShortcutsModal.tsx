import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ onClose }) => {
  const shortcuts = [
    { key: 'Ctrl + K / /', desc: 'Focus power search bar' },
    { key: 'J / ↓', desc: 'Select next request in list' },
    { key: 'K / ↑', desc: 'Select previous request in list' },
    { key: 'C', desc: 'Copy selected request as cURL' },
    { key: 'R', desc: 'Switch to Replay & Tamper tab' },
    { key: 'D', desc: 'Open Side-by-Side Diff comparison' },
    { key: 'S', desc: 'Toggle Star / Pin favorite on selected call' },
    { key: 'A', desc: 'Toggle Analytics & Performance Dashboard' },
    { key: 'M', desc: 'Toggle Mock Rules & Error Interceptor' },
    { key: 'Esc', desc: 'Close open dialogs or clear selection' },
    { key: '?', desc: 'Show this keyboard shortcuts cheat-sheet' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-semibold text-slate-100">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-2.5 max-h-[70vh] overflow-y-auto">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between py-1.5 border-b border-slate-800/50 text-xs">
              <span className="text-slate-300">{s.desc}</span>
              <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-brand-300 font-mono rounded text-[11px] font-semibold shadow-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500">Press <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-400 font-mono">Esc</kbd> anytime to dismiss.</p>
        </div>
      </div>
    </div>
  );
};
