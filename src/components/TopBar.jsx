import React, { useState } from 'react';
import { demoBusinesses } from '../data/demoData.js';

const PAGE_TITLES = {
  // Lender
  overview:       { title: 'Overview',            sub: 'Portfolio summary and risk distribution' },
  portfolio:      { title: 'MSME Portfolio',       sub: 'All assessed businesses' },
  assessment:     { title: 'Risk Assessment',      sub: 'Climate-adjusted risk breakdown' },
  loanApps:       { title: 'Loan Applications',    sub: 'Application status and outcomes' },
  reports:        { title: 'Reports',              sub: 'Export and generate summaries' },
  settings:       { title: 'Settings',             sub: 'Application preferences' },
  // Owner
  ownerDashboard: { title: 'My Dashboard',         sub: 'Your climate risk and loan readiness' },
  myBusiness:     { title: 'My Business',          sub: 'Business profile and financials' },
  climateExposure:{ title: 'Climate Exposure',     sub: 'Local hazards and vulnerabilities' },
  loanReadiness:  { title: 'Loan Readiness',       sub: 'Preparation checklist and status' },
  roadmap:        { title: 'Improvement Roadmap',  sub: 'Prioritised actions and progress' },
  documents:      { title: 'Documents',            sub: 'Checklist and evidence tracker' },
  history:        { title: 'Assessment History',   sub: 'Score changes over time' },
};

export default function TopBar({ activePage, role, onBusinessSelect, selectedBusinessId }) {
  const [search, setSearch]   = useState('');
  const [results, setResults] = useState([]);
  const [showDrop, setShowDrop] = useState(false);

  const info = PAGE_TITLES[activePage] || { title: activePage, sub: '' };
  const showSearch = ['overview', 'portfolio'].includes(activePage);

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearch(q);
    if (q.length < 1) { setResults([]); setShowDrop(false); return; }
    const hits = demoBusinesses.filter(
      (b) =>
        b.name.toLowerCase().includes(q.toLowerCase()) ||
        b.location.toLowerCase().includes(q.toLowerCase())
    );
    setResults(hits);
    setShowDrop(true);
  };

  const pick = (b) => {
    setSearch('');
    setResults([]);
    setShowDrop(false);
    if (onBusinessSelect) onBusinessSelect(b);
  };

  return (
    <div className="top-bar">
      {/* Title */}
      <div className="top-bar-title">
        <div>
          <h2>{info.title}</h2>
          {info.sub && (
            <div className="breadcrumb" style={{ marginTop: '0.15rem' }}>
              <span>{role === 'lender' ? 'Lender' : 'Owner'}</span>
              <span className="breadcrumb-sep">&#8250;</span>
              <span className="breadcrumb-current">{info.title}</span>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      {showSearch && (
        <div style={{ position: 'relative', width: '260px' }}>
          <span style={{
            position: 'absolute', left: '0.65rem', top: '50%',
            transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)',
            fontSize: '0.85rem', pointerEvents: 'none',
          }}>&#9906;</span>
          <input
            type="text"
            className="input"
            style={{ paddingLeft: '1.8rem' }}
            placeholder="Search businesses..."
            value={search}
            onChange={handleSearch}
            onBlur={() => setTimeout(() => setShowDrop(false), 150)}
            onFocus={() => results.length > 0 && setShowDrop(true)}
          />
          {showDrop && results.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
              background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)',
              zIndex: 200, overflow: 'hidden',
            }}>
              {results.slice(0, 5).map((b) => (
                <div
                  key={b.id}
                  style={{
                    padding: '0.6rem 0.9rem', cursor: 'pointer',
                    borderBottom: '1px solid var(--color-border)',
                    transition: 'var(--transition-fast)',
                  }}
                  onMouseDown={() => pick(b)}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-tertiary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = ''}
                >
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)' }}>{b.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)' }}>{b.location}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="top-bar-actions">
        <div className="demo-pill">
          <span className="demo-pulse" />
          Demo Mode
        </div>

        {/* Notification bell */}
        <div className="icon-btn" title="Notifications">
          &#9776;
          <span className="notif-dot" />
        </div>

        {/* Help */}
        <div className="icon-btn" title="Help">
          &#63;
        </div>
      </div>
    </div>
  );
}
