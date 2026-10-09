import React, { useCallback, useState } from 'react';
import { api } from '../services/apiClient.js';
import { useAsync } from '../hooks/useAsync.js';
import { useData } from '../services/DataProvider.jsx';
import {
  categoryColor,
  DATA_AVAILABILITY_LABEL,
  formatDate,
  formatDimension,
  formatIndustry,
  formatMoney,
  formatSize,
} from '../services/mappers.js';
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState } from './ui.jsx';

function getCategoryBadge(category) {
  const map = {
    Low: 'badge-low',
    Moderate: 'badge-moderate',
    High: 'badge-high',
    'Very High': 'badge-very-high',
  };
  return map[category] || 'badge-muted';
}

function ScoreRing({ score, size = 130, strokeWidth = 11 }) {
  const color = categoryColor(score >= 75 ? 'Very High' : score >= 50 ? 'High' : score >= 25 ? 'Moderate' : 'Low');
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} role="img" aria-label={`Overall risk score ${score} of 100`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-bg-tertiary)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(0.34,1.56,0.64,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: '0.62rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          / 100
        </span>
      </div>
    </div>
  );
}

function FactorRow({ factor, weight }) {
  const score = factor.score;
  const missing = score === null || score === undefined;
  const color = missing ? 'var(--color-text-tertiary)' : categoryColor(score >= 75 ? 'Very High' : score >= 50 ? 'High' : score >= 25 ? 'Moderate' : 'Low');
  const effective = Math.round((factor.effectiveWeight ?? weight ?? 0) * 100);

  if (missing) {
    return (
      <div className="card card-sm" style={{ opacity: 0.6, marginBottom: '0.65rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{formatDimension(factor.dimension)}</span>
          <Badge variant="default">Missing</Badge>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.3rem' }}>
          No provider data for this location. It is excluded from the score — never scored as zero.
        </p>
      </div>
    );
  }

  return (
    <div className="card card-sm" style={{ marginBottom: '0.65rem', borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{formatDimension(factor.dimension)}</span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '1rem', fontWeight: 800, color }}>{score}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>wt. {effective}%</span>
          <Badge variant={
            score >= 75 ? 'veryHigh' : score >= 50 ? 'high' : score >= 25 ? 'moderate' : 'low'
          }>
            {score >= 75 ? 'Very High' : score >= 50 ? 'High' : score >= 25 ? 'Moderate' : 'Low'}
          </Badge>
        </div>
      </div>
      <div className="progress-track" style={{ height: 6, marginBottom: '0.4rem' }}>
        <div className="progress-fill" style={{ width: `${score}%`, background: color }} />
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', lineHeight: 1.45 }}>{factor.explanation}</p>
      {factor.sourceTimestamp && (
        <p style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: '0.25rem' }}>
          Source: {DATA_AVAILABILITY_LABEL[factor.dataAvailability] || factor.dataAvailability} · {formatDate(factor.sourceTimestamp)}
        </p>
      )}
    </div>
  );
}

