import React from 'react';
import { Droplets, Wind, Sun } from 'lucide-react';
import { ClimateIndicators } from '../../types';

interface DistrictBaselinePanelProps {
  climate: ClimateIndicators | null | undefined;
  className?: string;
}

interface HazardSpec {
  key: 'floodExposureScore' | 'cycloneWindScore' | 'droughtScore';
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}

const HAZARDS: HazardSpec[] = [
  {
    key: 'floodExposureScore',
    label: 'Flood Exposure',
    hint: 'Historical flood percentile',
    icon: Droplets,
  },
  {
    key: 'cycloneWindScore',
    label: 'Cyclone Wind',
    hint: 'Storm & gale wind percentile',
    icon: Wind,
  },
  {
    key: 'droughtScore',
    label: 'Drought',
    hint: 'Aridity & water stress percentile',
    icon: Sun,
  },
];

function baselineTone(score: number): { bar: string; text: string } {
  if (score >= 75) {
    return { bar: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-300' };
  }
  if (score >= 50) {
    return { bar: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300' };
  }
  if (score >= 25) {
    return {
      bar: 'bg-neutral-500 dark:bg-neutral-400',
      text: 'text-neutral-700 dark:text-neutral-300',
    };
  }
  return { bar: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300' };
}

export const DistrictBaselinePanel: React.FC<DistrictBaselinePanelProps> = ({
  climate,
  className = '',
}) => {
  const baseline = climate?.districtBaseline;
  if (!baseline) return null;

  return (
    <div
      className={`rounded-2xl bg-fin-card border border-fin-border p-6 shadow-fin-card ${className}`}
    >
      <div className="flex items-center justify-between pb-4 border-b border-fin-border">
        <div>
          <h3 className="text-sm font-bold text-fin-text tracking-tight">
            District Hazard Baseline
          </h3>
          <p className="text-xs text-fin-muted">
            Historical multi-hazard exposure for{' '}
            {climate?.location?.resolvedAddress || 'target district'}
          </p>
        </div>
        <span className="text-[10px] font-mono uppercase bg-fin-inset text-fin-secondary px-2 py-0.5 rounded border border-fin-border">
          NDMA / World Bank norm
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        {HAZARDS.map((hazard) => {
          const score = Math.max(0, Math.min(100, Number(baseline[hazard.key] ?? 0)));
          const tone = baselineTone(score);
          const Icon = hazard.icon;
          return (
            <div
              key={hazard.key}
              className="p-3.5 rounded-xl bg-fin-inset/60 border border-fin-border"
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                <span className="text-xs font-semibold text-fin-text">{hazard.label}</span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className={`font-mono text-lg font-bold tabular-nums ${tone.text}`}>
                  {score}
                </span>
                <span className="text-[10px] text-fin-muted font-mono">/100 percentile</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-fin-sunken overflow-hidden">
                <div
                  className={`h-full rounded-full ${tone.bar}`}
                  style={{ width: `${score}%` }}
                  role="progressbar"
                  aria-valuenow={score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${hazard.label} baseline score`}
                />
              </div>
              <div className="text-[10px] text-fin-muted mt-1.5">{hazard.hint}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
