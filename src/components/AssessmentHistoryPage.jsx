import React, { useEffect, useState } from 'react';
import { useCurrentBusiness } from '../services/DataProvider.jsx';
import { api } from '../services/apiClient.js';
import { useAsync } from '../hooks/useAsync.js';
import { categoryColor, formatDate, formatDimension } from '../services/mappers.js';
import { Button, Card, EmptyState, ErrorState, LoadingState } from './ui.jsx';

const DIMENSION_ORDER = ['flood', 'rainfall', 'heat', 'business', 'financial'];

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

function MiniRing({ score, label, size = 56, stroke = 6 }) {
  const color = getColor(score);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = ((score ?? 0) / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} role="img" aria-label={`${label}: ${score ?? 'no data'}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-bg-tertiary)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: 800,
          color,
        }}
      >
        {score ?? '—'}
      </div>
    </div>
  );
}

/** Loads full detail (including factors) for a single assessment id. */
function useAssessmentDetail(assessmentId) {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!assessmentId) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getAssessment(assessmentId)
      .then((payload) => {
        if (!cancelled) setDetail(payload?.assessment || null);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [assessmentId]);

  return { detail, error, loading };
}

export default function AssessmentHistoryPage() {
  const { business } = useCurrentBusiness();
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');

  const state = useAsync(
    () => (business ? api.listBusinessAssessments(business.id, { limit: 50 }) : Promise.resolve({ assessments: [] })),
    { deps: [business?.id], immediate: Boolean(business) }
  );

  const assessments = state.data?.assessments || [];
  // Newest first from the API; show chronologically in the timeline.
  const chronological = [...assessments].reverse();

  const detailA = useAssessmentDetail(compareA || null);
  const detailB = useAssessmentDetail(compareB || null);

  const dimensionsOf = (payload) => {
    const map = {};
    for (const factor of payload?.factors || []) map[factor.dimension] = factor.score;
    return map;
  };

  if (!business) {
    return (
      <Card>
        <EmptyState title="No business profile" message="Create a business profile to track assessment history." />
      </Card>
    );
  }

  if (state.loading) return <LoadingState label="Loading assessment history…" rows={3} />;
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;

  const compareLoading = detailA.loading || detailB.loading;
  const dimsA = dimensionsOf(detailA.detail);
  const dimsB = dimensionsOf(detailB.detail);

  return (
    <div>
      {/* Timeline overview */}
      <div className="card mb-3">
        <div className="card-header">
          <h3>Score History</h3>
          <span className={assessments.length ? 'badge badge-demo' : 'badge badge-muted'}>
            {assessments.length ? 'Backend records' : 'No records'}
          </span>
        </div>

        {chronological.length === 0 ? (
          <EmptyState
            title="No assessments yet"
            message="Run an assessment from the lender Risk Assessment view to start recording history."
          />
        ) : (
          <div style={{ display: 'flex', gap: '0', position: 'relative', overflowX: 'auto', padding: '0.5rem 0' }}>
            <div style={{ position: 'absolute', top: 28, left: 28, right: 28, height: 2, background: 'var(--color-border)', zIndex: 0 }} />

            {chronological.map((entry, index) => {
              const color = getColor(entry.overallScore);
              const isLast = index === chronological.length - 1;
              const previous = chronological[index - 1];
              const delta = previous ? entry.overallScore - previous.overallScore : null;
              return (
                <div
                  key={entry.id}
                  style={{ flex: 1, minWidth: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'var(--color-card)',
                      border: `3px solid ${color}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      marginBottom: '0.6rem',
                    }}
                  >
                    <span style={{ fontSize: '1rem', fontWeight: 800, color, lineHeight: 1 }}>{entry.overallScore}</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color }}>{getLabel(entry.overallScore)}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-tertiary)', marginTop: '0.15rem' }}>
                      {formatDate(entry.createdAt)}
                    </div>
                    {isLast && (
                      <span className="badge badge-primary" style={{ marginTop: '0.3rem', fontSize: '0.6rem' }}>
                        Current
                      </span>
                    )}
                    {entry.isIncomplete && (
                      <span className="badge badge-moderate" style={{ marginTop: '0.3rem', fontSize: '0.6rem' }}>
                        Partial
                      </span>
                    )}
                  </div>
                  {delta !== null && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -8,
                        right: '50%',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: delta > 0 ? 'var(--color-danger)' : 'var(--color-success)',
                      }}
                    >
                      {delta > 0 ? '+' : ''}{delta}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Compare two assessments */}
      {assessments.length >= 2 && (
        <div className="card mb-3">
          <div className="card-header">
            <h3>Compare Assessments</h3>
            {(detailA.detail || detailB.detail) && (
              <span className="badge badge-muted">Dimension-level detail</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <div>
              <label htmlFor="compare-a" style={{ display: 'block', fontSize: '0.72rem', color: 'var(--color-text-tertiary)', marginBottom: '0.25rem' }}>
                Assessment A (earlier)
              </label>
              <select id="compare-a" className="select" style={{ width: 240 }} value={compareA} onChange={(event) => setCompareA(event.target.value)}>
                <option value="">Select…</option>
                {assessments.map((assessment) => (
                  <option key={assessment.id} value={assessment.id}>
                    {formatDate(assessment.createdAt)} — score {assessment.overallScore}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="compare-b" style={{ display: 'block', fontSize: '0.72rem', color: 'var(--color-text-tertiary)', marginBottom: '0.25rem' }}>
                Assessment B (later)
              </label>
              <select id="compare-b" className="select" style={{ width: 240 }} value={compareB} onChange={(event) => setCompareB(event.target.value)}>
                <option value="">Select…</option>
                {assessments.map((assessment) => (
                  <option key={assessment.id} value={assessment.id}>
                    {formatDate(assessment.createdAt)} — score {assessment.overallScore}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {detailA.error || detailB.error ? (
            <ErrorState error={detailA.error || detailB.error} />
          ) : compareLoading ? (
            <LoadingState label="Loading assessment detail…" rows={3} />
          ) : !detailA.detail || !detailB.detail ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
              Select two assessments above to compare their dimension scores.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Dimension</th>
                    <th>A · {formatDate(detailA.detail.createdAt)}</th>
                    <th>B · {formatDate(detailB.detail.createdAt)}</th>
                    <th>Change</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Overall score</td>
                    <td style={{ fontWeight: 800, color: categoryColor(detailA.detail.category) }}>{detailA.detail.overallScore}</td>
                    <td style={{ fontWeight: 800, color: categoryColor(detailB.detail.category) }}>{detailB.detail.overallScore}</td>
                    <td style={{ fontWeight: 700, color: detailB.detail.overallScore > detailA.detail.overallScore ? 'var(--color-danger)' : 'var(--color-success)' }}>
                      {detailB.detail.overallScore - detailA.detail.overallScore > 0 ? '+' : ''}
                      {detailB.detail.overallScore - detailA.detail.overallScore}
                    </td>
                  </tr>
                  {DIMENSION_ORDER.map((dimension) => {
                    const a = dimsA[dimension] ?? null;
                    const b = dimsB[dimension] ?? null;
                    const delta = a !== null && b !== null ? b - a : null;
                    return (
                      <tr key={dimension}>
                        <td>{formatDimension(dimension)}</td>
                        <td style={{ color: getColor(a) }}>{a ?? 'No data'}</td>
                        <td style={{ color: getColor(b) }}>{b ?? 'No data'}</td>
                        <td style={{ color: delta === null ? 'var(--color-text-tertiary)' : delta > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                          {delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Detail list */}
      <div className="card">
        <div className="card-header">
          <h3>Recorded Assessments</h3>
          <span className="badge badge-muted">{assessments.length} records</span>
        </div>
        {assessments.map((assessment) => (
          <div key={assessment.id} className="checklist-item" style={{ cursor: 'default' }}>
            <MiniRing score={assessment.overallScore} label="score" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                {assessment.overallScore}/100 · {assessment.category}
                {assessment.isIncomplete && (
                  <span className="badge badge-moderate" style={{ marginLeft: '0.5rem' }}>
                    Incomplete
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)' }}>
                {formatDate(assessment.createdAt, { time: true })} · {assessment.id}
              </div>
              {assessment.missingDimensions?.length > 0 && (
                <div style={{ fontSize: '0.7rem', color: 'var(--color-warning)' }}>
                  Missing: {assessment.missingDimensions.map(formatDimension).join(', ')}
                </div>
              )}
            </div>
            <Button size="sm" onClick={() => { setCompareA(assessment.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              Compare
            </Button>
          </div>
        ))}
      </div>

      <div className="disclaimer" style={{ marginTop: '1.25rem' }}>
        <span className="disclaimer-icon">&#9888;</span>
        Score changes between assessments reflect changing forecast conditions and profile updates, not necessarily real
        changes in climate risk. Scores are illustrative prototype heuristics.
      </div>
    </div>
  );
}
