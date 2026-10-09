import React, { useMemo } from 'react';
import { useData } from '../services/DataProvider.jsx';
import { api } from '../services/apiClient.js';
import { useAsync } from '../hooks/useAsync.js';
import { categoryColor, formatDate, formatIndustry } from '../services/mappers.js';
import { EmptyState, ErrorState, LoadingState } from './ui.jsx';

function getCategoryVariant(category) {
  const map = {
    Low: 'low',
    Moderate: 'moderate',
    High: 'high',
    'Very High': 'very-high',
  };
  return map[category] || 'default';
}

function MiniBar({ value, color }) {
  return (
    <div className="progress-track" style={{ height: 4 }}>
      <div className="progress-fill" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

function DonutChart({ segments, size = 140 }) {
  const strokeWidth = 18;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  const arcs = segments.map((seg) => {
    const dash = (seg.pct / 100) * circ;
    const arc = { ...seg, dash, offset: circ - offset };
    offset += dash;
    return arc;
  });

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} role="img" aria-label="Risk category distribution">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-bg-tertiary)" strokeWidth={strokeWidth} />
      {arcs.map((arc) => (
        <circle
          key={arc.label}
          cx={size / 2}
          cy={size / 2}
          r={r}
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
  const { dashboard, businesses, sectors, health, refresh, checkHealth } = useData();

  const metrics = dashboard?.metrics || null;
  const total = metrics?.portfolioSize ?? businesses.length;

  const scoreByBusiness = useMemo(() => {
    const map = new Map();
    for (const entry of metrics?.latestAssessmentByBusiness || []) {
      map.set(entry.businessId, entry);
    }
    return map;
  }, [metrics]);

  const recent = useAsync(() => api.listAssessments({ limit: 6 }), { immediate: Boolean(metrics) });

  if (health.error && !dashboard) {
    return (
      <ErrorState
        error={{ message: health.error, isNetworkError: !health.online }}
        onRetry={refresh}
      />
    );
  }

  if (!dashboard) return <LoadingState label="Loading portfolio overview…" rows={4} />;

  const avgScore = metrics.averageRiskScore ?? 0;
  const highRisk = metrics.highRiskBusinesses ?? 0;
  const distribution = metrics.categoryDistribution || {};

  const categoryOrder = ['Low', 'Moderate', 'High', 'Very High'];
  const donutSegments = categoryOrder
    .map((label) => ({
      label,
      count: distribution[label] || 0,
      pct: total ? Math.round(((distribution[label] || 0) / total) * 100) : 0,
      color: categoryColor(label),
    }))
    .filter((segment) => segment.count > 0);

  const rows = (metrics.businesses || businesses).map((business) => {
    const latest = scoreByBusiness.get(business.id);
    return {
      business,
      industryLabel: formatIndustry(business.industry, sectors),
      latest,
    };
  });

  const assessments = recent.data?.assessments || [];
  const recentActivity = assessments.slice(0, 4).map((assessment) => ({
    id: assessment.id,
    text: `${assessment.businessName || 'Business'} assessed at ${assessment.overallScore}/100`,
    time: formatDate(assessment.assessedAt || assessment.createdAt),
    incomplete: assessment.isIncomplete,
    color: categoryColor(assessment.category),
  }));

  const statCards = [
    {
      label: 'Portfolio Size',
      value: total,
      sub: `${metrics.assessedBusinesses ?? 0} assessed`,
      icon: '◫',
      accent: 'var(--color-primary)',
      valueColor: 'var(--color-text)',
    },
    {
      label: 'Average Risk Score',
      value: avgScore,
      sub: `Across ${total} businesses`,
      icon: '◈',
      accent: categoryColor(avgScore >= 75 ? 'Very High' : avgScore >= 50 ? 'High' : avgScore >= 25 ? 'Moderate' : 'Low'),
      valueColor: categoryColor(avgScore >= 75 ? 'Very High' : avgScore >= 50 ? 'High' : avgScore >= 25 ? 'Moderate' : 'Low'),
    },
    {
      label: 'Elevated Risk',
      value: highRisk,
      sub: `${metrics.highRiskPct ?? 0}% of portfolio`,
      icon: '⊛',
      accent: 'var(--color-high)',
      valueColor: 'var(--color-very-high)',
    },
    {
      label: 'Incomplete Assessments',
      value: metrics.incompleteAssessments ?? 0,
      sub: `${metrics.assessmentsLast30Days ?? 0} runs in 30 days`,
      icon: '⊟',
      accent: 'var(--color-warning)',
      valueColor: 'var(--color-warning)',
    },
  ];

  return (
    <div>
      {!health.online && <ErrorState error={{ message: health.error }} onRetry={checkHealth} />}

      {/* ── Stat cards ── */}
      <div className="grid-4 mb-3">
        {statCards.map((card, index) => (
          <div
            key={card.label}
            className="stat-card fade-in"
            style={{
              '--accent-start': card.accent,
              '--accent-end': card.accent,
              animationDelay: `${index * 0.05}s`,
            }}
          >
            <div className="stat-icon" style={{ background: `${card.accent}18` }}>
              <span style={{ color: card.accent }}>{card.icon}</span>
            </div>
            <div className="stat-label">{card.label}</div>
            <div className="stat-value" style={{ color: card.valueColor }}>{card.value}</div>
            <div className="stat-sub">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Middle row: donut + recent activity ── */}
      <div className="grid-2 mb-3" style={{ gridTemplateColumns: '1fr 1.6fr' }}>
        <div className="card">
          <div className="card-header">
            <h3>Risk Distribution</h3>
            <span className={health.online ? 'badge badge-demo' : 'badge badge-simulated'}>
              {health.online ? 'Backend live' : 'Backend offline'}
            </span>
          </div>
          {total === 0 ? (
            <EmptyState title="No businesses yet" message="Create an MSME profile to populate the portfolio." />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <DonutChart segments={donutSegments} size={130} />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>{total}</span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total
                  </span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                {categoryOrder.map((label) => {
                  const segment = donutSegments.find((item) => item.label === label) || {
                    count: 0,
                    pct: 0,
                    color: categoryColor(label),
                  };
                  return (
                    <div key={label} style={{ marginBottom: '0.65rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--color-text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                          }}
                        >
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: segment.color,
                              display: 'inline-block',
                              flexShrink: 0,
                            }}
                          />
                          {label}
                        </span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: segment.color }}>{segment.count}</span>
                      </div>
                      <MiniBar value={segment.pct} color={segment.color} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Recent Assessments</h3>
            <span className="badge badge-muted">Newest first</span>
          </div>
          {recent.loading ? (
            <LoadingState label="Loading recent assessments…" rows={3} />
          ) : recent.error ? (
            <ErrorState error={recent.error} onRetry={recent.reload} />
          ) : recentActivity.length === 0 ? (
            <EmptyState
              title="No assessments recorded"
              message="Run an assessment from a business detail view to see activity here."
            />
          ) : (
            <div className="timeline">
              {recentActivity.map((item) => (
                <div key={item.id} className="timeline-item">
                  <div
                    className="timeline-dot"
                    style={{ borderColor: item.color, color: item.color, background: `${item.color}15` }}
                    aria-hidden="true"
                  >
                    ⊙
                  </div>
                  <div style={{ paddingTop: '2px' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text)', marginBottom: '0.15rem' }}>
                      {item.text}
                      {item.incomplete && (
                        <span className="badge badge-simulated" style={{ marginLeft: '0.5rem' }}>
                          Incomplete
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Portfolio table ── */}
      <div className="card">
        <div className="card-header">
          <h3>MSME Portfolio</h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className={health.online ? 'badge badge-demo' : 'badge badge-simulated'}>
              {health.online ? 'Open-Meteo live data' : 'Backend offline'}
            </span>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="Portfolio is empty"
            message="Add an MSME profile (My Business) so it can appear in the lender portfolio."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Industry</th>
                  <th>Location</th>
                  <th>Score</th>
                  <th>Risk</th>
                  <th>Trend</th>
                  <th>Last Assessed</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ business, industryLabel, latest }) => {
                  const score = latest?.overallScore;
                  const category = latest?.category;
                  const color = score === undefined || score === null ? 'var(--color-text-tertiary)' : categoryColor(category);
                  return (
                    <tr
                      key={business.id}
                      className="clickable"
                      onClick={() => onSelectBusiness(business)}
                    >
                      <td style={{ fontWeight: 600 }}>
                        {business.name}
                        {business.isDemo && (
                          <span className="badge badge-simulated" style={{ marginLeft: '0.5rem' }}>
                            Demo
                          </span>
                        )}
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{industryLabel}</td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{business.location}</td>
                      <td>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color }}>
                          {score === undefined || score === null ? '—' : score}
                        </span>
                      </td>
                      <td>
                        {category ? (
                          <span className={`badge badge-${getCategoryVariant(category)}`}>{category}</span>
                        ) : (
                          <span className="badge badge-muted">Not assessed</span>
                        )}
                      </td>
                      <td>
                        <div style={{ width: 64 }}>
                          <MiniBar value={score ?? 0} color={color} />
                        </div>
                      </td>
                      <td style={{ color: 'var(--color-text-tertiary)', fontSize: '0.78rem' }}>
                        {latest?.assessedAt ? formatDate(latest.assessedAt) : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectBusiness(business);
                          }}
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
        )}

        <div className="disclaimer" style={{ marginTop: '1rem' }}>
          <span className="disclaimer-icon">&#9888;</span>
          Scores are illustrative prototype heuristics computed by the backend from Open-Meteo data where available — not
          validated credit ratings or probabilities of default.
        </div>
      </div>
    </div>
  );
}
