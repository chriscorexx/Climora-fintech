import React from 'react';
import { ownerBusiness, demoRoadmapActions } from '../data/demoData.js';

function getCategory(score) {
  if (score <= 24) return { label: 'Low',       color: 'var(--color-low)',       badge: 'badge-low'       };
  if (score <= 49) return { label: 'Moderate',  color: 'var(--color-moderate)',  badge: 'badge-moderate'  };
  if (score <= 74) return { label: 'High',       color: 'var(--color-high)',      badge: 'badge-high'      };
  return              { label: 'Very High',  color: 'var(--color-very-high)', badge: 'badge-very-high' };
}

function ScoreRing({ score, size = 110, strokeWidth = 9 }) {
  const cat  = getCategory(score);
  const r    = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--color-bg-tertiary)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={cat.color} strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: cat.color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: '0.58rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk</span>
      </div>
    </div>
  );
}

export default function OwnerDashboardPage({ setActivePage }) {
  const b = ownerBusiness;
  const cat = getCategory(b.assessment.overallScore);
  const completed  = demoRoadmapActions.filter(a => a.status === 'Completed').length;
  const inProgress = demoRoadmapActions.filter(a => a.status === 'In Progress').length;
  const highPrio   = demoRoadmapActions.filter(a => a.priority === 'High' && a.status !== 'Completed').length;

  const docs       = b.documents || [];
  const docsReady  = docs.filter(d => d.status === 'Ready').length;

  const dims = b.assessment.dimensions;
  const hazards = [
    { label: 'Flood Exposure',    score: dims.flood,    icon: '&#9650;', color: 'var(--color-very-high)' },
    { label: 'Heavy Rainfall',    score: dims.rainfall, icon: '&#9652;', color: 'var(--color-high)'      },
    { label: 'Extreme Heat',      score: dims.heat,     icon: '&#9651;',   color: 'var(--color-moderate)'  },
    { label: 'Business Risk',     score: dims.business, icon: '&#9632;', color: 'var(--color-low)'       },
  ];

  return (
    <div>
      {/* Hero: business overview */}
      <div className="card mb-3" style={{ background: 'linear-gradient(135deg, var(--color-bg-elevated), var(--color-bg-secondary))', borderColor: 'var(--color-border-hover)' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <ScoreRing score={b.assessment.overallScore} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0 }}>{b.name}</h2>
              <span className={`badge ${cat.badge}`}>{cat.label} Risk</span>
              <span className="badge badge-simulated">Simulated Data</span>
            </div>
            <div style={{ fontSize: '0.83rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
              {b.sector.replace('_', ' ')} &middot; {b.location} &middot; {b.employeeCount} employees
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setActivePage('climateExposure')}>
                &#9906; View Climate Exposure
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setActivePage('loanReadiness')}>
                &#9998; Loan Readiness
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setActivePage('roadmap')}>
                &#9654; Improvement Roadmap
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid-4 mb-3">
        {[
          { label: 'Roadmap Progress',  value: `${completed}/${demoRoadmapActions.length}`, sub: 'Actions completed', icon: '&#9654;', color: 'var(--color-success)',  page: 'roadmap'  },
          { label: 'In Progress',       value: inProgress,  sub: 'Actions underway',         icon: '&#9672;', color: 'var(--color-warning)',  page: 'roadmap'  },
          { label: 'High Priority',     value: highPrio,    sub: 'Actions remaining',         icon: '&#9888;', color: 'var(--color-danger)',   page: 'roadmap'  },
          { label: 'Documents Ready',   value: `${docsReady}/${docs.length}`, sub: 'Documents prepared', icon: '&#9671;', color: 'var(--color-info)', page: 'documents' },
        ].map((s, i) => (
          <div
            key={i}
            className="stat-card"
            style={{ cursor: 'pointer', '--accent-start': s.color, '--accent-end': s.color }}
            onClick={() => setActivePage(s.page)}
          >
            <div className="stat-icon" style={{ background: `${s.color}18` }}>
              <span style={{ color: s.color }} dangerouslySetInnerHTML={{ __html: s.icon }} />
            </div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: '1.6rem' }}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Hazard summary */}
        <div className="card">
          <div className="card-header">
            <h3>Key Climate Hazards</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setActivePage('climateExposure')}>
              See all &#8250;
            </button>
          </div>
          {hazards.map((h, i) => (
            <div key={i} style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <span dangerouslySetInnerHTML={{ __html: h.icon }} /> {h.label}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: h.color }}>{h.score}/100</span>
              </div>
              <div className="progress-track" style={{ height: 6 }}>
                <div className="progress-fill" style={{ width: `${h.score}%`, background: h.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Loan application status */}
        <div className="card">
          <div className="card-header">
            <h3>Loan Application</h3>
            <span className="badge badge-danger">{b.loanApplication.status}</span>
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Amount requested</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              ${b.loanApplication.requestedAmount.toLocaleString()}
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reasons recorded</div>
            {b.loanApplication.rejectionReasons.map((r, i) => (
              <div key={i} style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--color-danger)', flexShrink: 0 }}>&#8227;</span> {r}
              </div>
            ))}
          </div>
          <button className="btn btn-primary btn-sm w-full" onClick={() => setActivePage('roadmap')}>
            Open Improvement Roadmap &#8250;
          </button>
        </div>
      </div>

      <div className="disclaimer" style={{ marginTop: '1.25rem' }}>
        <span className="disclaimer-icon">&#9888;</span>
        All climate scores shown here are illustrative simulated values for demonstration purposes. They do not constitute validated climate risk assessments or credit ratings. Last assessed: {b.assessment.lastAssessed}.
      </div>
    </div>
  );
}
