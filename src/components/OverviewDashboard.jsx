import React, { useState, useEffect } from 'react';
import { demoBusinesses, demoLoanApplications } from '../data/demoData.js';

const ipc = window.climora;

function getCategory(score) {
  if (score <= 24) return { label: 'Low',       badge: 'badge-low',       color: 'var(--color-low)'       };
  if (score <= 49) return { label: 'Moderate',  badge: 'badge-moderate',  color: 'var(--color-moderate)'  };
  if (score <= 74) return { label: 'High',       badge: 'badge-high',      color: 'var(--color-high)'      };
  return              { label: 'Very High',  badge: 'badge-very-high', color: 'var(--color-very-high)' };
}

// Normalise a DB business row to match the shape used in the UI
function normaliseDbBusiness(row) {
  return {
    id:            row.id,
    name:          row.name,
    sector:        row.sector,
    location:      row.location,
    employeeCount: row.employee_count,
    revenue:       row.revenue,
    expenses:      row.expenses,
    assessment: {
      overallScore:  row._score          ?? 0,
      category:      row._category       ?? 'Unknown',
      lastAssessed:  row._assessed_at    ?? row.updated_at?.slice(0, 10) ?? '—',
      dataSource:    row._data_source    ?? 'sample',
      dimensions:    row._dimensions     ?? {},
    },
    _fromDb: true,
  };
}

function MiniBar({ value, color }) {
  return (
    <div className="progress-track" style={{ height: 4 }}>
      <div className="progress-fill" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

function DonutChart({ segments, size = 130 }) {
  const sw = 18, r = (size - sw) / 2, circ = 2 * Math.PI * r;
  let offset = 0;
  const arcs = segments.map(seg => {
    const dash = (seg.pct / 100) * circ;
    const arc  = { ...seg, dash, offset: circ - offset };
    offset += dash;
    return arc;
  });
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--color-bg-tertiary)" strokeWidth={sw} />
      {arcs.map((arc, i) => (
        <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
          stroke={arc.color} strokeWidth={sw}
          strokeDasharray={`${arc.dash} ${circ - arc.dash}`}
          strokeDashoffset={arc.offset} strokeLinecap="butt" />
      ))}
    </svg>
  );
}

