import React, { useState } from 'react';
import { demoLoanApplications } from '../data/demoData.js';

const STATUS_META = {
  'Approved':                { badge: 'badge-success', dot: 'green',  icon: '&#10003;' },
  'Rejected':                { badge: 'badge-danger',  dot: 'red',    icon: '&#10007;' },
  'Under Review':            { badge: 'badge-info',    dot: 'blue',   icon: '&#9906;'  },
  'Additional Info Required':{ badge: 'badge-warning', dot: 'yellow', icon: '&#9888;'  },
  'Draft':                   { badge: 'badge-muted',   dot: 'gray',   icon: '&#9998;'  },
};

const TIMELINE_COLORS = {
  success: 'var(--color-success)',
  danger:  'var(--color-danger)',
  warning: 'var(--color-warning)',
  info:    'var(--color-info)',
};

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function getCategory(score) {
  if (score <= 24) return { label: 'Low',       cls: 'badge-low'       };
  if (score <= 49) return { label: 'Moderate',  cls: 'badge-moderate'  };
  if (score <= 74) return { label: 'High',       cls: 'badge-high'      };
  return              { label: 'Very High',  cls: 'badge-very-high' };
}

export default function LoanApplicationsPage({ onSelectBusiness }) {
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = statusFilter === 'all'
    ? demoLoanApplications
    : demoLoanApplications.filter(l => l.status === statusFilter);

  const app = selected || demoLoanApplications[0];

  const statusCounts = demoLoanApplications.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1.25rem', alignItems: 'start' }}>

      {/* ── Left: list ── */}
      <div>
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {['all', 'Under Review', 'Additional Info Required', 'Approved', 'Rejected', 'Draft'].map(s => (
            <button
              key={s}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : s}
              {s !== 'all' && statusCounts[s] ? ` (${statusCounts[s]})` : ''}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {filtered.map(loan => {
            const meta = STATUS_META[loan.status] || STATUS_META['Draft'];
            const cat  = getCategory(loan.riskScore);
            const isActive = selected?.id === loan.id;
            return (
              <div
                key={loan.id}
                className="card card-sm"
                style={{
                  cursor: 'pointer',
                  borderColor: isActive ? 'var(--color-primary)' : undefined,
                  background: isActive ? 'var(--color-bg-elevated)' : undefined,
                }}
                onClick={() => setSelected(loan)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{loan.businessName}</span>
                  <span className={`badge ${meta.badge}`} dangerouslySetInnerHTML={{ __html: loan.status }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                    {fmt(loan.requestedAmount)}
                  </span>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <span className={`badge ${cat.cls}`}>{cat.label}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)' }}>
                      {loan.applicationDate}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">&#9906;</div>
              <h3>No applications</h3>
              <p>No loan applications match this filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: detail ── */}
      <div>
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ marginBottom: '0.2rem' }}>{app.businessName}</h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-tertiary)' }}>
                Application ID: {app.id} &middot; Filed {app.applicationDate}
              </div>
            </div>
            <span className={`badge ${(STATUS_META[app.status] || STATUS_META['Draft']).badge}`}>
              {app.status}
            </span>
          </div>

          <div className="grid-2" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Requested</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{fmt(app.requestedAmount)}</div>
            </div>
            <div style={{ background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Climate Risk</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: getCategory(app.riskScore).cls.includes('very') ? 'var(--color-very-high)' : getCategory(app.riskScore).cls.includes('high') ? 'var(--color-high)' : getCategory(app.riskScore).cls.includes('moderate') ? 'var(--color-moderate)' : 'var(--color-low)' }}>
                  {app.riskScore}
                </span>
                <span className={`badge ${getCategory(app.riskScore).cls}`}>{getCategory(app.riskScore).label}</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Purpose</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{app.purpose}</div>
          </div>

          {app.notes && (
            <div style={{ background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>&#9998; Notes</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{app.notes}</div>
            </div>
          )}
        </div>

        {/* Rejection reasons */}
        {app.rejectionReasons?.length > 0 && (
          <div className="card" style={{ marginBottom: '1rem', borderColor: 'rgba(239,68,68,0.3)' }}>
            <h4 style={{ marginBottom: '0.75rem', color: 'var(--color-danger)', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              &#10007; Lender-Recorded Rejection Reasons
            </h4>
            {app.rejectionReasons.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', padding: '0.5rem 0', borderBottom: i < app.rejectionReasons.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                <span style={{ color: 'var(--color-danger)', marginTop: '1px', fontSize: '0.9rem' }}>&#8227;</span>
                <span style={{ fontSize: '0.83rem', color: 'var(--color-text-secondary)' }}>{r}</span>
              </div>
            ))}
          </div>
        )}

        {/* Timeline */}
        <div className="card">
          <h4 style={{ marginBottom: '1rem' }}>Application Timeline</h4>
          <div className="timeline">
            {app.timeline.map((t, i) => {
              const c = TIMELINE_COLORS[t.type] || 'var(--color-text-tertiary)';
              const isLast = i === app.timeline.length - 1;
              return (
                <div key={i} className="timeline-item">
                  <div className="timeline-dot" style={{ borderColor: c, color: c, background: `${c}18` }}>
                    {isLast ? '&#9679;' : i + 1}
                  </div>
                  <div style={{ paddingTop: '1px' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text)' }}>{t.event}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginTop: '0.1rem' }}>{t.date}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
