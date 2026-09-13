import React, { useState, useEffect } from 'react';
import { NetworkRequest, HttpMethod } from '../types/index.js';
import { Play, RotateCcw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface ReplaySimulatorProps {
  request: NetworkRequest;
}

export const ReplaySimulator: React.FC<ReplaySimulatorProps> = ({ request }) => {
  const [method, setMethod] = useState<HttpMethod>(request.method);
  const [url, setUrl] = useState<string>(request.url);
  const [headersText, setHeadersText] = useState<string>('');
  const [bodyText, setBodyText] = useState<string>(request.requestBody || '');

  const [isLoading, setIsLoading] = useState(false);
  const [replayResult, setReplayResult] = useState<{
    status: number;
    statusText: string;
    durationMs: number;
    headers: Record<string, string>;
    data: string;
    error?: string;
  } | null>(null);

  // Sync state when incoming request changes
  useEffect(() => {
    setMethod(request.method);
    setUrl(request.url);
    const cleanHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(request.requestHeaders || {})) {
      if (![':authority', ':method', ':path', ':scheme', 'host', 'content-length'].includes(k.toLowerCase())) {
        cleanHeaders[k] = v;
      }
    }
    setHeadersText(JSON.stringify(cleanHeaders, null, 2));
    setBodyText(request.requestBody || '');
    setReplayResult(null);
  }, [request]);

  const handleReset = () => {
    setMethod(request.method);
    setUrl(request.url);
    const cleanHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(request.requestHeaders || {})) {
      if (![':authority', ':method', ':path', ':scheme', 'host', 'content-length'].includes(k.toLowerCase())) {
        cleanHeaders[k] = v;
      }
    }
    setHeadersText(JSON.stringify(cleanHeaders, null, 2));
    setBodyText(request.requestBody || '');
    setReplayResult(null);
  };

  const handleExecuteReplay = async () => {
    setIsLoading(true);
    setReplayResult(null);

    const startTime = performance.now();
    try {
      let parsedHeaders: Record<string, string> = {};
      try {
        parsedHeaders = JSON.parse(headersText);
      } catch {
        // use empty if invalid
      }

      const options: RequestInit = {
        method,
        headers: parsedHeaders,
        mode: 'cors',
      };

      if (method !== 'GET' && method !== 'HEAD' && bodyText) {
        options.body = bodyText;
      }

      const response = await fetch(url, options);
      const endTime = performance.now();
      const durationMs = Math.round(endTime - startTime);

      const respHeaders: Record<string, string> = {};
      response.headers.forEach((val, key) => {
        respHeaders[key] = val;
      });

      const responseText = await response.text();

      setReplayResult({
        status: response.status,
        statusText: response.statusText,
        durationMs,
        headers: respHeaders,
        data: responseText,
      });
    } catch (err: unknown) {
      const endTime = performance.now();
      const msg = err instanceof Error ? err.message : 'Network request failed (possibly CORS blocked)';
      setReplayResult({
        status: 0,
        statusText: 'Network Error',
        durationMs: Math.round(endTime - startTime),
        headers: {},
        data: '',
        error: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 font-mono text-xs">
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
        <div>
          <span className="font-bold text-slate-200">Replay & Tamper Console</span>
          <p className="text-2xs text-slate-400 mt-0.5">
            Modify headers, payload, or target URL and dispatch an immediate request.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-2xs transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* URL & Method Bar */}
      <div className="flex gap-2">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as HttpMethod)}
          className="bg-slate-900 border border-slate-800 rounded px-3 py-2 text-indigo-300 font-bold outline-none focus:border-indigo-500"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
          <option value="OPTIONS">OPTIONS</option>
        </select>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 flex-1 outline-none focus:border-indigo-500 font-mono text-xs"
        />
        <button
          onClick={handleExecuteReplay}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Send</span>
            </>
          )}
        </button>
      </div>

      {/* Headers Editor */}
      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
        <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold text-2xs uppercase tracking-wider">
          Request Headers (JSON)
        </div>
        <textarea
          rows={4}
          value={headersText}
          onChange={(e) => setHeadersText(e.target.value)}
          className="w-full p-3 bg-transparent text-slate-200 font-mono text-xs outline-none resize-y"
        />
      </div>

      {/* Body Editor */}
      {method !== 'GET' && method !== 'HEAD' && (
        <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
          <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold text-2xs uppercase tracking-wider">
            Request Body (Payload)
          </div>
          <textarea
            rows={5}
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            className="w-full p-3 bg-transparent text-slate-200 font-mono text-xs outline-none resize-y"
          />
        </div>
      )}

      {/* Replay Result Panel */}
      {replayResult && (
        <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950 shadow-sm mt-2">
          <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {replayResult.error ? (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              <span className="font-bold text-slate-100">
                {replayResult.error ? 'Dispatch Failed' : `Status: ${replayResult.status} ${replayResult.statusText}`}
              </span>
              <span className="text-2xs text-slate-400 font-normal">
                ({replayResult.durationMs}ms)
              </span>
            </div>
          </div>

          <div className="p-3">
            {replayResult.error ? (
              <div className="p-3 rounded bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs">
                {replayResult.error}
              </div>
            ) : (
              <pre className="text-xs text-slate-200 overflow-auto max-h-60 leading-relaxed">
                <code>{replayResult.data || '(Empty response body)'}</code>
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
