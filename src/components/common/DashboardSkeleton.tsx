import React from 'react';

const shimmerBar = (
  <span
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-fin-hover/50 to-transparent"
  />
);

const blockClass = 'relative overflow-hidden rounded-2xl bg-fin-card border border-fin-border';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div
      className="space-y-6"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading dashboard data"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-24 ${blockClass}`}>
            {shimmerBar}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className={`h-72 ${blockClass}`}>{shimmerBar}</div>
          <div className={`h-56 ${blockClass}`}>{shimmerBar}</div>
        </div>
        <div className="lg:col-span-5 space-y-6">
          <div className={`h-64 ${blockClass}`}>{shimmerBar}</div>
          <div className={`h-48 ${blockClass}`}>{shimmerBar}</div>
        </div>
      </div>
      <p className="text-center text-xs text-fin-muted font-mono animate-pulse">
        Loading workspace...
      </p>
    </div>
  );
};
