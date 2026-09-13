import React, { useState } from 'react';
import { UseNetworkCaptureResult } from '../hooks/useNetworkCapture.js';
import { SidePanelView } from './SidePanelView.js';
import { PopupView } from './PopupView.js';
import {
  Shield,
  PlusCircle,
  Play,
  Pause,
  Trash2,
  Columns,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';

interface StandaloneDevViewProps {
  capture: UseNetworkCaptureResult;
}

export const StandaloneDevView: React.FC<StandaloneDevViewProps> = ({ capture }) => {
  const [viewFormat, setViewFormat] = useState<'sidepanel' | 'popup'>('sidepanel');

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 font-mono text-xs overflow-hidden select-none">
      {/* Dev Simulator Top Toolbar */}
      <header className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-sm">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-100 text-sm tracking-tight">
                APIScope
              </span>
              <span className="text-2xs ml-1.5 px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                Dev Studio
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-slate-800 text-2xs text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Standalone Web Preview Active</span>
          </div>
        </div>

        {/* View Switcher: Side Panel vs Popup Frame */}
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewFormat('sidepanel')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-2xs font-semibold transition-colors ${
              viewFormat === 'sidepanel'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns className="w-3 h-3" />
            <span>Side Panel</span>
          </button>
          <button
            onClick={() => setViewFormat('popup')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-2xs font-semibold transition-colors ${
              viewFormat === 'popup'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            <span>Popup Preview</span>
          </button>
        </div>

        {/* Traffic Simulation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={capture.addSimulatedRequest}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-2xs transition-colors"
            title="Inject simulated API network request"
          >
            <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>Inject Mock</span>
          </button>

          <button
            onClick={capture.toggleStreaming}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-2xs transition-colors ${
              capture.isStreaming
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Toggle continuous streaming API simulation"
          >
            {capture.isStreaming ? (
              <>
                <Pause className="w-3.5 h-3.5 text-emerald-400" />
                <span>Stream ON</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-slate-400" />
                <span>Stream OFF</span>
              </>
            )}
          </button>

          <button
            onClick={capture.clearRequests}
            className="p-1.5 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 rounded transition-colors"
            title="Clear all requests"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <a
            href="https://github.com/alexandrmotologa/apiscope-extension"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 rounded transition-colors"
            title="View on GitHub"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 overflow-hidden flex">
        {viewFormat === 'sidepanel' ? (
          <SidePanelView
            requests={capture.requests}
            selectedRequest={capture.selectedRequest}
            onSelectRequest={capture.setSelectedRequest}
            diffRequest={capture.diffRequest}
            onSelectDiff={capture.setDiffRequest}
            onClearDiff={() => capture.setDiffRequest(null)}
            onClearRequests={capture.clearRequests}
            isStreaming={capture.isStreaming}
            onToggleStreaming={capture.toggleStreaming}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-900/30">
            <div className="text-center mb-3 text-slate-500 text-2xs">
              Simulated Chrome Popup Frame (400 x 560 px)
            </div>
            <div className="shadow-2xl ring-1 ring-slate-800 rounded-xl overflow-hidden">
              <PopupView
                requests={capture.requests}
                onClear={capture.clearRequests}
                isExtensionEnv={capture.isExtensionEnv}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
