import React, { useState } from 'react';
import { ownerBusiness } from '../data/demoData.js';

const FIELD = (label, value, sub) => ({ label, value, sub });

export default function MyBusinessPage() {
  const b = ownerBusiness;
  const [editing, setEditing] = useState(false);

  const profitMargin = b.revenue && b.expenses
    ? (((b.revenue - b.expenses) / b.revenue) * 100).toFixed(1)
    : '—';

  const debtToRevenue = b.debtObligations && b.revenue
    ? ((b.debtObligations / b.revenue) * 100).toFixed(1)
    : '—';

  const reserveMonths = b.emergencyReserve && b.expenses
    ? ((b.emergencyReserve / (b.expenses / 12))).toFixed(1)
    : '—';

  return (
    <div>
      {/* Header card */}
      <div className="card mb-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: '0 0 0.3rem' }}>{b.name}</h2>
          <div style={{ fontSize: '0.83rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem' }}>
            {b.sector.replace('_', ' ')} &middot; {b.location}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-primary">&#9906; {b.location}</span>
            <span className="badge badge-muted">{b.employeeCount} employees</span>
            <span className="badge badge-demo">Demo Business</span>
          </div>
        </div>
        <button
          className={`btn btn-sm ${editing ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setEditing(!editing)}
        >
          {editing ? '&#10003; Save Changes' : '&#9998; Edit Profile'}
        </button>
      </div>

      <div className="grid-2" style={{ gap: '1rem' }}>
        {/* Profile details */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Business Profile</h3>
          {[
            { label: 'Business Name',  value: b.name                          },
            { label: 'Sector',         value: b.sector.replace('_', ' ')      },
            { label: 'Location',       value: b.location                      },
            { label: 'Coordinates',    value: `${b.coordinates.lat}, ${b.coordinates.lng}` },
            { label: 'Employees',      value: b.employeeCount                 },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-tertiary)' }}>{f.label}</span>
              {editing ? (
                <input
                  className="input"
                  style={{ width: 180, height: 28, padding: '0.2rem 0.5rem', fontSize: '0.82rem' }}
                  defaultValue={f.value}
                />
              ) : (
                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{f.value}</span>
              )}
            </div>
          ))}
        </div>

        {/* Financial indicators */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Financial Indicators</h3>
          {[
            { label: 'Annual Revenue',    value: `$${b.revenue?.toLocaleString()}`,          color: 'var(--color-success)'   },
            { label: 'Annual Expenses',   value: `$${b.expenses?.toLocaleString()}`,          color: 'var(--color-text)'      },
            { label: 'Debt Obligations',  value: `$${b.debtObligations?.toLocaleString()}`,   color: 'var(--color-warning)'   },
            { label: 'Emergency Reserve', value: `$${b.emergencyReserve?.toLocaleString()}`,  color: 'var(--color-info)'      },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-tertiary)' }}>{f.label}</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: f.color }}>{f.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Derived ratios */}
      <div className="grid-3 mt-2" style={{ gap: '1rem' }}>
        {[
          { label: 'Profit Margin',       value: `${profitMargin}%`,    sub: 'Revenue minus expenses',        color: parseFloat(profitMargin) > 15 ? 'var(--color-success)' : 'var(--color-warning)' },
          { label: 'Debt-to-Revenue',     value: `${debtToRevenue}%`,   sub: 'Annual debt obligations',       color: parseFloat(debtToRevenue) < 15 ? 'var(--color-success)' : 'var(--color-warning)' },
          { label: 'Reserve Coverage',    value: `${reserveMonths} mo`, sub: 'Months of expenses covered',    color: parseFloat(reserveMonths) >= 3 ? 'var(--color-success)' : 'var(--color-danger)' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ '--accent-start': s.color, '--accent-end': s.color }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: '1.6rem' }}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="disclaimer" style={{ marginTop: '1.25rem' }}>
        <span className="disclaimer-icon">&#9888;</span>
        All financial data shown is simulated demo data. The financial ratios are illustrative indicators, not audited figures or official financial statements.
      </div>
    </div>
  );
}