export default function RiskAssessment({ businessId, onBack }) {
  const { weights, config, refreshDashboard } = useData();
  const [showWeights, setShowWeights] = useState(false);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState(null);

  const businessState = useAsync(() => api.getBusiness(businessId), { deps: [businessId], immediate: Boolean(businessId) });
  const historyState = useAsync(() => api.listBusinessAssessments(businessId, { limit: 20 }), {
    deps: [businessId],
    immediate: Boolean(businessId),
  });
  const improvementsState = useAsync(() => api.improvements(businessId), { deps: [businessId], immediate: Boolean(businessId) });

  const reloadAll = useCallback(() => {
    businessState.reload();
    historyState.reload();
    improvementsState.reload();
    refreshDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, refreshDashboard]);

  const business = businessState.data?.business;

  const handleRunAssessment = async () => {
    setRunning(true);
    setRunError(null);
    try {
      await api.createAssessment(businessId, { forceDemo: false });
      await reloadAll();
    } catch (err) {
      setRunError(err);
    } finally {
      setRunning(false);
    }
  };

  if (!businessId) {
    return <EmptyState title="No business selected" message="Pick an MSME from the portfolio to view its assessment." />;
  }

  if (businessState.loading) return <LoadingState label="Loading business profile…" rows={3} />;
  if (businessState.error) return <ErrorState error={businessState.error} onRetry={reloadAll} />;
  if (!business) return <ErrorState error={{ message: 'Business profile not found.' }} onRetry={reloadAll} />;

  const assessments = historyState.data?.assessments || [];
  const latest = assessments.find((assessment) => assessment.factors?.length) || assessments[0] || null;
  const factors = latest?.factors || [];
  const category = latest?.category;
  const actions = improvementsState.data?.improvementActions || [];
  const weightsMap = weights || config?.risk?.weights || {};

  return (
    <div>
      <button className="btn btn-secondary btn-sm" style={{ marginBottom: '1.25rem' }} onClick={onBack}>
        &#8592; Back to Overview
      </button>

      {/* ── Business header ── */}
      <Card className="mb-3">
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <ScoreRing score={latest?.overallScore ?? 0} />
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0 }}>{business.name}</h2>
              {category && <span className={`badge ${getCategoryBadge(category)}`}>{category} Risk</span>}
              {business.isDemo && <Badge variant="simulated">Demo record</Badge>}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
              {formatIndustry(business.industry, config?.sectors)} &middot; {business.location} &middot;{' '}
              {business.employeeCount ?? '—'} employees &middot; {formatSize(business.businessSize)}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-tertiary)' }}>
              Last assessed: {latest?.assessedAt ? formatDate(latest.assessedAt) : 'never'} &middot; Annual turnover:{' '}
              {formatMoney(business.annualTurnover, { compact: true })}
            </div>
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <Button variant="primary" size="sm" onClick={handleRunAssessment} disabled={running}>
              {running ? 'Running…' : '▶ Run Assessment'}
            </Button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowWeights(!showWeights)}
              style={{ display: 'block', width: '100%' }}
              aria-expanded={showWeights}
            >
              {showWeights ? '▲ Hide' : '▼ Weights'}
            </button>
          </div>
        </div>

        {runError && (
          <div style={{ marginTop: '1rem' }}>
            <ErrorState error={runError} onRetry={handleRunAssessment} />
          </div>
        )}

        {running && (
          <div style={{ marginTop: '1rem' }}>
            <LoadingState label="Fetching live Open-Meteo data and scoring…" rows={1} />
          </div>
        )}

        {!running && !latest && (
          <div style={{ marginTop: '1rem' }}>
            <EmptyState
              title="Not assessed yet"
              message="Run an assessment to fetch live climate data for this location and compute a risk score."
              action={
                <Button variant="primary" size="sm" onClick={handleRunAssessment}>
                  ▶ Run first assessment
                </Button>
              }
            />
          </div>
        )}
      </Card>

      <div className="grid-2" style={{ gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* ── Left: breakdown ── */}
        <div>
          <h3 style={{ marginBottom: '0.85rem' }}>Risk Factor Breakdown</h3>
          {latest?.isIncomplete && (
            <div className="state-block" style={{ marginBottom: '0.75rem' }} role="status">
              <p className="state-label" style={{ margin: 0 }}>
                &#9888; Incomplete assessment — missing{' '}
                {(latest.missingDimensions || []).map(formatDimension).join(', ')}. Remaining dimensions were
                proportionally reweighted; missing data is never treated as zero risk.
              </p>
            </div>
          )}
          {factors.length === 0 ? (
            <EmptyState title="No factor data" message="Run an assessment to populate the factor breakdown." />
          ) : (
            factors.map((factor) => (
              <FactorRow key={factor.dimension} factor={factor} weight={weightsMap[factor.dimension]} />
            ))
          )}

          {showWeights && (
            <div className="card" style={{ marginTop: '0.65rem' }}>
              <h4 style={{ marginBottom: '0.75rem' }}>Model Weights</h4>
              {Object.entries(weightsMap).map(([key, w]) => (
                <div key={key} style={{ marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{formatDimension(key)}</span>
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
          {improvementsState.loading ? (
            <LoadingState label="Loading recommendations…" rows={2} />
          ) : improvementsState.error ? (
            <ErrorState error={improvementsState.error} onRetry={improvementsState.reload} />
          ) : actions.length === 0 ? (
            <EmptyState title="No actions yet" message="Run an assessment to generate tailored improvement actions." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
              {actions.map((action) => (
                <div
                  key={action.id}
                  style={{
                    padding: '0.85rem 1rem',
                    background: 'var(--color-bg-tertiary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.35rem',
                      gap: '0.5rem',
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{action.title}</span>
                    <Badge variant={action.priority === 'High' ? 'high' : action.priority === 'Medium' ? 'moderate' : 'low'}>
                      {action.priority}
                    </Badge>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{action.description}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: '0.3rem' }}>
                    Status: {action.status.replace('_', ' ')}
                  </p>
                </div>
              ))}
            </div>
          )}

          <Card>
            <h4 style={{ marginBottom: '0.75rem' }}>Data Sources &amp; Limitations</h4>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {latest ? (
                <>
                  {factors.some((factor) => factor.dataAvailability === 'live_forecast') && <Badge variant="demo">Live Open-Meteo</Badge>}
                  {factors.every((factor) => factor.dataAvailability === 'derived') && <Badge variant="simulated">Derived only</Badge>}
                  {latest.isIncomplete ? <Badge variant="moderate">Incomplete data</Badge> : <Badge variant="low">Complete data</Badge>}
                </>
              ) : (
                <Badge variant="default">No assessment yet</Badge>
              )}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
              {latest?.dataNote || 'Run an assessment to see the data provenance for this score.'}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
              Weights: Flood 30% &middot; Rainfall 25% &middot; Heat 20% &middot; Business 15% &middot; Financial 10%. Climate data is
              provided by Open-Meteo under CC BY 4.0. Forecasts are short-term predictions, not long-run climate risk.
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', lineHeight: 1.5, fontStyle: 'italic' }}>
              Disclaimer: This score is an illustrative prototype heuristic, not a validated credit rating, calibrated
              probability of default, or official financial recommendation. It must not be used as the sole basis for
              lending decisions.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
