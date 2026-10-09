import React, { useState } from 'react';
import { useData, useCurrentBusiness } from '../services/DataProvider.jsx';
import { api } from '../services/apiClient.js';
import { useAsync } from '../hooks/useAsync.js';
import { DATA_AVAILABILITY_LABEL, formatDate, formatDimension } from '../services/mappers.js';
import { EmptyState, ErrorState, LoadingState } from './ui.jsx';

function getColor(score) {
  if (score === null || score === undefined) return 'var(--color-text-tertiary)';
  if (score <= 24) return 'var(--color-low)';
  if (score <= 49) return 'var(--color-moderate)';
  if (score <= 74) return 'var(--color-high)';
  return 'var(--color-very-high)';
}

function getLabel(score) {
  if (score === null || score === undefined) return 'No data';
  if (score <= 24) return 'Low';
  if (score <= 49) return 'Moderate';
  if (score <= 74) return 'High';
  return 'Very High';
}

/** Educational content — static reference material, not location-specific measurements. */
const HAZARD_DETAILS = [
  {
    key: 'flood',
    label: 'Flood Exposure',
    icon: '&#9650;',
    source: 'Open-Meteo Flood API (simulated river discharge)',
    description:
      'Derived from simulated river discharge compared with the trailing 12-month maximum for the business coordinates. It is a hazard proxy, not a flood probability and not risk to a specific premises.',
    impact:
      'Can damage buildings, inventory, and equipment; interrupt deliveries; prevent customer access; and force temporary closure.',
    mitigation: [
      'Elevate critical equipment above potential flood level',
      'Establish backup suppliers outside the flood zone',
      'Arrange flood insurance appropriate for inventory value',
      'Prepare a documented flood-response and closure plan',
    ],
  },
  {
    key: 'rainfall',
    label: 'Heavy Rainfall',
    icon: '&#9652;',
    source: 'Open-Meteo Forecast API',
    description:
      'Based on the highest forecast daily precipitation total for this location over the next 7 days. Short-term forecast, not a long-run climate projection.',
    impact: 'Can damage premises, interrupt transport routes, disrupt deliveries, and increase operating costs.',
    mitigation: [
      'Check drainage around premises and address blockages',
      'Protect inventory from water ingress',
      'Identify and pre-qualify alternative delivery routes',
    ],
  },
  {
    key: 'heat',
    label: 'Extreme Heat',
    icon: '&#9651;',
    source: 'Open-Meteo Forecast API',
    description:
      'Based on the highest forecast daily maximum temperature for this location over the next 7 days. Short-term forecast, not a long-run climate projection.',
    impact:
      'Can reduce worker productivity, increase cooling costs, damage temperature-sensitive inventory, and stress machinery.',
    mitigation: [
      'Verify HVAC capacity is adequate for peak heat periods',
      'Schedule heat-sensitive operations during cooler hours',
      'Review cold-chain storage and transportation arrangements',
    ],
  },
  {
    key: 'business',
    label: 'Business Vulnerability',
    icon: '&#9632;',
    source: 'Industry model (sector baseline)',
    description:
      'Industry-specific vulnerability based on the sector baseline configured in the scoring model, combined with operational dependencies.',
    impact: 'Sector operations with water dependency, heat-sensitive machinery or logistics exposure carry elevated vulnerability.',
    mitigation: [
      'Document operational dependencies (power, water, suppliers)',
      'Identify substitute suppliers for critical inputs',
      'Prepare a business continuity plan covering key dependencies',
    ],
  },
  {
    key: 'financial',
    label: 'Financial Resilience',
    icon: '&#9733;',
    source: 'Business-entered data (derived)',
    description:
      'Derived from the expense-to-revenue ratio recorded in the business profile. Optional: treated as missing when either value is absent, never scored as zero.',
    impact: 'Limited reserves reduce the ability to absorb revenue loss during a climate disruption.',
    mitigation: [
      'Build an emergency reserve covering at least 3 months of core expenses',
      'Review and reduce high-cost debt obligations where possible',
      'Maintain up-to-date financial records for lender review',
    ],
  },
];

const DIMENSION_ORDER = ['flood', 'rainfall', 'heat', 'business', 'financial'];

