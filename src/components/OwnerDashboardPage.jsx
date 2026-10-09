import React from 'react';
import { useData, useCurrentBusiness } from '../services/DataProvider.jsx';
import { api } from '../services/apiClient.js';
import { useAsync } from '../hooks/useAsync.js';
import { categoryColor, formatDate, formatDimension, formatIndustry } from '../services/mappers.js';
import { Button, Card, EmptyState, ErrorState, LoadingState } from './ui.jsx';

function getCategoryBadge(category) {
  const map = { Low: 'badge-low', Moderate: 'badge-moderate', High: 'badge-high', 'Very High': 'badge-very-high' };
  return map[category] || 'badge-muted';
}

function ScoreRing({ score, size = 110, strokeWidth = 9 }) {
  const cat = categoryColor(score >= 75 ? 'Very High' : score >= 50 ? 'High' : score >= 25 ? 'Moderate' : 'Low');
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} role="img" aria-label={`Overall risk score ${score} of 100`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-bg-tertiary)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={cat}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: cat, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: '0.58rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Risk
        </span>
      </div>
    </div>
  );
}

export default function OwnerDashboardPage({ setActivePage }) {
  const { sectors, businesses, loading, selectBusiness, refreshDashboard } = useData();
  const { business } = useCurrentBusiness();

  const historyState = useAsync(
    () => (business ? api.listBusinessAssessments(business.id, { limit: 5 }) : Promise.resolve({ assessments: [] })),
    { deps: [business?.id], immediate: Boolean(business) }
  );
  const actionsState = useAsync(
    () => (business ? api.improvements(business.id) : Promise.resolve({ improvementActions: [] })),
    { deps: [business?.id], immediate: Boolean(business) }
  );
  const readinessState = useAsync(
    () => (business ? api.loanReadiness(business.id) : Promise.resolve(null)),
    { deps: [business?.id], immediate: Boolean(business) }
  );

  const reloadAll = () => {
    historyState.reload();
    actionsState.reload();
    readinessState.reload();
    refreshDashboard();
  };

  if (loading && !business) return <LoadingState label="Loading your business…" rows={3} />;

  if (!business) {
    return (
      <Card>
        <EmptyState
          title="No business profile"
          message="Create your business profile so Climora can assess your climate exposure and loan readiness."
          action={
            <Button variant="primary" size="sm" onClick={() => setActivePage('myBusiness')}>
              Create profile
            </Button>
          }
        />
      </Card>
    );
  }

  const assessments = historyState.data?.assessments || [];
  const latest = assessments.find((assessment) => assessment.factors?.length) || assessments[0] || null;
  const actions = actionsState.data?.improvementActions || [];
  const readiness = readinessState.data?.loanReadiness || null;

  const completed = actions.filter((action) => action.status === 'done').length;
  const inProgress = actions.filter((action) => action.status === 'in_progress').length;
  const highPrio = actions.filter((action) => action.priority === 'High' && action.status !== 'done').length;

  const documents = readiness?.documentChecklist || [];
  const docsReady = documents.filter((document) => document.status === 'ready').length;

  const hazardOrder = ['flood', 'rainfall', 'heat', 'business'];
  const hazards = hazardOrder.map((dimension) => ({
    dimension,
    factor: latest?.factors?.find((factor) => factor.dimension === dimension) || null,
  }));

  const score = latest?.overallScore ?? null;
  const category = latest?.category || null;

  const statCards = [
    {
      label: 'Roadmap Progress',
      value: `${completed}/${actions.length}`,
      sub: 'Actions completed',
      icon: '&#9654;',
      color: 'var(--color-success)',
      page: 'roadmap',
    },
    { label: 'In Progress', value: inProgress, sub: 'Actions underway', icon: '&#9672;', color: 'var(--color-warning)', page: 'roadmap' },
    { label: 'High Priority', value: highPrio, sub: 'Actions remaining', icon: '&#9888;', color: 'var(--color-danger)', page: 'roadmap' },
    {
      label: 'Documents Ready',
      value: `${docsReady}/${documents.length}`,
      sub: 'Documents prepared',
      icon: '&#9671;',
      color: 'var(--color-info)',
      page: 'documents',
    },
  ];

  return (
    <div>
      {/* Hero: business overview */}
      <div className="card mb-3">
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {score === null ? (
            <div
              style={{
                width: 110,
                height: 110,
                borderRadius: '50%',
                border: '2px dashed var(--color-border-hover)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                color: 'var(--color-text-tertiary)',
                textAlign: 'center',
              }}
            >
              Not assessed
            </div>
          ) : (
            <ScoreRing score={score} />
          )}
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0 }}>{business.name}</h2>
              {category && <span className={`badge ${getCategoryBadge(category)}`}>{category} Risk</span>}
              {business.isDemo && <span className="badge badge-simulated">Demo record</span>}
            </div>
            <div style={{ fontSize: '0.83rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
              {formatIndustry(business.industry, sectors)} &middot; {business.location} &middot;{' '}
              {business.employeeCount ?? '—'} employees &middot; Last assessed {latest?.assessedAt ? formatDate(latest.assessedAt) : '—'}
            </div>

            {businesses.length > 1 && (
              <label className="sr-only" htmlFor="owner-business-select">
                Select business
              </label>
            )}
            {businesses.length > 1 && (
              <select
                id="owner-business-select"
                className="select"
                style={{ width: 'auto', maxWidth: 280, marginBottom: '0.75rem' }}
                value={business.id}
                onChange={(event) => selectBusiness(event.target.value)}
              >
                {businesses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            )}

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
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="stat-card"
            style={{ cursor: 'pointer', '--accent-start': stat.color, '--accent-end': stat.color }}
            onClick={() => setActivePage(stat.page)}
          >
            <div className="stat-icon" style={{ background: `${stat.color}18` }}>
              <span style={{ color: stat.color }} dangerouslySetInnerHTML={{ __html: stat.icon }} />
            </div>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value" style={{ color: stat.color, fontSize: '1.6rem' }}>{stat.value}</div>
            <div className="stat-sub">{stat.sub}</div>
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
          {historyState.loading ? (
            <LoadingState label="Loading hazard data…" rows={4} />
          ) : hazards.map(({ dimension, factor }) => {
            const value = factor?.score;
            const missing = value === null || value === undefined;
            const color = missing
              ? 'var(--color-text-tertiary)'
              : categoryColor(value >= 75 ? 'Very High' : value >= 50 ? 'High' : value >= 25 ? 'Moderate' : 'Low');
            return (
              <div key={dimension} style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{formatDimension(dimension)}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color }}>{missing ? 'No data' : `${value}/100`}</span>
                </div>
                <div className="progress-track" style={{ height: 6 }}>
                  <div className="progress-fill" style={{ width: `${missing ? 0 : value}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Loan application status */}
        <div className="card">
          <div className="card-header">
            <h3>Loan Application</h3>
            <span className="badge badge-primary">
              {readiness ? readiness.applicationStatus.replace('_', ' ') : 'Not started'}
            </span>
          </div>
          {readinessState.loading ? (
            <LoadingState label="Loading readiness…" rows={3} />
          ) : readinessState.error ? (
            <ErrorState error={readinessState.error} onRetry={reloadAll} />
          ) : (
            <>
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Amount requested
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                  {readiness?.requestedAmount != null
                    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(readiness.requestedAmount)
                    : business.fundingRequired != null
                      ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(business.fundingRequired)
                      : '—'}
                </div>
              </div>
              {readiness?.rejectionReason ? (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Rejection reason recorded
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '0.4rem' }}>
                    <span style={{ color: 'var(--color-danger)', flexShrink: 0 }}>&#8227;</span> {readiness.rejectionReason}
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                  No rejection reason recorded. Lender-provided notes appear here when added.
                </p>
              )}
              <button className="btn btn-primary btn-sm w-full" onClick={() => setActivePage('roadmap')}>
                Open Improvement Roadmap &#8250;
              </button>
            </>
          )}
        </div>
      </div>

      <div className="disclaimer" style={{ marginTop: '1.25rem' }}>
        <span className="disclaimer-icon">&#9888;</span>
        Climate scores are illustrative prototype heuristics computed by the backend, not validated climate risk
        assessments or credit ratings. {readyState(historyState, actionsState, readinessState)}
      </div>
    </div>
  );
}

function readyState(historyState, actionsState, readinessState) {
  const errors = [historyState.error, actionsState.error, readinessState.error].filter(Boolean);
  if (errors.length === 0) return '';
  return `Some sections failed to load (${errors.length}).`;
}
