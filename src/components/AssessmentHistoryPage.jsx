import React, { useState } from 'react';
import { ownerBusiness } from '../data/demoData.js';

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

const DIM_LABELS = {
  flood:     'Flood',
  rainfall:  'Rainfall',
  heat:      'Heat',
  business:  'Business',
  financial: 'Financial',
};

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
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.75rem', fontWeight: 800, color: col,
      }}>
        {score}
      </div>
    </div>
  );
}

export default function AssessmentHistoryPage() {
  const history  = ownerBusiness.assessmentHistory;
  const [compareA, setCompareA] = useState(0);
  const [compareB, setCompareB] = useState(history.length - 1);

  const a = history[compareA];
  const b = history[compareB];

  const dims = Object.keys(DIM_LABELS);

  return (
    <div>
      {/* Timeline overview */}
      <div className="card mb-3">
        <div className="card-header">
          <h3>Score History</h3>
          <span className="badge badge-simulated">&#9888; Simulated Data</span>
        </div>

        <div style={{ display: 'flex', gap: '0', position: 'relative' }}>
          {/* Connecting line */}
          <div style={{
            position: 'absolute',
            top: 28,
            left: 28,
            right: 28,
            height: 2,
            background: 'var(--color-border)',
            zIndex: 0,
          }} />

          {history.map((entry, i) => {
            const col = getColor(entry.overallScore);
            const isLast = i === history.length - 1;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                {/* Node */}
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'var(--color-card)',
                  border: `3px solid ${col}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column',
                  marginBottom: '0.6rem',
                }}>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: col, lineHeight: 1 }}>{entry.overallScore}</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: col }}>{getLabel(entry.overallScore)}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--color-text-tertiary)', marginTop: '0.15rem' }}>
                    {entry.date}
                  </div>
                  {isLast && (
                    <span className="badge badge-primary" style={{ marginTop: '0.3rem', fontSize: '0.6rem' }}>Current</span>
                  )}
                </div>
                {/* Delta from previous */}
                {i > 0 && (() => {
                  const delta = entry.overallScore - history[i - 1].overallScore;
                  return (
                    <div style={{
                      position: 'absolute', top: -8, right: '50%',
                      fontSize: '0.65rem', fontWeight: 700,
                      color: delta > 0 ? 'var(--color-danger)' : 'var(--color-success)',
                    }}>
                      {delta > 0 ? '+' : ''}{delta}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>

        {/* Notes */}
        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {history.map((entry, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.6rem 0.85rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', alignItems: 'flex-start' }}>
              <MiniRing score={entry.overallScore} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.15rem' }}>{entry.date}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>{entry.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Side-by-side comparison */}
      <div className="card mb-3">
        <div className="card-header">
          <h3>Compare Two Assessments</h3>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Assessment A</label>
            <select className="select" style={{ width: 200 }} value={compareA} onChange={e => setCompareA(Number(e.target.value))}>
              {history.map((h, i) => <option key={i} value={i}>{h.date}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Assessment B</label>
            <select className="select" style={{ width: 200 }} value={compareB} onChange={e => setCompareB(Number(e.target.value))}>
              {history.map((h, i) => <option key={i} value={i}>{h.date}</option>)}
            </select>
          </div>
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
              {/* Overall row */}
              <tr>
                <td style={{ fontWeight: 700 }}>Overall Score</td>
                <td>
                  <span style={{ fontWeight: 800, fontSize: '1.05rem', color: getColor(a.overallScore) }}>{a.overallScore}</span>
                  <span className={`badge ml-1`} style={{ marginLeft: '0.4rem', background: `${getColor(a.overallScore)}18`, color: getColor(a.overallScore) }}>{getLabel(a.overallScore)}</span>
                </td>
                <td>
                  <span style={{ fontWeight: 800, fontSize: '1.05rem', color: getColor(b.overallScore) }}>{b.overallScore}</span>
                  <span style={{ marginLeft: '0.4rem', background: `${getColor(b.overallScore)}18`, color: getColor(b.overallScore), padding: '0.1rem 0.4rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700 }}>{getLabel(b.overallScore)}</span>
                </td>
                <td>
                  {(() => {
                    const d = b.overallScore - a.overallScore;
                    return (
                      <span style={{ fontWeight: 700, color: d > 0 ? 'var(--color-danger)' : d < 0 ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>
                        {d > 0 ? '+' : ''}{d !== 0 ? d : '—'}
                      </span>
                    );
                  })()}
                </td>
              </tr>
              {dims.map(key => {
                const scoreA = a.dimensions[key] ?? 0;
                const scoreB = b.dimensions[key] ?? 0;
                const delta  = scoreB - scoreA;
                return (
                  <tr key={key}>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem' }}>{DIM_LABELS[key]}</td>
                    <td style={{ color: getColor(scoreA), fontWeight: 600 }}>{scoreA}</td>
                    <td style={{ color: getColor(scoreB), fontWeight: 600 }}>{scoreB}</td>
                    <td>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: delta > 0 ? 'var(--color-danger)' : delta < 0 ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>
                        {delta > 0 ? '+' : ''}{delta !== 0 ? delta : '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="disclaimer">
        <span className="disclaimer-icon">&#9888;</span>
        All historical scores are simulated demo values. Score changes between assessments do not necessarily reflect real climate changes — they illustrate how the prototype would behave as input data is updated.
      </div>
    </div>
  );
}
