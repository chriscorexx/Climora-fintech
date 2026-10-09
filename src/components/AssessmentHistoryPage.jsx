import React, { useState, useEffect } from 'react';
import { ownerBusiness } from '../data/demoData.js';

const ipc = window.climora;

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

const DIM_KEYS = ['flood_score', 'rainfall_score', 'heat_score', 'business_score', 'financial_score'];
const DIM_LABELS = {
  flood_score:     'Flood',
  rainfall_score:  'Rainfall',
  heat_score:      'Heat',
  business_score:  'Business',
  financial_score: 'Financial',
};

// Normalise a DB row into the shape used for display
function normaliseRow(row, index, total) {
  return {
    date:         (row.assessed_at ?? row.date ?? '').slice(0, 10),
    overallScore: row.overall_score ?? row.overallScore ?? 0,
    category:     row.category ?? getLabel(row.overall_score ?? 0),
    note:         row.note ?? '',
    isLive:       row.data_source === 'live',
    dimensions: {
      flood:    row.flood_score    ?? row.dimensions?.flood    ?? null,
      rainfall: row.rainfall_score ?? row.dimensions?.rainfall ?? null,
      heat:     row.heat_score     ?? row.dimensions?.heat     ?? null,
      business: row.business_score ?? row.dimensions?.business ?? null,
      financial:row.financial_score?? row.dimensions?.financial?? null,
    },
  };
}

function MiniRing({ score, size = 56, stroke = 6 }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const col  = getColor(score);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--color-bg-tertiary)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.75rem', fontWeight: 800, color: col }}>
        {score}
      </div>
    </div>
  );
}

export default function AssessmentHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compareA, setCompareA] = useState(0);
  const [compareB, setCompareB] = useState(0);
  const [usingDemo, setUsingDemo] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (ipc) {
        // Get the first persisted business
        const bizRes = await ipc.listBusinesses();
        if (bizRes.ok && bizRes.data.length > 0) {
          const histRes = await ipc.getHistory(bizRes.data[0].id);
          if (histRes.ok && histRes.data.length > 0) {
            const rows = histRes.data.map((r, i) => normaliseRow(r, i, histRes.data.length));
            setHistory(rows);
            setCompareA(0);
            setCompareB(Math.min(1, rows.length - 1));
            setLoading(false);
            return;
          }
        }
      }
      // Fallback to demo data
      const rows = ownerBusiness.assessmentHistory.map((r, i) =>
        normaliseRow({ ...r, overall_score: r.overallScore, flood_score: r.dimensions?.flood, rainfall_score: r.dimensions?.rainfall, heat_score: r.dimensions?.heat, business_score: r.dimensions?.business, financial_score: r.dimensions?.financial }, i, ownerBusiness.assessmentHistory.length)
      );
      setHistory(rows);
      setCompareA(0);
      setCompareB(Math.min(1, rows.length - 1));
      setUsingDemo(true);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--color-text-secondary)' }}>
        Loading history...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">&#9906;</div>
          <h3>No assessment history yet</h3>
          <p>Run your first assessment from My Dashboard or the Risk Assessment page to start building history.</p>
        </div>
      </div>
    );
  }

  const a = history[compareA];
  const b = history[Math.min(compareB, history.length - 1)];

  return (
    <div>
      {usingDemo && (
        <div className="disclaimer mb-3">
          <span className="disclaimer-icon">&#9888;</span>
          Showing simulated demo history. Run an assessment in Electron to build real history from SQLite.
        </div>
      )}

      {/* Timeline */}
      <div className="card mb-3">
        <div className="card-header">
          <h3>Score History</h3>
          <span className={`badge ${usingDemo ? 'badge-simulated' : 'badge-success'}`}>
            {usingDemo ? 'Demo data' : 'From database'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 0, position: 'relative', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          <div style={{ position: 'absolute', top: 28, left: 28, right: 28, height: 2, background: 'var(--color-border)', zIndex: 0 }} />
          {history.map((entry, i) => {
            const col   = getColor(entry.overallScore);
            const isLast = i === history.length - 1;
            const delta  = i > 0 ? entry.overallScore - history[i - 1].overallScore : null;
            return (
              <div key={i} style={{ flex: 1, minWidth: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                {delta !== null && (
                  <div style={{ position: 'absolute', top: -10, fontSize: '0.65rem', fontWeight: 700,
                    color: delta > 0 ? 'var(--color-danger)' : delta < 0 ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>
                    {delta > 0 ? '+' : ''}{delta !== 0 ? delta : ''}
                  </div>
                )}
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--color-card)',
                  border: `3px solid ${col}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: col, lineHeight: 1 }}>{entry.overallScore}</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: col }}>{entry.category}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', marginTop: '0.1rem' }}>{entry.date}</div>
                  {isLast && <span className="badge badge-primary" style={{ marginTop: '0.3rem', fontSize: '0.58rem' }}>Current</span>}
                  {entry.isLive && <span className="badge badge-success" style={{ marginTop: '0.3rem', fontSize: '0.58rem' }}>Live</span>}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {history.map((entry, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.6rem 0.85rem',
              background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', alignItems: 'flex-start' }}>
              <MiniRing score={entry.overallScore} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.1rem' }}>{entry.date}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{entry.note || 'No note recorded'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compare */}
      {history.length >= 2 && (
        <div className="card">
          <div className="card-header"><h3>Compare Two Assessments</h3></div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            {[['Assessment A', compareA, setCompareA], ['Assessment B', compareB, setCompareB]].map(([lbl, val, setter]) => (
              <div key={lbl} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lbl}</label>
                <select className="select" style={{ width: 200 }} value={val} onChange={e => setter(Number(e.target.value))}>
                  {history.map((h, i) => <option key={i} value={i}>{h.date} — {h.overallScore}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Dimension</th>
                  <th>{a.date}</th>
                  <th>{b.date}</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 700 }}>Overall</td>
                  <td style={{ fontWeight: 800, color: getColor(a.overallScore) }}>{a.overallScore}</td>
                  <td style={{ fontWeight: 800, color: getColor(b.overallScore) }}>{b.overallScore}</td>
                  <td>{(() => { const d = b.overallScore - a.overallScore; return <span style={{ fontWeight: 700, color: d > 0 ? 'var(--color-danger)' : d < 0 ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>{d > 0 ? '+' : ''}{d || '—'}</span>; })()}</td>
                </tr>
                {Object.keys(a.dimensions).map(key => {
                  const sA = a.dimensions[key], sB = b.dimensions[key];
                  const d = sA != null && sB != null ? sB - sA : null;
                  return (
                    <tr key={key}>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem', textTransform: 'capitalize' }}>{key}</td>
                      <td style={{ color: sA != null ? getColor(sA) : 'var(--color-text-tertiary)', fontWeight: 600 }}>{sA ?? '—'}</td>
                      <td style={{ color: sB != null ? getColor(sB) : 'var(--color-text-tertiary)', fontWeight: 600 }}>{sB ?? '—'}</td>
                      <td>{d != null ? <span style={{ fontWeight: 700, fontSize: '0.82rem', color: d > 0 ? 'var(--color-danger)' : d < 0 ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>{d > 0 ? '+' : ''}{d || '—'}</span> : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="disclaimer" style={{ marginTop: '1.25rem' }}>
        <span className="disclaimer-icon">&#9888;</span>
        Score changes reflect updates to input data or climate indicators — not necessarily real climate changes. All scores are illustrative.
      </div>
    </div>
  );
}