export default function OverviewDashboard({ onSelectBusiness }) {
  const [businesses, setBusinesses] = useState([]);
  const [usingDemo, setUsingDemo]   = useState(false);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (ipc) {
        const res = await ipc.listBusinesses();
        if (res.ok && res.data.length > 0) {
          // For each business, attach its latest assessment score
          const enriched = await Promise.all(res.data.map(async b => {
            const hist = await ipc.getHistory(b.id);
            const latest = hist.ok && hist.data.length > 0 ? hist.data[0] : null;
            return {
              ...b,
              _score:       latest?.overall_score   ?? 0,
              _category:    latest?.category        ?? 'Unknown',
              _assessed_at: latest?.assessed_at?.slice(0, 10) ?? '—',
              _data_source: latest?.data_source     ?? 'sample',
              _dimensions: {
                flood:    latest?.flood_score    ?? 0,
                rainfall: latest?.rainfall_score ?? 0,
                heat:     latest?.heat_score     ?? 0,
                business: latest?.business_score ?? 0,
                financial:latest?.financial_score ?? 0,
              },
            };
          }));
          setBusinesses(enriched.map(normaliseDbBusiness));
          setUsingDemo(false);
          setLoading(false);
          return;
        }
      }
      setBusinesses(demoBusinesses);
      setUsingDemo(true);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, color: 'var(--color-text-secondary)' }}>
        Loading portfolio...
      </div>
    );
  }

  const total       = businesses.length;
  const avgScore    = total ? Math.round(businesses.reduce((s, b) => s + (b.assessment?.overallScore ?? 0), 0) / total) : 0;
  const highRisk    = businesses.filter(b => (b.assessment?.overallScore ?? 0) >= 50).length;
  const pendingApps = demoLoanApplications.filter(l => ['Under Review', 'Additional Info Required', 'Draft'].includes(l.status)).length;

  const catCounts = businesses.reduce((acc, b) => {
    const cat = getCategory(b.assessment?.overallScore ?? 0).label;
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const donutSegments = [
    { label: 'Low',       pct: Math.round((catCounts['Low']       || 0) / Math.max(total,1) * 100), color: 'var(--color-low)'       },
    { label: 'Moderate',  pct: Math.round((catCounts['Moderate']  || 0) / Math.max(total,1) * 100), color: 'var(--color-moderate)'  },
    { label: 'High',      pct: Math.round((catCounts['High']      || 0) / Math.max(total,1) * 100), color: 'var(--color-high)'      },
    { label: 'Very High', pct: Math.round((catCounts['Very High'] || 0) / Math.max(total,1) * 100), color: 'var(--color-very-high)' },
  ].filter(s => s.pct > 0);

  const recentActivity = [
    { text: 'Apex Textiles loan application rejected',         time: '2 days ago', icon: '&#10007;', color: 'var(--color-danger)'  },
    { text: 'Tech Solutions Inc approved for $200k loan',      time: '2 days ago', icon: '&#10003;', color: 'var(--color-success)' },
    { text: 'Pacific Seafoods — additional info requested',    time: '3 days ago', icon: '&#9888;',  color: 'var(--color-warning)' },
    { text: 'Green Valley Grocers risk re-assessed (68)',      time: '4 days ago', icon: '&#9906;',  color: 'var(--color-info)'    },
  ];

  const statCards = [
    { label: 'Portfolio Size',     value: total,     sub: 'MSMEs assessed',                      icon: '&#9632;', accentStart: 'var(--color-primary)',                          valueColor: 'var(--color-text)'         },
    { label: 'Average Risk Score', value: avgScore,  sub: `Across all ${total} businesses`,      icon: '&#9652;', accentStart: getCategory(avgScore).color,                    valueColor: getCategory(avgScore).color  },
    { label: 'Elevated Risk',      value: highRisk,  sub: `${total ? Math.round((highRisk/total)*100) : 0}% of portfolio`, icon: '&#9650;', accentStart: 'var(--color-very-high)', valueColor: 'var(--color-very-high)'    },
    { label: 'Pending Apps',       value: pendingApps,sub: 'Require attention',                  icon: '&#9671;', accentStart: 'var(--color-warning)',                         valueColor: 'var(--color-warning)'       },
  ];

  return (
    <div>
      {usingDemo && (
        <div className="disclaimer mb-3">
          <span className="disclaimer-icon">&#9888;</span>
          No businesses in database yet — showing simulated demo data. Add a business in My Business to use live data.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid-4 mb-3">
        {statCards.map((c, i) => (
          <div key={i} className="stat-card fade-in" style={{ '--accent-start': c.accentStart, '--accent-end': c.accentStart, animationDelay: `${i * 0.05}s` }}>
            <div className="stat-icon" style={{ background: `${c.accentStart}18` }}>
              <span style={{ color: c.accentStart }} dangerouslySetInnerHTML={{ __html: c.icon }} />
            </div>
            <div className="stat-label">{c.label}</div>
            <div className="stat-value" style={{ color: c.valueColor }}>{c.value}</div>
            <div className="stat-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Donut + activity */}
      <div className="grid-2 mb-3" style={{ gridTemplateColumns: '1fr 1.6fr' }}>
        <div className="card">
          <div className="card-header">
            <h3>Risk Distribution</h3>
            <span className={`badge ${usingDemo ? 'badge-simulated' : 'badge-success'}`}>
              {usingDemo ? 'Demo' : 'Live DB'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <DonutChart segments={donutSegments} size={130} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, lineHeight: 1 }}>{total}</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              {donutSegments.map(seg => (
                <div key={seg.label} style={{ marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: seg.color, display: 'inline-block' }} />
                      {seg.label}
                    </span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: seg.color }}>{catCounts[seg.label] || 0}</span>
                  </div>
                  <MiniBar value={seg.pct} color={seg.color} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Recent Activity</h3><span className="badge badge-muted">Last 7 days</span></div>
          <div className="timeline">
            {recentActivity.map((item, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-dot" style={{ borderColor: item.color, color: item.color, background: `${item.color}15` }}
                  dangerouslySetInnerHTML={{ __html: item.icon }} />
                <div style={{ paddingTop: '2px' }}>
                  <div style={{ fontSize: '0.82rem' }}>{item.text}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Portfolio table */}
      <div className="card">
        <div className="card-header">
          <h3>MSME Portfolio</h3>
          <span className={`badge ${usingDemo ? 'badge-simulated' : 'badge-primary'}`}>
            {usingDemo ? '&#9888; Simulated Data' : '&#9906; Live Database'}
          </span>
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
              {businesses.map(b => {
                const cat = getCategory(b.assessment?.overallScore ?? 0);
                return (
                  <tr key={b.id} className="clickable" onClick={() => onSelectBusiness(b)}>
                    <td style={{ fontWeight: 600 }}>{b.name}</td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{b.sector?.replace('_', ' ')}</td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{b.location}</td>
                    <td><span style={{ fontWeight: 800, fontSize: '1rem', color: cat.color }}>{b.assessment?.overallScore ?? 0}</span></td>
                    <td><span className={`badge ${cat.badge}`}>{cat.label}</span></td>
                    <td><div style={{ width: 64 }}><MiniBar value={b.assessment?.overallScore ?? 0} color={cat.color} /></div></td>
                    <td style={{ color: 'var(--color-text-tertiary)', fontSize: '0.78rem' }}>{b.assessment?.lastAssessed ?? '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); onSelectBusiness(b); }}>
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
          {usingDemo ? 'Simulated demo data — not live climate observations.' : 'Scores from SQLite database. Last assessment date shown. Click a row to view the full breakdown.'}
        </div>
      </div>
    </div>
  );
}
