import React from 'react';
import { RiskCategory } from '../../types';

interface RiskBadgeProps {
  category: RiskCategory;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ category, score, size = 'md' }) => {
  const styles = {
    low: {
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
      dot: 'bg-emerald-400',
      label: 'Low Risk',
    },
    moderate: {
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
      dot: 'bg-amber-400',
      label: 'Moderate Risk',
    },
    high: {
      bg: 'bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400',
      dot: 'bg-orange-400',
      label: 'High Risk',
    },
    severe: {
      bg: 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400',
      dot: 'bg-rose-400',
      label: 'Severe Risk',
    },
  }[category];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-medium px-2.5 py-1',
    lg: 'text-sm font-semibold px-3 py-1.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${styles.bg} ${sizeClasses} tracking-wide uppercase`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
      <span>{styles.label}</span>
      {score !== undefined && (
        <span className="font-mono opacity-80 lowercase font-normal ml-0.5">({score}/100)</span>
      )}
    </span>
  );
};
