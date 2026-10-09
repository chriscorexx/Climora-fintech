import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../services/DataProvider.jsx';
import { api } from '../services/apiClient.js';

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
  const { businesses, health, checkHealth } = useData();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [showDrop, setShowDrop] = useState(false);
  const [searching, setSearching] = useState(false);

  const info = PAGE_TITLES[activePage] || { title: activePage, sub: '' };
  const showSearch = ['overview', 'portfolio', 'assessment', 'loanApps'].includes(activePage);

  // Debounced server-side search against the backend business list.
  useEffect(() => {
    const query = search.trim();
    if (query.length < 1) {
      setResults([]);
      setSearching(false);
      return undefined;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const payload = await api.listBusinesses({ search: query, limit: 8 });
        setResults(payload?.businesses || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const quickPicks = useMemo(() => businesses.slice(0, 6), [businesses]);

  const pick = (business) => {
    setSearch('');
    setResults([]);
    setShowDrop(false);
    if (onBusinessSelect) onBusinessSelect(business);
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
          <label className="sr-only" htmlFor="global-business-search">
            Search businesses
          </label>
          <input
            id="global-business-search"
            type="text"
            className="input"
            style={{ paddingLeft: '1.8rem' }}
            placeholder="Search businesses..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowDrop(true); }}
            onBlur={() => setTimeout(() => setShowDrop(false), 150)}
            onFocus={() => setShowDrop(true)}
            aria-expanded={showDrop && (results.length > 0 || search.trim().length > 0)}
            role="combobox"
            aria-controls="global-search-results"
          />
          {showDrop && (search.trim().length > 0 || results.length > 0) && (
            <div id="global-search-results" role="listbox" style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
              background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)',
              zIndex: 200, overflow: 'hidden',
            }}>
              {searching && (
                <div style={{ padding: '0.6rem 0.9rem', fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                  Searching…
                </div>
              )}
              {results.map((b) => (
                <div
                  key={b.id}
                  role="option"
                  aria-selected={selectedBusinessId === b.id}
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
              {!searching && results.length === 0 && search.trim().length > 0 && (
                <div style={{ padding: '0.6rem 0.9rem', fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
                  No businesses match “{search}”.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick business switcher for single-tenant views */}
      {!showSearch && quickPicks.length > 1 && (
        <label className="sr-only" htmlFor="quick-business-select">
          Active business
        </label>
      )}
      {!showSearch && quickPicks.length > 1 && (
        <select
          id="quick-business-select"
          className="select"
          style={{ width: 200 }}
          value={selectedBusinessId || ''}
          onChange={(event) => {
            const found = businesses.find((business) => business.id === event.target.value);
            if (found) pick(found);
          }}
        >
          <option value="" disabled>
            Select business…
          </option>
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.name}
            </option>
          ))}
        </select>
      )}

      {/* Actions */}
      <div className="top-bar-actions">
        <button
          type="button"
          className="demo-pill"
          onClick={checkHealth}
          title="Click to re-check the backend connection"
          style={{ cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}
        >
          <span className="demo-pulse" style={{ background: health.online ? 'var(--color-success)' : 'var(--color-danger)' }} />
          {health.online ? 'Backend live' : 'Backend offline'}
        </button>

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
