import React, { useState } from 'react';
import { ArrowUpRight, ChevronDown, ChevronUp } from 'lucide-react';
import { GovernmentScheme } from '../../types';

interface SchemeMatchCardProps {
  scheme: GovernmentScheme;
}

function scoreTone(score: number): string {
  if (score >= 75) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  if (score >= 25) return 'bg-neutral-500 dark:bg-neutral-400';
  return 'bg-fin-sunken';
}

export const SchemeMatchCard: React.FC<SchemeMatchCardProps> = ({ scheme }) => {
  const [expanded, setExpanded] = useState(false);
  const score = Math.max(0, Math.min(100, Number(scheme.matchingScore ?? 0)));
  const detailsId = `scheme-details-${scheme.id}`;

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        scheme.isEligible
          ? 'border-fin-border bg-fin-inset/80 hover:border-fin-hover'
          : 'border-fin-border/40 bg-fin-inset/40 opacity-70'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-xs font-bold text-fin-text">{scheme.name}</h4>
        <span
          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold shrink-0 ${
            scheme.isEligible
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              : 'bg-fin-inset text-fin-muted'
          }`}
        >
          {scheme.isEligible ? 'Eligible' : 'Check Scope'}
        </span>
      </div>

      <div className="text-[11px] text-fin-muted mt-1">
        {scheme.sponsoringAuthority} ({scheme.governmentLevel.toUpperCase()})
      </div>

      <div className="mt-2 p-2 rounded-lg bg-fin-inset border border-fin-border/80 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
        {scheme.maxBenefitSummary}
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px] font-mono text-fin-muted mb-1">
          <span>Scheme match score</span>
          <span className="text-fin-text font-bold tabular-nums">{score}/100</span>
        </div>
        <div
          className="h-1.5 w-full rounded-full bg-fin-sunken overflow-hidden"
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${scheme.name} match score`}
        >
          <div
            className={`h-full rounded-full ${scoreTone(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      <div className="mt-2 space-y-1">
        {scheme.matchReasons.slice(0, 2).map((reason, i) => (
          <div key={i} className="text-[10px] text-fin-muted flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-fin-muted" />
            <span>{reason}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-2 border-t border-fin-border flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-controls={detailsId}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-fin-secondary hover:text-fin-text transition-colors"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          <span>{expanded ? 'Hide eligibility details' : 'View eligibility & documents'}</span>
        </button>
        <a
          href={scheme.officialSourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
        >
          <span>Apply</span>
          <ArrowUpRight className="w-3 h-3" />
        </a>
      </div>

      {expanded && (
        <div id={detailsId} className="mt-3 space-y-3 text-[11px]">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-fin-muted mb-1">
              Eligibility Criteria
            </div>
            <ul className="space-y-1">
              {scheme.eligibilityCriteria.map((criterion, i) => (
                <li key={i} className="flex items-start gap-1.5 text-fin-secondary leading-relaxed">
                  <span className="w-1 h-1 rounded-full bg-fin-muted mt-1.5 shrink-0" />
                  <span>{criterion}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-fin-muted mb-1">
              Required Documents
            </div>
            <ul className="space-y-1">
              {scheme.requiredDocuments.map((document, i) => (
                <li key={i} className="flex items-start gap-1.5 text-fin-secondary leading-relaxed">
                  <span className="w-1 h-1 rounded-full bg-fin-muted mt-1.5 shrink-0" />
                  <span>{document}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="text-[10px] text-fin-muted">Support type: {scheme.supportType}</div>
        </div>
      )}
    </div>
  );
};
