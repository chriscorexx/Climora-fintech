import React, { useState, useEffect } from 'react';
import { demoBusinesses, businessSectors } from '../data/demoData.js';

const ipc = window.climora;

function getCategory(score) {
  if (score <= 24) return { label: 'Low',       badge: 'badge-low',       color: 'var(--color-low)'       };
  if (score <= 49) return { label: 'Moderate',  badge: 'badge-moderate',  color: 'var(--color-moderate)'  };
  if (score <= 74) return { label: 'High',       badge: 'badge-high',      color: 'var(--color-high)'      };
  return              { label: 'Very High',  badge: 'badge-very-high', color: 'var(--color-very-high)' };
}

function fmt(n) {
  if (!n) return '—';
  return '$' + (n / 1_000_000).toFixed(1) + 'M';
}

function normaliseDbBusiness(row) {
  return {
    id:            row.id,
    name:          row.name,
    sector:        row.sector,
    location:      row.location,
    employeeCount: row.employee_count,
    revenue:       row.revenue,
    assessment: {
      overallScore: row._score       ?? 0,
      lastAssessed: row._assessed_at ?? '—',
    },
    _fromDb: true,
  };
}

export default function PortfolioPage({ onSelectBusiness }) {
  const [businesses, setBusinesses] = useState([]);
  const [usingDemo, setUsingDemo]   = useState(false);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [sectorF, setSectorF]       = useState('all');
  const [riskF, setRiskF]           = useState('all');
  const [view, setView]             = useState('table');

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (ipc) {
        const res = await ipc.listBusinesses();
        if (res.ok && res.data.length > 0) {
          const enriched = await Promise.all(res.data.map(async b => {
            const hist = await ipc.getHistory(b.id);
            const latest = hist.ok && hist.data.length > 0 ? hist.data[0] : null;
            return { ...b, _score: latest?.overall_score ?? 0, _assessed_at: latest?.assessed_at?.slice(0, 10) ?? '—' };
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

  const filtered = businesses.filter(b => {
    const q = search.toLowerCase();
    const matchSearch = !q || b.name.toLowerCase().includes(q) || b.location.toLowerCase().includes(q);
    const matchSector = sectorF === 'all' || b.sector === sectorF;
    const matchRisk   = riskF   === 'all' || getCategory(b.assessment?.overallScore ?? 0).label === riskF;
    return matchSearch && matchSector && matchRisk;
  });

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--color-text-secondary)' }}>Loading...</div>;
  }

  return (
    <div>
      {usingDemo && (
        <div className="disclaimer mb-3">
          <span className="disclaimer-icon">&#9888;</span>
          No businesses in database — showing simulated demo data.
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 280 }}>
          <span style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', pointerEvents: 'none' }}>&#9906;</span>
          <input className="input" style={{ paddingLeft: '1.8rem' }} placeholder="Search by name or location..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select" style={{ width: 160 }} value={sectorF} onChange={e => setSectorF(e.target.value)}>
          <option value="all">All Sectors</option>
          {Object.entries(businessSectors).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="select" style={{ width: 150 }} value={riskF} onChange={e => setRiskF(e.target.value)}>
          <option value="all">All Risk Levels</option>
          {['Low', 'Moderate', 'High', 'Very High'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
          <button className={`btn btn-sm ${view === 'table' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('table')}>&#8803; Table</button>
          <button className={`btn btn-sm ${view === 'cards' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('cards')}>&#9638; Cards</button>
        </div>
        <span className="badge badge-primary">{filtered.length} / {businesses.length}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">&#9906;</div>
            <h3>No results</h3>
            <p>No businesses match the current filters.</p>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }}
              onClick={() => { setSearch(''); setSectorF('all'); setRiskF('all'); }}>
              Clear filters
            </button>
          </div>
        </div>
      ) : view === 'cards' ? (
        <div className="grid-auto-lg">
          {filtered.map(b => {
            const cat = getCategory(b.assessment?.overallScore ?? 0);
            return (
              <div key={b.id} className="card" style={{ cursor: 'pointer', borderLeft: `3px solid ${cat.color}` }}
                onClick={() => onSelectBusiness(b)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>{b.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-tertiary)' }}>
                      {businessSectors[b.sector]?.label || b.sector}
                    </div>
                  </div>
                  <span className={`badge ${cat.badge}`}>{cat.label}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
                  &#9906; {b.location}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: cat.color }}>{b.assessment?.overallScore ?? 0}</span>
                  <div className="progress-track" style={{ flex: 1, marginLeft: '0.75rem', height: 6 }}>
                    <div className="progress-fill" style={{ width: `${b.assessment?.overallScore ?? 0}%`, background: cat.color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Sector</th>
                  <th>Location</th>
                  <th>Employees</th>
                  <th>Revenue</th>
                  <th>Score</th>
                  <th>Category</th>
                  <th>Last Assessed</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => {
                  const cat = getCategory(b.assessment?.overallScore ?? 0);
                  return (
                    <tr key={b.id} className="clickable" onClick={() => onSelectBusiness(b)}>
                      <td style={{ fontWeight: 600 }}>{b.name}</td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{businessSectors[b.sector]?.label || b.sector}</td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{b.location}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{b.employeeCount ?? '—'}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{fmt(b.revenue)}</td>
                      <td><span style={{ fontWeight: 800, fontSize: '1rem', color: cat.color }}>{b.assessment?.overallScore ?? 0}</span></td>
                      <td><span className={`badge ${cat.badge}`}>{cat.label}</span></td>
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
        </div>
      )}

      <div className="disclaimer" style={{ marginTop: '1rem' }}>
        <span className="disclaimer-icon">&#9888;</span>
        {usingDemo ? 'All data is simulated demo data — not live climate observations.' : 'Scores loaded from SQLite. Run an assessment to refresh any business score.'}
      </div>
    </div>
  );
}
