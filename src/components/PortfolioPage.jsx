import React, { useMemo, useState } from 'react';
import { useData } from '../services/DataProvider.jsx';
import { formatDate, formatIndustry, formatMoney, formatNumber } from '../services/mappers.js';
import { EmptyState, ErrorState, LoadingState } from './ui.jsx';

function categoryOf(score) {
  if (score >= 75) return { label: 'Very High', badge: 'badge-very-high', color: 'var(--color-very-high)' };
  if (score >= 50) return { label: 'High', badge: 'badge-high', color: 'var(--color-high)' };
  if (score >= 25) return { label: 'Moderate', badge: 'badge-moderate', color: 'var(--color-moderate)' };
  return { label: 'Low', badge: 'badge-low', color: 'var(--color-low)' };
}

export default function PortfolioPage({ onSelectBusiness }) {
  const { dashboard, businesses, sectors, health, loading, error, refresh } = useData();
  const [search, setSearch] = useState('');
  const [sectorF, setSectorF] = useState('all');
  const [riskF, setRiskF] = useState('all');
  const [view, setView] = useState('table');

  const metrics = dashboard?.metrics || null;

  const scoreByBusiness = useMemo(() => {
    const map = new Map();
    for (const entry of metrics?.latestAssessmentByBusiness || []) map.set(entry.businessId, entry);
    return map;
  }, [metrics]);

  const allRows = useMemo(() => {
    const source = metrics?.businesses?.length ? metrics.businesses : businesses;
    return source.map((business) => {
      const latest = scoreByBusiness.get(business.id);
      return {
        business,
        industryLabel: formatIndustry(business.industry, sectors),
        score: latest?.overallScore ?? null,
        category: latest?.category ?? null,
        assessedAt: latest?.assessedAt ?? null,
        isIncomplete: Boolean(latest?.isIncomplete),
      };
    });
  }, [metrics, businesses, sectors, scoreByBusiness]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allRows.filter((row) => {
      const matchesSearch =
        !query ||
        row.business.name.toLowerCase().includes(query) ||
        (row.business.location || '').toLowerCase().includes(query) ||
        (row.business.state || '').toLowerCase().includes(query);
      const matchesSector = sectorF === 'all' || row.business.industry === sectorF;
      const matchesRisk = riskF === 'all' || row.category === riskF;
      return matchesSearch && matchesSector && matchesRisk;
    });
  }, [allRows, search, sectorF, riskF]);

  const clearFilters = () => {
    setSearch('');
    setSectorF('all');
    setRiskF('all');
  };

  if (loading && !dashboard) {
    return (
      <div>
        <div className="page-toolbar">
          <div className="skeleton" style={{ width: 260, height: 38 }} aria-hidden="true" />
          <div className="skeleton" style={{ width: 180, height: 38 }} aria-hidden="true" />
        </div>
        <LoadingState label="Loading portfolio…" rows={5} />
      </div>
    );
  }

  if (error && !dashboard) {
    return <ErrorState error={{ message: error, isNetworkError: !health.online }} onRetry={refresh} />;
  }

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 280 }}>
          <span
            style={{
              position: 'absolute',
              left: '0.65rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-tertiary)',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          >
            &#9906;
          </span>
          <label className="sr-only" htmlFor="portfolio-search">
            Search businesses
          </label>
          <input
            id="portfolio-search"
            className="input"
            style={{ paddingLeft: '1.8rem' }}
            placeholder="Search by name or location..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <label className="sr-only" htmlFor="portfolio-sector">
          Filter by industry
        </label>
        <select id="portfolio-sector" className="select" style={{ width: 170 }} value={sectorF} onChange={(event) => setSectorF(event.target.value)}>
          <option value="all">All Industries</option>
          {Object.entries(sectors || {}).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="portfolio-risk">
          Filter by risk level
        </label>
        <select id="portfolio-risk" className="select" style={{ width: 160 }} value={riskF} onChange={(event) => setRiskF(event.target.value)}>
          <option value="all">All Risk Levels</option>
          {['Low', 'Moderate', 'High', 'Very High'].map((risk) => (
            <option key={risk} value={risk}>
              {risk}
            </option>
          ))}
        </select>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
          <button className={`btn btn-sm ${view === 'table' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('table')}>
            &#8803; Table
          </button>
          <button className={`btn btn-sm ${view === 'cards' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('cards')}>
            &#9638; Cards
          </button>
        </div>

        <span className="badge badge-primary" aria-live="polite">
          {filtered.length} / {allRows.length} businesses
        </span>
      </div>

      {!health.online && <ErrorState error={{ message: health.error, isNetworkError: true }} onRetry={refresh} />}

      {allRows.length === 0 ? (
        <div className="card">
          <EmptyState
            title="Portfolio is empty"
            message="No MSME profiles exist in the backend yet. Create one from My Business to see it here."
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon" aria-hidden="true">
              &#9906;
            </div>
            <h3>No results</h3>
            <p>No businesses match the current filters. Try clearing your search or filter.</p>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem' }} onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        </div>
      ) : view === 'cards' ? (
        <div className="grid-auto-lg">
          {filtered.map((row) => {
            const cat = row.score === null ? { label: 'Not assessed', color: 'var(--color-text-tertiary)' } : categoryOf(row.score);
            return (
              <div
                key={row.business.id}
                className="card"
                style={{ cursor: 'pointer', borderLeft: `3px solid ${cat.color}` }}
                onClick={() => onSelectBusiness(row.business)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>{row.business.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-tertiary)' }}>{row.industryLabel}</div>
                  </div>
                  <span className={`badge ${cat.badge || 'badge-muted'}`}>{cat.label}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
                  <span aria-hidden="true">&#9906;</span> {row.business.location}
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Turnover
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{formatMoney(row.business.annualTurnover, { compact: true })}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Employees
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{formatNumber(row.business.employeeCount)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: cat.color }}>{row.score ?? '—'}</span>
                  <div className="progress-track" style={{ flex: 1, marginLeft: '0.75rem', height: 6 }}>
                    <div className="progress-fill" style={{ width: `${row.score ?? 0}%`, background: cat.color }} />
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
                  <th>Industry</th>
                  <th>Location</th>
                  <th>Employees</th>
                  <th>Turnover</th>
                  <th>Score</th>
                  <th>Category</th>
                  <th>Last Assessed</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const cat = row.score === null ? { label: 'Not assessed', color: 'var(--color-text-tertiary)' } : categoryOf(row.score);
                  return (
                    <tr key={row.business.id} className="clickable" onClick={() => onSelectBusiness(row.business)}>
                      <td style={{ fontWeight: 600 }}>
                        {row.business.name}
                        {row.business.isDemo && (
                          <span className="badge badge-simulated" style={{ marginLeft: '0.5rem' }}>
                            Demo
                          </span>
                        )}
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{row.industryLabel}</td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{row.business.location}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{formatNumber(row.business.employeeCount)}</td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{formatMoney(row.business.annualTurnover, { compact: true })}</td>
                      <td>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: cat.color }}>{row.score ?? '—'}</span>
                        {row.isIncomplete && row.score !== null && (
                          <span className="badge badge-moderate" style={{ marginLeft: '0.4rem' }}>
                            Partial
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${cat.badge || 'badge-muted'}`}>{cat.label}</span>
                      </td>
                      <td style={{ color: 'var(--color-text-tertiary)', fontSize: '0.78rem' }}>
                        {row.assessedAt ? formatDate(row.assessedAt) : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectBusiness(row.business);
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
        </div>
      )}

      <div className="disclaimer" style={{ marginTop: '1rem' }}>
        <span className="disclaimer-icon">&#9888;</span>
        Scores are illustrative prototype heuristics computed from Open-Meteo data where available — not validated credit
        ratings or live climate observations. Demo records are seeded samples, not real businesses.
      </div>
    </div>
  );
}
