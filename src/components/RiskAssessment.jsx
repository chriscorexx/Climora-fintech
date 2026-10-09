import React, { useState, useEffect } from 'react';
import { demoBusinesses, riskWeights, businessSectors } from '../data/demoData.js';
import { calculateRiskScore } from '../data/riskEngine.js';

const DIM_META = {
  flood:     { label: 'Flood Exposure',       icon: '&#9650;', weight: 0.30, desc: 'Simulated river discharge and flood-zone exposure for this location.' },
  rainfall:  { label: 'Heavy Rainfall',       icon: '&#9652;', weight: 0.25, desc: 'Sample forecast rainfall indicators for heavy precipitation events.' },
  heat:      { label: 'Extreme Heat',         icon: '&#9651;',   weight: 0.20, desc: 'Sample forecast temperature indicators for extreme heat events.' },
  business:  { label: 'Business Vulnerability',icon: '&#9632;',weight: 0.15, desc: 'Industry-specific vulnerability based on operational dependencies.' },
  financial: { label: 'Financial Resilience', icon: '&#9733;',   weight: 0.10, desc: 'Derived from revenue, expense, and reserve information provided.' },
};

function getCategory(score) {
  if (score <= 24) return { label: 'Low',       badge: 'badge-low',       color: 'var(--color-low)'       };
  if (score <= 49) return { label: 'Moderate',  badge: 'badge-moderate',  color: 'var(--color-moderate)'  };
  if (score <= 74) return { label: 'High',       badge: 'badge-high',      color: 'var(--color-high)'      };
  return              { label: 'Very High',  badge: 'badge-very-high', color: 'var(--color-very-high)' };
}

function ScoreRing({ score, size = 130, strokeWidth = 11 }) {
  const cat  = getCategory(score);
  const r    = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--color-bg-tertiary)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={cat.color} strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(0.34,1.56,0.64,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '2rem', fontWeight: 800, color: cat.color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: '0.62rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>/ 100</span>
      </div>
    </div>
  );
}

