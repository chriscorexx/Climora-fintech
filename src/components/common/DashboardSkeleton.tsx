import React from 'react';

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
          <div
            key={i}
            className="h-24 rounded-2xl bg-fin-card border border-fin-border animate-pulse"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className="h-72 rounded-2xl bg-fin-card border border-fin-border animate-pulse" />
          <div className="h-56 rounded-2xl bg-fin-card border border-fin-border animate-pulse" />
        </div>
        <div className="lg:col-span-5 space-y-6">
          <div className="h-64 rounded-2xl bg-fin-card border border-fin-border animate-pulse" />
          <div className="h-48 rounded-2xl bg-fin-card border border-fin-border animate-pulse" />
        </div>
      </div>
      <p className="text-center text-xs text-fin-muted font-mono">Loading workspace...</p>
    </div>
  );
};
