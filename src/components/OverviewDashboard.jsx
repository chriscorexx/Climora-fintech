import React, { useState } from 'react';
import { demoBusinesses, demoLoanApplications } from '../data/demoData.js';

function getCategory(score) {
  if (score <= 24) return { label: 'Low',       variant: 'low',       color: 'var(--color-low)'       };
  if (score <= 49) return { label: 'Moderate',  variant: 'moderate',  color: 'var(--color-moderate)'  };
  if (score <= 74) return { label: 'High',       variant: 'high',      color: 'var(--color-high)'      };
  return              { label: 'Very High',  variant: 'very-high', color: 'var(--color-very-high)' };
}

function ScoreRing({ score, size = 80, strokeWidth = 7 }) {
  const cat   = getCategory(score);
  const r     = (size - strokeWidth) / 2;
  const circ  = 2 * Math.PI * r;
  const dash  = (score / 100) * circ;

  return (
    <div className="score-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--color-bg-tertiary)" strokeWidth={strokeWidth} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={cat.color} strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.34,1.56,0.64,1)' }}
        />
      </svg>
      <div className="score-ring-label">
        <span className="score-ring-value" style={{ color: cat.color, fontSize: '1.1rem' }}>{score}</span>
        <span className="score-ring-sub">/ 100</span>
      </div>
    </div>
  );
}

