import React from 'react';
import { HttpMethod } from '../types/index.js';

interface MethodBadgeProps {
  method: HttpMethod;
  isGraphQL?: boolean;
  size?: 'sm' | 'md';
}

export const MethodBadge: React.FC<MethodBadgeProps> = ({
  method,
  isGraphQL = false,
  size = 'md',
}) => {
  const getMethodStyle = (m: HttpMethod) => {
    switch (m) {
      case 'GET':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      case 'POST':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'PUT':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'PATCH':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
      case 'DELETE':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'OPTIONS':
      case 'HEAD':
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  const pad = size === 'sm' ? 'px-1.5 py-0.5 text-2xs' : 'px-2 py-0.5 text-xs';

  return (
    <div className="inline-flex items-center gap-1 font-mono">
      <span
        className={`font-semibold tracking-wider rounded border ${getMethodStyle(
          method
        )} ${pad}`}
      >
        {method}
      </span>
      {isGraphQL && (
        <span
          className={`font-bold tracking-tight rounded border bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30 ${pad}`}
          title="GraphQL Operation Detected"
        >
          GQL
        </span>
      )}
    </div>
  );
};