function DimBar({ dimKey, score, isMissing }) {
  const meta = DIM_META[dimKey];
  const cat  = getCategory(score);
  if (isMissing) {
    return (
      <div className="card card-sm" style={{ opacity: 0.5, marginBottom: '0.65rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }} dangerouslySetInnerHTML={{ __html: `${meta.icon} ${meta.label}` }} />
          <span className="badge badge-muted">Missing</span>
        </div>
      </div>
    );
  }
  return (
    <div className="card card-sm" style={{ marginBottom: '0.65rem', borderLeft: `3px solid ${cat.color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', gap: '0.4rem' }}
          dangerouslySetInnerHTML={{ __html: `${meta.icon} ${meta.label}` }} />
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: cat.color }}>{score}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>wt. {Math.round(meta.weight * 100)}%</span>
          <span className={`badge ${cat.badge}`}>{cat.label}</span>
        </div>
      </div>
      <div className="progress-track" style={{ height: 6, marginBottom: '0.4rem' }}>
        <div className="progress-fill" style={{ width: `${score}%`, background: cat.color }} />
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{meta.desc}</div>
    </div>
  );
}

export default function RiskAssessment({ businessId, onBack }) {
  const [b, setB]                       = useState(null);
  const [recalc, setRecalc]             = useState(null);
  const [showWeights, setShowWeights]   = useState(false);

  useEffect(() => {
    const found = demoBusinesses.find(x => x.id === businessId) || demoBusinesses[0];
    setB(found);
    setRecalc(null);
  }, [businessId]);

  if (!b) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--color-text-secondary)' }}>
      Loading assessment...
    </div>
  );

  const cat    = getCategory(b.assessment.overallScore);
  const dims   = b.assessment.dimensions;
  const missing = b.assessment.missingDimensions || [];

  const handleRecalc = () => {
    const r = calculateRiskScore(dims);
    setRecalc(r);
  };

  const recommendations = [];
  if (dims.flood    > 60) recommendations.push({ title: 'Flood Preparedness Plan',   body: 'Document flood-response procedures, identify equipment elevation points, secure critical stock, and review insurance coverage for flood damage.',            priority: 'High'   });
  if (dims.rainfall > 50) recommendations.push({ title: 'Rainfall Impact Assessment', body: 'Evaluate drainage around premises, protect inventory from water ingress, and identify backup suppliers for delivery-dependent operations.',                  priority: 'High'   });
  if (dims.heat     > 50) recommendations.push({ title: 'Heat Stress Management',     body: 'Check HVAC capacity, schedule heat-sensitive tasks during cooler hours, and provide appropriate cooling measures for workers.',                              priority: 'Medium' });
  if (dims.business > 15) recommendations.push({ title: 'Sector Resilience Review',   body: `Review industry-specific climate vulnerabilities and contingency plans for ${businessSectors[b.sector]?.label || b.sector}.`,                                priority: 'Medium' });
  if (dims.financial> 25) recommendations.push({ title: 'Financial Resilience',       body: 'Build an emergency fund covering 3–6 months of operating expenses. Review existing debt obligations and explore refinancing where appropriate.',             priority: 'High'   });
  recommendations.push({ title: 'Business Continuity Plan', body: 'Create a plan covering temporary closure, supply-chain disruption, and remote operations where feasible. Review and update annually.', priority: 'Low' });

  const PRIO_BADGE = { High: 'badge-danger', Medium: 'badge-warning', Low: 'badge-success' };

  return (
    <div>
      <button className="btn btn-secondary btn-sm" style={{ marginBottom: '1.25rem' }} onClick={onBack}>
        &#8592; Back to Overview
      </button>

      {/* ── Business header ── */}
      <div className="card mb-3" style={{ background: 'linear-gradient(135deg, var(--color-bg-elevated), var(--color-bg-secondary))' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <ScoreRing score={b.assessment.overallScore} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0 }}>{b.name}</h2>
              <span className={`badge ${cat.badge}`}>{cat.label} Risk</span>
              <span className="badge badge-simulated">Simulated</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
              {businessSectors[b.sector]?.label || b.sector} &middot; {b.location} &middot; {b.employeeCount} employees
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-tertiary)' }}>
              Last assessed: {b.assessment.lastAssessed} &middot; Annual revenue: ${b.revenue?.toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <button className="btn btn-primary btn-sm" onClick={handleRecalc} style={{ marginBottom: '0.4rem', display: 'block', width: '100%' }}>
              &#9654; Recalculate
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowWeights(!showWeights)} style={{ display: 'block', width: '100%' }}>
              {showWeights ? '&#9650; Hide' : '&#9660; Weights'}
            </button>
          </div>
        </div>

        {recalc && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', fontSize: '0.83rem' }}>
            &#9679; Risk engine result: <strong style={{ color: getCategory(recalc.overallScore).color }}>{recalc.overallScore}/100 — {recalc.category}</strong>
            {recalc.isIncomplete && (
              <span style={{ color: 'var(--color-warning)', marginLeft: '0.5rem' }}>
                &#9888; Incomplete: missing {recalc.missingDimensions.join(', ')}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* ── Left: breakdown ── */}
        <div>
          <h3 style={{ marginBottom: '0.85rem' }}>Risk Factor Breakdown</h3>
          {Object.keys(DIM_META).map(key => (
            <DimBar key={key} dimKey={key} score={dims[key] ?? 0} isMissing={missing.includes(key)} />
          ))}

          {/* Weight table */}
          {showWeights && (
            <div className="card" style={{ marginTop: '0.65rem' }}>
              <h4 style={{ marginBottom: '0.75rem' }}>Model Weights</h4>
              {Object.entries(riskWeights).map(([key, w]) => (
                <div key={key} style={{ marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{DIM_META[key]?.label}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{Math.round(w * 100)}%</span>
                  </div>
                  <div className="progress-track" style={{ height: 5 }}>
                    <div className="progress-fill" style={{ width: `${Math.round(w * 100)}%`, background: 'var(--color-primary)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: recommendations + data notes ── */}
        <div>
          <h3 style={{ marginBottom: '0.85rem' }}>Recommended Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
            {recommendations.map((r, i) => (
              <div key={i} style={{ padding: '0.85rem 1rem', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.title}</span>
                  <span className={`badge ${PRIO_BADGE[r.priority]}`} style={{ flexShrink: 0 }}>{r.priority}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{r.body}</p>
              </div>
            ))}
          </div>

          {/* Data notes */}
          <div className="card">
            <h4 style={{ marginBottom: '0.75rem' }}>Data Sources &amp; Limitations</h4>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <span className="badge badge-simulated">Simulated Data</span>
              <span className="badge badge-demo">Not Live Observations</span>
              <span className="badge badge-demo">Illustrative Only</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
              {b.assessment.dataNote}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
              Weights: Flood 30% &middot; Rainfall 25% &middot; Heat 20% &middot; Business 15% &middot; Financial 10%.
              Missing dimensions are excluded and remaining weights rescaled proportionally.
              Categories: Low (0–24) &middot; Moderate (25–49) &middot; High (50–74) &middot; Very High (75–100).
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', lineHeight: 1.5, fontStyle: 'italic' }}>
              Disclaimer: This score is an illustrative prototype heuristic, not a validated credit rating, calibrated probability of default, or official financial recommendation. It must not be used as the sole basis for lending decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
