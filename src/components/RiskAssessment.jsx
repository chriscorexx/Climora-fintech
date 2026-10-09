import React, { useState, useEffect } from 'react';
import { demoBusinesses, riskWeights, businessSectors } from '../data/demoData.js';
import { calculateRiskScore } from '../data/riskEngine.js';

const ipc = window.climora;

const DIM_META = {
  flood:     { label: 'Flood Exposure',        icon: '&#9650;', weight: 0.30, desc: 'Simulated river discharge and flood-zone exposure for this location. Source: Open-Meteo Flood API (GloFAS).' },
  rainfall:  { label: 'Heavy Rainfall',        icon: '&#9652;', weight: 0.25, desc: 'Forecast precipitation over 7 days. Source: Open-Meteo Forecast API.' },
  heat:      { label: 'Extreme Heat',          icon: '&#9651;', weight: 0.20, desc: 'Peak daily temperature forecast. Source: Open-Meteo Forecast API.' },
  business:  { label: 'Business Vulnerability',icon: '&#9632;', weight: 0.15, desc: 'Industry-specific vulnerability based on sector and operational dependencies.' },
  financial: { label: 'Financial Resilience',  icon: '&#9671;', weight: 0.10, desc: 'Derived from revenue, expenses, reserves, and debt. Higher = more vulnerable.' },
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
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={cat.color} strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(0.34,1.56,0.64,1)' }} />
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
  const cat  = getCategory(score ?? 0);
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

const PRIO_BADGE = { High: 'badge-danger', Medium: 'badge-warning', Low: 'badge-success' };

export default function RiskAssessment({ businessId, onBack }) {
  const [b, setB]               = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [running, setRunning]   = useState(false);
  const [runError, setRunError] = useState(null);
  const [showWeights, setShowWeights] = useState(false);

  useEffect(() => {
    // Load business — prefer DB, fall back to demo
    async function load() {
      if (ipc) {
        const res = await ipc.listBusinesses();
        if (res.ok && res.data.length > 0) {
          const found = res.data.find(x => x.id === businessId) || res.data[0];
          setB({ ...found, sector: found.sector, name: found.name, location: found.location, employeeCount: found.employee_count });
          // Try loading latest assessment from history
          const hist = await ipc.getHistory(found.id);
          if (hist.ok && hist.data.length > 0) {
            const latest = hist.data[0];
            setAssessment({
              overallScore: latest.overall_score,
              category:     latest.category,
              dimensions: {
                flood:    latest.flood_score,
                rainfall: latest.rainfall_score,
                heat:     latest.heat_score,
                business: latest.business_score,
                financial:latest.financial_score,
              },
              missingDims: JSON.parse(latest.missing_dims || '[]'),
              dataSource:  latest.data_source,
              dataNote:    latest.data_note,
              lastAssessed:latest.assessed_at?.slice(0, 10),
            });
          }
          return;
        }
      }
      // Demo fallback
      const demo = demoBusinesses.find(x => x.id === businessId) || demoBusinesses[0];
      setB(demo);
      setAssessment({ ...demo.assessment, dataSource: 'sample', dataNote: demo.assessment.dataNote });
    }
    load();
  }, [businessId]);

  const handleRunAssessment = async () => {
    if (!b) return;
    setRunning(true);
    setRunError(null);

    if (ipc && b.id && typeof b.id === 'number') {
      const res = await ipc.runAssessment(b.id, true);
      setRunning(false);
      if (res.ok) {
        setAssessment({
          overallScore: res.data.overallScore,
          category:     res.data.category,
          dimensions:   res.data.dimensions,
          missingDims:  res.data.missingDims ?? [],
          dataSource:   res.data.dataSource,
          dataNote:     res.data.dataNote,
          lastAssessed: new Date().toISOString().slice(0, 10),
        });
      } else {
        setRunError(res.errors?.join('; ') ?? 'Assessment failed');
      }
    } else {
      // Browser mode: use renderer engine on demo data
      const demo = demoBusinesses.find(x => x.id === businessId) || demoBusinesses[0];
      const scored = calculateRiskScore(demo.assessment.dimensions);
      setRunning(false);
      setAssessment({
        overallScore: scored.overallScore,
        category:     scored.category,
        dimensions:   demo.assessment.dimensions,
        missingDims:  scored.missingDimensions ?? [],
        dataSource:   'sample',
        dataNote:     'Browser mode — renderer engine used. Open in Electron for live API data.',
        lastAssessed: new Date().toISOString().slice(0, 10),
      });
    }
  };

  if (!b) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--color-text-secondary)' }}>Loading...</div>;
  }

  const score   = assessment?.overallScore ?? 0;
  const cat     = getCategory(score);
  const dims    = assessment?.dimensions ?? {};
  const missing = assessment?.missingDims ?? [];
  const isLive  = assessment?.dataSource === 'live';

  const recommendations = [];
  if ((dims.flood    ?? 0) > 60) recommendations.push({ title: 'Flood Preparedness Plan',   body: 'Document flood-response procedures, identify equipment elevation points, secure critical stock, and review flood insurance coverage.',     priority: 'High'   });
  if ((dims.rainfall ?? 0) > 50) recommendations.push({ title: 'Rainfall Impact Assessment', body: 'Evaluate drainage around premises, protect inventory from water ingress, and identify backup suppliers for delivery-dependent operations.',  priority: 'High'   });
  if ((dims.heat     ?? 0) > 50) recommendations.push({ title: 'Heat Stress Management',     body: 'Check HVAC capacity, schedule heat-sensitive tasks during cooler hours, and provide appropriate cooling measures for workers.',              priority: 'Medium' });
  if ((dims.business ?? 0) > 15) recommendations.push({ title: 'Sector Resilience Review',   body: `Review climate vulnerabilities specific to ${businessSectors[b.sector]?.label || b.sector}.`,                                             priority: 'Medium' });
  if ((dims.financial?? 0) > 25) recommendations.push({ title: 'Financial Resilience',       body: 'Build an emergency fund covering 3–6 months of operating expenses. Review debt obligations and explore refinancing where appropriate.',    priority: 'High'   });
  recommendations.push({ title: 'Business Continuity Plan', body: 'Create a plan covering temporary closure, supply-chain disruption, and remote operations. Review and update annually.', priority: 'Low' });

  return (
    <div>
      <button className="btn btn-secondary btn-sm" style={{ marginBottom: '1.25rem' }} onClick={onBack}>
        &#8592; Back to Overview
      </button>

      {/* Business header */}
      <div className="card mb-3" style={{ background: 'linear-gradient(135deg, var(--color-bg-elevated), var(--color-bg-secondary))' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <ScoreRing score={score} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0 }}>{b.name}</h2>
              <span className={`badge ${cat.badge}`}>{cat.label} Risk</span>
              <span className={`badge ${isLive ? 'badge-success' : 'badge-simulated'}`}>
                {isLive ? '&#9679; Live API' : '&#9888; Sample Data'}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>
              {businessSectors[b.sector]?.label || b.sector} &middot; {b.location}
            </div>
            {assessment?.lastAssessed && (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                Last assessed: {assessment.lastAssessed}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
            <button className="btn btn-primary btn-sm" onClick={handleRunAssessment} disabled={running}>
              {running ? '&#9654; Running...' : '&#9654; Run Assessment'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowWeights(!showWeights)}>
              {showWeights ? '&#9650; Hide weights' : '&#9660; Show weights'}
            </button>
          </div>
        </div>

        {runError && (
          <div style={{ marginTop: '1rem', padding: '0.65rem 1rem', background: 'var(--color-danger-dim)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--color-danger)' }}>
            &#10007; {runError}
          </div>
        )}

        {assessment && (
          <div style={{ marginTop: '1rem', padding: '0.65rem 1rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
            {assessment.dataNote}
          </div>
        )}
      </div>

      {!assessment ? (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem', opacity: 0.4 }}>&#9906;</div>
          <h3 style={{ marginBottom: '0.5rem' }}>No assessment yet</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
            Click "Run Assessment" to fetch live climate data and compute a risk score.
          </p>
          <button className="btn btn-primary" onClick={handleRunAssessment} disabled={running}>
            {running ? 'Running...' : '&#9654; Run Assessment'}
          </button>
        </div>
      ) : (
        <div className="grid-2" style={{ gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
          {/* Breakdown */}
          <div>
            <h3 style={{ marginBottom: '0.85rem' }}>Risk Factor Breakdown</h3>
            {Object.keys(DIM_META).map(key => (
              <DimBar key={key} dimKey={key} score={dims[key] ?? 0} isMissing={missing.includes(key)} />
            ))}
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

          {/* Recommendations + notes */}
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

            <div className="card">
              <h4 style={{ marginBottom: '0.75rem' }}>Data Sources &amp; Limitations</h4>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <span className={`badge ${isLive ? 'badge-success' : 'badge-simulated'}`}>
                  {isLive ? 'Open-Meteo Live API' : 'Simulated Sample Data'}
                </span>
                <span className="badge badge-muted">Illustrative Score</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', lineHeight: 1.5, fontStyle: 'italic' }}>
                This score is an illustrative prototype heuristic, not a validated credit rating, probability of default, or financial recommendation. It must not be used as the sole basis for lending decisions. Weather data by Open-Meteo (CC BY 4.0).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
