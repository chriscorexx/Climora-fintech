import React, { useMemo, useState } from 'react';
import { useData } from '../services/DataProvider.jsx';
import { api } from '../services/apiClient.js';
import { useAsync } from '../hooks/useAsync.js';
import { categoryColor, formatDate, formatIndustry } from '../services/mappers.js';
import { EmptyState, ErrorState, LoadingState } from './ui.jsx';

const STATUS_META = {
  applied:     { badge: 'badge-info',    icon: '&#9906;'  },
  under_review:{ badge: 'badge-info',    icon: '&#9906;'  },
  approved:    { badge: 'badge-success', icon: '&#10003;' },
  rejected:    { badge: 'badge-danger',  icon: '&#10007;' },
  not_applied: { badge: 'badge-muted',   icon: '&#9998;'  },
};

const FILTERS = ['all', 'not_applied', 'applied', 'under_review', 'approved', 'rejected'];

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const fmt = (value) => (value === null || value === undefined ? '—' : INR.format(value));

/**
 * Lender view of loan readiness across the portfolio. The backend stores
 * readiness per business, so each row is fetched on load.
 */
export default function LoanApplicationsPage({ onSelectBusiness }) {
  const { dashboard, businesses, sectors } = useData();
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const rows = useMemo(() => (dashboard?.metrics?.businesses?.length ? dashboard.metrics.businesses : businesses), [dashboard, businesses]);

  const readinessState = useAsync(async () => {
    const entries = await Promise.all(
      rows.map(async (business) => {
        try {
          const payload = await api.loanReadiness(business.id);
          return { business, readiness: payload?.loanReadiness || null };
        } catch {
          return { business, readiness: null };
        }
      })
    );
    return entries;
  }, { immediate: rows.length > 0, deps: [rows] });

  const scoreByBusiness = useMemo(() => {
    const map = new Map();
    for (const entry of dashboard?.metrics?.latestAssessmentByBusiness || []) map.set(entry.businessId, entry);
    return map;
  }, [dashboard]);

  const applications = useMemo(() => {
    return (readinessState.data || [])
      .filter((entry) => entry.readiness)
      .map((entry) => {
        const latest = scoreByBusiness.get(entry.business.id);
        const checklist = entry.readiness.documentChecklist || [];
        const ready = checklist.filter((item) => item.status === 'ready').length;
        return {
          id: entry.business.id,
          business: entry.business,
          readiness: entry.readiness,
          status: entry.readiness.applicationStatus,
          requestedAmount: entry.readiness.requestedAmount ?? entry.business.fundingRequired ?? null,
          riskScore: latest?.overallScore ?? null,
          category: latest?.category ?? null,
          assessedAt: latest?.createdAt ?? null,
          docsReady: ready,
          docsTotal: checklist.length,
        };
      });
  }, [readinessState.data, scoreByBusiness]);

  const statusCounts = applications.reduce((accumulator, application) => {
    accumulator[application.status] = (accumulator[application.status] || 0) + 1;
    return accumulator;
  }, {});

  const filtered = statusFilter === 'all' ? applications : applications.filter((application) => application.status === statusFilter);
  const app = selected ? applications.find((item) => item.id === selected) : filtered[0] || applications[0] || null;

  if (readinessState.loading && !readinessState.data) {
    return (
      <div>
        <LoadingState label="Loading loan applications…" rows={3} />
      </div>
    );
  }

  if (readinessState.error) return <ErrorState error={readinessState.error} onRetry={readinessState.reload} />;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1.25rem', alignItems: 'start' }}>
      {/* ── Left: list ── */}
      <div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {FILTERS.map((status) => (
            <button
              key={status}
              className={`btn btn-sm ${statusFilter === status ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
              {status !== 'all' && statusCounts[status] ? ` (${statusCounts[status]})` : ''}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {filtered.map((application) => {
            const meta = STATUS_META[application.status] || STATUS_META.not_applied;
            const isActive = app?.id === application.id;
            return (
              <button
                key={application.id}
                type="button"
                className="card card-sm"
                style={{
                  cursor: 'pointer',
                  borderColor: isActive ? 'var(--color-primary)' : undefined,
                  background: isActive ? 'var(--color-bg-elevated)' : undefined,
                  textAlign: 'left',
                  width: '100%',
                }}
                onClick={() => setSelected(application.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{application.business.name}</span>
                  <span className={`badge ${meta.badge}`}>{application.status.replace('_', ' ')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                    {fmt(application.requestedAmount)}
                  </span>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    {application.riskScore !== null && (
                      <span className="badge" style={{ background: `${categoryColor(application.category)}22`, color: categoryColor(application.category) }}>
                        {application.riskScore}
                      </span>
                    )}
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)' }}>
                      {application.docsReady}/{application.docsTotal} docs
                    </span>
                  </div>
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon" aria-hidden="true">
                &#9906;
              </div>
              <h3>No records</h3>
              <p>No businesses match this readiness status.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: detail ── */}
      <div>
        {!app ? (
          <div className="card">
            <EmptyState
              title="No readiness records"
              message="Loan readiness is recorded per business once an owner starts a loan application."
            />
          </div>
        ) : (
          <>
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ marginBottom: '0.2rem' }}>{app.business.name}</h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-tertiary)' }}>
                    {formatIndustry(app.business.industry, sectors)} &middot; {app.business.location} &middot; Updated{' '}
                    {formatDate(app.readiness.updatedAt)}
                  </div>
                </div>
                <span className={`badge ${(STATUS_META[app.status] || STATUS_META.not_applied).badge}`}>
                  {app.status.replace('_', ' ')}
                </span>
              </div>

              <div className="grid-2" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Requested
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{fmt(app.requestedAmount)}</div>
                </div>
                <div style={{ background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Climate Risk (illustrative)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '1.3rem',
                        fontWeight: 800,
                        color: app.riskScore === null ? 'var(--color-text-tertiary)' : categoryColor(app.category),
                      }}
                    >
                      {app.riskScore ?? '—'}
                    </span>
                    {app.category && <span className="badge badge-muted">{app.category}</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                <span className="badge badge-muted">
                  {app.docsReady}/{app.docsTotal} documents ready
                </span>
                {app.readiness.lenderName && <span className="badge badge-primary">{app.readiness.lenderName}</span>}
                {app.readiness.lenderConfirmed && <span className="badge badge-success">Lender confirmed</span>}
              </div>
            </div>

            {app.readiness.rejectionReason && (
              <div className="card" style={{ marginBottom: '1rem', borderColor: 'rgba(239,68,68,0.3)' }}>
                <h4 style={{ marginBottom: '0.75rem', color: 'var(--color-danger)' }}>&#10007; Lender-Recorded Rejection Reason</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{app.readiness.rejectionReason}</p>
              </div>
            )}

            {app.readiness.lenderFeedback && (
              <div className="card" style={{ marginBottom: '1rem' }}>
                <h4 style={{ marginBottom: '0.75rem' }}>&#9998; Lender Feedback</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{app.readiness.lenderFeedback}</p>
              </div>
            )}

            <div className="card">
              <div className="card-header">
                <h4>Document Checklist</h4>
                <button className="btn btn-secondary btn-sm" onClick={() => onSelectBusiness && onSelectBusiness(app.business)}>
                  Open assessment &#8250;
                </button>
              </div>
              {(app.readiness.documentChecklist || []).map((item) => (
                <div key={item.documentName} className="checklist-item" style={{ cursor: 'default' }}>
                  <span
                    style={{
                      color:
                        item.status === 'ready'
                          ? 'var(--color-success)'
                          : item.status === 'in_progress'
                            ? 'var(--color-warning)'
                            : 'var(--color-danger)',
                    }}
                  >
                    {item.status === 'ready' ? '&#10003;' : item.status === 'in_progress' ? '&#9654;' : '&#9675;'}
                  </span>
                  <div style={{ flex: 1, fontSize: '0.85rem' }}>{item.documentName}</div>
                  <span className="badge badge-muted">{item.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="disclaimer" style={{ gridColumn: '1 / -1', marginTop: '1.25rem' }}>
        <span className="disclaimer-icon">&#9888;</span>
        Readiness data is recorded by the business owner. Climora does not verify lender requirements and the climate
        score is not an input to any approval decision. Loan approval is not implied by any status shown here.
      </div>
    </div>
  );
}
