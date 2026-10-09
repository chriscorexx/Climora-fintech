import React, { useState } from 'react';
import { ownerBusiness, riskWeights } from '../data/demoData.js';

function getColor(score) {
  if (score <= 24) return 'var(--color-low)';
  if (score <= 49) return 'var(--color-moderate)';
  if (score <= 74) return 'var(--color-high)';
  return 'var(--color-very-high)';
}

function getLabel(score) {
  if (score <= 24) return 'Low';
  if (score <= 49) return 'Moderate';
  if (score <= 74) return 'High';
  return 'Very High';
}

const HAZARD_DETAILS = [
  {
    key: 'flood',
    label: 'Flood Exposure',
    icon: '&#9650;',
    weight: riskWeights.flood,
    source: 'Open-Meteo Flood API (simulated)',
    description: 'Simulated river discharge and regional flood-zone exposure for the business location.',
    impact: 'Can damage buildings, inventory, and equipment; interrupt deliveries; prevent customer access; and force temporary closure.',
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
    weight: riskWeights.rainfall,
    source: 'Open-Meteo Forecast API (simulated)',
    description: 'Sample forecast rainfall indicators for heavy precipitation events at the business location.',
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
    weight: riskWeights.heat,
    source: 'Open-Meteo Forecast API (simulated)',
    description: 'Sample forecast temperature indicators for extreme heat events relevant to this location and sector.',
    impact: 'Can reduce worker productivity, increase cooling costs, damage temperature-sensitive inventory, and stress machinery.',
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
    weight: riskWeights.business,
    source: 'Industry model (simulated)',
    description: 'Industry-specific vulnerability based on sector classification, operational dependencies, and supply-chain exposure.',
    impact: 'Manufacturing operations face elevated exposure due to water dependency, heat-sensitive machinery, and import/export logistics.',
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
    weight: riskWeights.financial,
    source: 'Business-entered data (simulated)',
    description: 'Derived from revenue, expense, debt, and emergency reserve information provided during business profile setup.',
    impact: 'Limited reserves reduce the ability to absorb revenue loss during a climate disruption and increase default risk.',
    mitigation: [
      'Build an emergency reserve covering at least 3 months of core expenses',
      'Review and reduce high-cost debt obligations where possible',
      'Maintain up-to-date financial records for lender review',
    ],
  },
];

export default function ClimateExposurePage() {
  const b    = ownerBusiness;
  const dims = b.assessment.dimensions;
  const [active, setActive] = useState('flood');

  const detail = HAZARD_DETAILS.find(h => h.key === active);
  const score  = dims[active] ?? 0;

  return (
    <div className="grid-2" style={{ gridTemplateColumns: '1fr 1.7fr', gap: '1.25rem', alignItems: 'start' }}>

      {/* ── Left: hazard list ── */}
      <div>
        <div className="card mb-2" style={{ padding: '0.9rem 1rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Overall Risk Score
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: getColor(b.assessment.overallScore) }}>
              {b.assessment.overallScore}
            </span>
            <div>
              <div style={{ fontWeight: 700, color: getColor(b.assessment.overallScore) }}>
                {getLabel(b.assessment.overallScore)} Risk
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)' }}>
                Last assessed: {b.assessment.lastAssessed}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {HAZARD_DETAILS.map(h => {
            const s   = dims[h.key] ?? 0;
            const col = getColor(s);
            const isActive = active === h.key;
            return (
              <div
                key={h.key}
                className="card card-sm"
                style={{
                  cursor: 'pointer',
                  borderLeft: `3px solid ${col}`,
                  borderColor: isActive ? 'var(--color-primary)' : undefined,
                  background: isActive ? 'var(--color-bg-elevated)' : undefined,
                }}
                onClick={() => setActive(h.key)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <span dangerouslySetInnerHTML={{ __html: h.icon }} />
                    {h.label}
                  </span>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, color: col }}>{s}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>
                      wt. {Math.round(h.weight * 100)}%
                    </span>
                  </div>
                </div>
                <div className="progress-track" style={{ height: 5 }}>
                  <div className="progress-fill" style={{ width: `${s}%`, background: col }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right: detail panel ── */}
      {detail && (
        <div>
          <div className="card mb-2">
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: `${getColor(score)}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                <span dangerouslySetInnerHTML={{ __html: detail.icon }} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 0.2rem' }}>{detail.label}</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                  Source: {detail.source}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: getColor(score), lineHeight: 1 }}>{score}</div>
                <div style={{ fontSize: '0.7rem', color: getColor(score), fontWeight: 700 }}>{getLabel(score)}</div>
              </div>
            </div>

            {/* Score bar */}
            <div className="progress-track" style={{ height: 8, marginBottom: '1rem' }}>
              <div className="progress-fill" style={{ width: `${score}%`, background: getColor(score) }} />
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', marginBottom: '0.3rem' }}>About this indicator</div>
              <div style={{ fontSize: '0.83rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{detail.description}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', marginBottom: '0.3rem' }}>Potential business impact</div>
              <div style={{ fontSize: '0.83rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, padding: '0.65rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                {detail.impact}
              </div>
            </div>
          </div>

          <div className="card">
            <h4 style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              &#9654; Suggested Mitigation Actions
            </h4>
            {detail.mitigation.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', padding: '0.5rem 0', borderBottom: i < detail.mitigation.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                <span style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '1px' }}>&#9679;</span>
                <span style={{ fontSize: '0.83rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{m}</span>
              </div>
            ))}
          </div>

          <div className="disclaimer" style={{ marginTop: '1rem' }}>
            <span className="disclaimer-icon">&#9888;</span>
            All climate indicators are simulated for demonstration purposes. They are not live observations, validated climate projections, or official flood-risk assessments.
          </div>
        </div>
      )}
    </div>
  );
}
