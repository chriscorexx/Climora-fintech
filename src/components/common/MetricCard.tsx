import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  change?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'alert' | 'highlight';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtitle,
  change,
  icon,
  variant = 'default',
}) => {
  const borderClass = {
    default: 'border-fin-border hover:border-fin-hover',
    alert: 'border-rose-500/40 bg-rose-500/10 dark:bg-rose-950/10',
    highlight: 'border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/10',
  }[variant];

  return (
    <div className={`rounded-xl bg-fin-card border p-4 shadow-fin-card transition-all ${borderClass}`}>
      <div className="flex items-center justify-between text-xs font-medium text-fin-muted tracking-wide uppercase">
        <span>{label}</span>
        {icon && <div className="text-fin-muted">{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-mono text-2xl font-bold tracking-tight text-fin-text tabular-nums">
          {value}
        </span>
        {change && (
          <span
            className={`text-xs font-semibold tabular-nums ${
              change.isNeutral
                ? 'text-fin-muted'
                : change.isPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {change.value}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-fin-muted line-clamp-1">{subtitle}</p>}
    </div>
  );
};
