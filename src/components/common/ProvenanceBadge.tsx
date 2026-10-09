import React from 'react';
import { Radio } from 'lucide-react';

interface ProvenanceBadgeProps {
  isLive: boolean;
  provider: string;
  retrievedAt?: string;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({ isLive, provider, retrievedAt }) => {
  const formattedTime = retrievedAt
    ? new Date(retrievedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

  return (
    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-fin-card border border-fin-border text-xs text-fin-muted">
      <span className="flex items-center gap-1.5 font-medium">
        {isLive ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400">Live API</span>
          </>
        ) : (
          <>
            <Radio className="w-3 h-3 text-amber-400" />
            <span className="text-amber-400">Calibrated Baseline</span>
          </>
        )}
      </span>
      <span className="text-slate-600">•</span>
      <span className="text-slate-300 font-mono text-[11px]">{provider}</span>
      <span className="text-slate-600">•</span>
      <span className="text-slate-400 text-[11px]">{formattedTime}</span>
    </div>
  );
};
