import React, { useState } from 'react';
import { GraphQLInfo } from '../types/index.js';
import { Copy, Check, Boxes, FileJson, Sparkles } from 'lucide-react';

interface GraphQLInspectorProps {
  graphql?: GraphQLInfo | null;
}

export const GraphQLInspector: React.FC<GraphQLInspectorProps> = ({ graphql }) => {
  const [copiedQuery, setCopiedQuery] = useState(false);
  const [copiedVars, setCopiedVars] = useState(false);

  if (!graphql || !graphql.isGraphQL) {
    return (
      <div className="p-8 text-center border border-slate-800 rounded-lg bg-slate-900/40 text-slate-500 font-mono text-xs">
        <Boxes className="w-8 h-8 mx-auto mb-2 opacity-30 text-fuchsia-400" />
        This request is not identified as a GraphQL operation.
      </div>
    );
  }

  const handleCopyQuery = () => {
    navigator.clipboard.writeText(graphql.query);
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
  };

  const handleCopyVars = () => {
    if (graphql.variables) {
      navigator.clipboard.writeText(JSON.stringify(graphql.variables, null, 2));
      setCopiedVars(true);
      setTimeout(() => setCopiedVars(false), 2000);
    }
  };

  const opType = graphql.operationType || 'query';
  const typeColor =
    opType === 'mutation'
      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
      : opType === 'subscription'
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';

  return (
    <div className="flex flex-col gap-4 font-mono text-xs">
      {/* Header Info */}
      <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-2xs font-bold uppercase px-2 py-0.5 rounded border ${typeColor}`}>
                {opType}
              </span>
              <span className="font-bold text-slate-100 text-sm">
                {graphql.operationName || 'Anonymous Operation'}
              </span>
            </div>
            <span className="text-2xs text-slate-400">GraphQL AST schema operation detected</span>
          </div>
        </div>

        <button
          onClick={handleCopyQuery}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
        >
          {copiedQuery ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Query</span>
            </>
          )}
        </button>
      </div>

      {/* Query Block */}
      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950 shadow-sm">
        <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-slate-400">
          <span className="font-semibold text-slate-300 text-2xs uppercase tracking-wider">
            GraphQL Document
          </span>
          <span className="text-2xs text-slate-500">{graphql.query.split('\n').length} lines</span>
        </div>
        <pre className="p-3 text-slate-200 overflow-auto max-h-72 leading-relaxed text-xs">
          <code>{graphql.query}</code>
        </pre>
      </div>

      {/* Variables Block (if present) */}
      {graphql.variables && Object.keys(graphql.variables).length > 0 && (
        <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950 shadow-sm">
          <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-slate-400">
            <div className="flex items-center gap-2">
              <FileJson className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold text-slate-300 text-2xs uppercase tracking-wider">
                Operation Variables
              </span>
            </div>
            <button
              onClick={handleCopyVars}
              className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-2xs"
            >
              {copiedVars ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedVars ? 'Copied' : 'Copy Variables'}</span>
            </button>
          </div>
          <pre className="p-3 text-indigo-200/90 overflow-auto max-h-48 leading-relaxed text-xs">
            <code>{JSON.stringify(graphql.variables, null, 2)}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