function MiniBar({ value, color }) {
  return (
    <div className="progress-track" style={{ height: 4 }}>
      <div className="progress-fill" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

// Simple donut using SVG arcs
function DonutChart({ segments, size = 140 }) {
  const strokeWidth = 18;
  const r     = (size - strokeWidth) / 2;
  const circ  = 2 * Math.PI * r;
  let offset  = 0;

  const arcs = segments.map((seg) => {
    const dash = (seg.pct / 100) * circ;
    const arc  = { ...seg, dash, offset: circ - offset };
    offset += dash;
    return arc;
  });

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--color-bg-tertiary)" strokeWidth={strokeWidth} />
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={size/2} cy={size/2} r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arc.dash} ${circ - arc.dash}`}
          strokeDashoffset={arc.offset}
          strokeLinecap="butt"
        />
      ))}
    </svg>
  );
}

export default function OverviewDashboard({ onSelectBusiness }) {
  const [hoveredRow, setHoveredRow] = useState(null);

  const total       = demoBusinesses.length;
  const avgScore    = Math.round(demoBusinesses.reduce((s, b) => s + b.assessment.overallScore, 0) / total);
  const highRisk    = demoBusinesses.filter(b => b.assessment.overallScore >= 50).length;
  const pendingApps = demoLoanApplications.filter(l => ['Under Review', 'Additional Info Required', 'Draft'].includes(l.status)).length;

  const categoryCounts = demoBusinesses.reduce((acc, b) => {
    const cat = getCategory(b.assessment.overallScore).label;
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const donutSegments = [
    { label: 'Low',       pct: Math.round((categoryCounts['Low']       || 0) / total * 100), color: 'var(--color-low)'       },
    { label: 'Moderate',  pct: Math.round((categoryCounts['Moderate']  || 0) / total * 100), color: 'var(--color-moderate)'  },
    { label: 'High',      pct: Math.round((categoryCounts['High']      || 0) / total * 100), color: 'var(--color-high)'      },
    { label: 'Very High', pct: Math.round((categoryCounts['Very High'] || 0) / total * 100), color: 'var(--color-very-high)' },
  ].filter(s => s.pct > 0);

  const recentActivity = [
    { text: 'Apex Textiles loan application rejected', time: '2 days ago', icon: '⊗', color: 'var(--color-danger)' },
    { text: 'Tech Solutions Inc approved for ₹200k loan', time: '2 days ago', icon: '⊕', color: 'var(--color-success)' },
    { text: 'Pacific Seafoods — additional info requested', time: '3 days ago', icon: '⊘', color: 'var(--color-warning)' },
    { text: 'Green Valley Grocers risk re-assessed (68)', time: '4 days ago', icon: '⊙', color: 'var(--color-info)' },
  ];

  const statCards = [
    {
      label: 'Portfolio Size',
      value: total,
      sub: 'MSMEs assessed',
      icon: '◫',
      accentStart: 'var(--color-primary)',
      accentEnd: '#3b82f6',
      valueColor: 'var(--color-text)',
    },
    {
      label: 'Average Risk Score',
      value: avgScore,
      sub: `Across all ${total} businesses`,
      icon: '◈',
      accentStart: getCategory(avgScore).color,
      accentEnd: getCategory(avgScore).color,
      valueColor: getCategory(avgScore).color,
    },
    {
      label: 'Elevated Risk',
      value: highRisk,
      sub: `${Math.round((highRisk / total) * 100)}% of portfolio`,
      icon: '⊛',
      accentStart: 'var(--color-high)',
      accentEnd: 'var(--color-very-high)',
      valueColor: 'var(--color-very-high)',
    },
    {
      label: 'Pending Applications',
      value: pendingApps,
      sub: 'Require attention',
      icon: '⊟',
      accentStart: 'var(--color-warning)',
      accentEnd: 'var(--color-moderate)',
      valueColor: 'var(--color-warning)',
    },
  ];

  return (
    <div>
      {/* ── Stat cards ── */}
      <div className="grid-4 mb-3">
        {statCards.map((c, i) => (
          <div
            key={i}
            className="stat-card fade-in"
            style={{
              '--accent-start': c.accentStart,
              '--accent-end': c.accentEnd,
              animationDelay: `${i * 0.05}s`,
            }}
          >
            <div className="stat-icon" style={{ background: `${c.accentStart}18` }}>
              <span style={{ color: c.accentStart }}>{c.icon}</span>
            </div>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value" style={{ color: c.valueColor }}>{c.value}</div>
            <div className="stat-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Middle row: donut + recent activity ── */}
      <div className="grid-2 mb-3" style={{ gridTemplateColumns: '1fr 1.6fr' }}>
        {/* Donut */}
        <div className="card">
          <div className="card-header">
            <h3>Risk Distribution</h3>
            <span className="badge badge-demo">&#9906; Live</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <DonutChart segments={donutSegments} size={130} />
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>{total}</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              {donutSegments.map((seg) => (
                <div key={seg.label} style={{ marginBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: seg.color, display: 'inline-block', flexShrink: 0 }} />
                      {seg.label}
                    </span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: seg.color }}>{categoryCounts[seg.label] || 0}</span>
                  </div>
                  <MiniBar value={seg.pct} color={seg.color} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Activity</h3>
            <span className="badge badge-muted">Last 7 days</span>
          </div>
          <div className="timeline">
            {recentActivity.map((item, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-dot" style={{ borderColor: item.color, color: item.color, background: `${item.color}15` }}>
                  {item.icon}
                </div>
                <div style={{ paddingTop: '2px' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-text)', marginBottom: '0.15rem' }}>{item.text}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Portfolio table ── */}
      <div className="card">
        <div className="card-header">
          <h3>MSME Portfolio</h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="badge badge-simulated">&#9888; Simulated Data</span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Sector</th>
                <th>Location</th>
                <th>Score</th>
                <th>Risk</th>
                <th>Trend</th>
                <th>Last Assessed</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {demoBusinesses.map((b) => {
                const cat = getCategory(b.assessment.overallScore);
                return (
                  <tr
                    key={b.id}
                    className="clickable"
                    onClick={() => onSelectBusiness(b)}
                    onMouseEnter={() => setHoveredRow(b.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td style={{ fontWeight: 600 }}>{b.name}</td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                      {b.sector.replace('_', ' ')}
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{b.location}</td>
                    <td>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: cat.color }}>
                        {b.assessment.overallScore}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${cat.variant}`}>{cat.label}</span>
                    </td>
                    <td>
                      {/* Mini score bar */}
                      <div style={{ width: 64 }}>
                        <MiniBar value={b.assessment.overallScore} color={cat.color} />
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-text-tertiary)', fontSize: '0.78rem' }}>
                      {b.assessment.lastAssessed}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => { e.stopPropagation(); onSelectBusiness(b); }}
                      >
                        View &#8250;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="disclaimer" style={{ marginTop: '1rem' }}>
          <span className="disclaimer-icon">&#9888;</span>
          All scores are illustrative demo values — not validated credit ratings or live climate observations.
        </div>
      </div>
    </div>
  );
}