export default function ClimateExposurePage() {
  const { weights } = useData();
  const { business } = useCurrentBusiness();
  const [active, setActive] = useState('flood');

  const climateState = useAsync(
    () => (business ? api.businessClimate(business.id) : Promise.resolve(null)),
    { deps: [business?.id], immediate: Boolean(business) }
  );
  const historyState = useAsync(
    () => (business ? api.listBusinessAssessments(business.id, { limit: 3 }) : Promise.resolve({ assessments: [] })),
    { deps: [business?.id], immediate: Boolean(business) }
  );

  if (!business) {
    return (
      <EmptyState title="No business profile" message="Create a business profile to see its climate exposure." />
    );
  }

  const assessments = historyState.data?.assessments || [];
  const latest = assessments.find((assessment) => assessment.factors?.length) || assessments[0] || null;
  const factors = latest?.factors || [];

  const scoreFor = (dimension) => {
    const factor = factors.find((item) => item.dimension === dimension);
    return factor ? factor.score : null;
  };

  const detail = HAZARD_DETAILS.find((hazard) => hazard.key === active);
  const score = scoreFor(active);
  const climate = climateState.data;
  const sources = climate?.sources || [];
  const warnings = climate?.warnings || [];

  return (
    <div className="grid-2" style={{ gridTemplateColumns: '1fr 1.7fr', gap: '1.25rem', alignItems: 'start' }}>
      {/* ── Left: hazard list ── */}
      <div>
        <div className="card mb-2" style={{ padding: '0.9rem 1rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Overall Risk Score
          </div>
          {historyState.loading ? (
            <LoadingState label="Loading score…" rows={1} />
          ) : latest ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: getColor(latest.overallScore) }}>{latest.overallScore}</span>
              <div>
                <div style={{ fontWeight: 700, color: getColor(latest.overallScore) }}>{latest.category} Risk</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)' }}>
                  Last assessed: {latest.assessedAt ? formatDate(latest.assessedAt) : '—'}
                </div>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              No assessment yet. Run one from the lender Risk Assessment view.
            </p>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {DIMENSION_ORDER.map((dimension) => {
            const meta = HAZARD_DETAILS.find((hazard) => hazard.key === dimension);
            const dimensionScore = scoreFor(dimension);
            const col = getColor(dimensionScore);
            const isActive = active === dimension;
            const weight = weights?.[dimension] ?? meta?.weight;
            return (
              <button
                key={dimension}
                type="button"
                className="card card-sm"
                aria-pressed={isActive}
                style={{
                  cursor: 'pointer',
                  borderLeft: `3px solid ${col}`,
                  borderColor: isActive ? 'var(--color-primary)' : undefined,
                  background: isActive ? 'var(--color-bg-elevated)' : undefined,
                  textAlign: 'left',
                  width: '100%',
                }}
                onClick={() => setActive(dimension)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <span dangerouslySetInnerHTML={{ __html: meta.icon }} />
                    {meta.label}
                  </span>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: col }}>{dimensionScore ?? '—'}</span>
                    {weight !== undefined && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>wt. {Math.round(weight * 100)}%</span>
                    )}
                  </div>
                </div>
                <div className="progress-track" style={{ height: 5 }}>
                  <div className="progress-fill" style={{ width: `${dimensionScore ?? 0}%`, background: col }} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Live sources */}
        {climateState.loading ? (
          <div style={{ marginTop: '0.75rem' }}>
            <LoadingState label="Fetching live climate data…" rows={2} />
          </div>
        ) : climateState.error ? (
          <div style={{ marginTop: '0.75rem' }}>
            <ErrorState error={climateState.error} onRetry={climateState.reload} />
          </div>
        ) : (
          climate && (
            <div className="card card-sm" style={{ marginTop: '0.75rem' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
                Live data sources
              </div>
              {sources.length === 0 ? (
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>No source metadata returned.</p>
              ) : (
                sources.map((source, index) => (
                  <div key={index} style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem' }}>
                    <span className="badge badge-demo" style={{ marginRight: '0.4rem' }}>
                      {DATA_AVAILABILITY_LABEL[source.dataType] || source.dataType}
                      {source.cached ? ' (cached)' : ''}
                    </span>
                    {source.provider}
                  </div>
                ))
              )}
              {warnings.length > 0 && (
                <div role="status" style={{ marginTop: '0.5rem' }}>
                  {warnings.map((warning, index) => (
                    <p key={index} style={{ fontSize: '0.75rem', color: 'var(--color-warning)', marginBottom: '0.3rem' }}>
                      &#9888; {warning}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* ── Right: detail panel ── */}
      {detail && (
        <div>
          <div className="card mb-2">
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-md)',
                  background: `${getColor(score)}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  flexShrink: 0,
                }}
              >
                <span dangerouslySetInnerHTML={{ __html: detail.icon }} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.2rem' }}>{detail.label}</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Source: {detail.source}</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: getColor(score), lineHeight: 1 }}>{score ?? '—'}</div>
                <div style={{ fontSize: '0.7rem', color: getColor(score), fontWeight: 700 }}>{getLabel(score)}</div>
              </div>
            </div>

            <div className="progress-track" style={{ height: 8, marginBottom: '1rem' }}>
              <div className="progress-fill" style={{ width: `${score ?? 0}%`, background: getColor(score) }} />
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', marginBottom: '0.3rem' }}>
                About this indicator
              </div>
              <div style={{ fontSize: '0.83rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{detail.description}</div>
            </div>

            {score === null || score === undefined ? (
              <div className="state-block" role="status">
                <p className="state-label" style={{ margin: 0 }}>
                  No provider data was available for {formatDimension(detail.key)} at this location. The dimension is
                  excluded from the score and never treated as zero risk.
                </p>
              </div>
            ) : (
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', marginBottom: '0.3rem' }}>
                  Why this score
                </div>
                <div style={{ fontSize: '0.83rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, padding: '0.65rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  {factors.find((factor) => factor.dimension === detail.key)?.explanation ||
                    'No explanation was returned for this dimension.'}
                </div>
              </div>
            )}

            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', marginBottom: '0.3rem' }}>
                Potential business impact
              </div>
              <div style={{ fontSize: '0.83rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, padding: '0.65rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                {detail.impact}
              </div>
            </div>
          </div>

          <div className="card">
            <h4 style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              &#9654; Suggested Mitigation Actions
            </h4>
            {detail.mitigation.map((mitigation, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: '0.6rem',
                  alignItems: 'flex-start',
                  padding: '0.5rem 0',
                  borderBottom: index < detail.mitigation.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}
              >
                <span style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '1px' }}>&#9679;</span>
                <span style={{ fontSize: '0.83rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{mitigation}</span>
              </div>
            ))}
          </div>

          <div className="disclaimer" style={{ marginTop: '1rem' }}>
            <span className="disclaimer-icon">&#9888;</span>
            Climate dimensions come from live Open-Meteo data where available (CC BY 4.0). Forecasts are short-term
            predictions, not long-run climate risk or official flood-risk assessments.
          </div>
        </div>
      )}
    </div>
  );
}
