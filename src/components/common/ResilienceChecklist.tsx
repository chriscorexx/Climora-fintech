import React, { useMemo } from 'react';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { MSMEProfile } from '../../types';
import { buildResilienceChecks, resilienceReadinessPct } from '../../core/resilience';

interface ResilienceChecklistProps {
  profile: MSMEProfile | null | undefined;
  className?: string;
}

export const ResilienceChecklist: React.FC<ResilienceChecklistProps> = ({
  profile,
  className = '',
}) => {
  const checks = useMemo(() => (profile ? buildResilienceChecks(profile) : []), [profile]);
  if (!profile || checks.length === 0) return null;

  const pct = resilienceReadinessPct(checks);
  const metCount = checks.filter((check) => check.met).length;

  return (
    <div
      className={`rounded-2xl bg-fin-card border border-fin-border p-6 shadow-fin-card ${className}`}
    >
      <div className="flex items-center justify-between pb-4 border-b border-fin-border">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h3 className="text-sm font-bold text-fin-text tracking-tight">
              Resilience Readiness Checklist
            </h3>
            <p className="text-xs text-fin-muted">
              Physical mitigation status from the enterprise profile
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-semibold">
          {metCount}/{checks.length} Met
        </span>
      </div>

      <div className="pt-4">
        <div className="h-1.5 w-full rounded-full bg-fin-inset overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Resilience readiness percentage"
          />
        </div>
        <div className="text-[10px] font-mono text-fin-muted mt-1.5">{pct}% readiness</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
        {checks.map((check) => (
          <div
            key={check.id}
            className={`p-3 rounded-xl border flex items-start gap-2.5 ${
              check.met
                ? 'border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15'
                : 'border-rose-500/30 bg-rose-500/5 dark:bg-rose-500/10'
            }`}
          >
            {check.met ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-700 dark:text-rose-300 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="text-xs font-semibold text-fin-text">{check.label}</div>
              <div className="text-[10px] text-fin-muted leading-relaxed">{check.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
