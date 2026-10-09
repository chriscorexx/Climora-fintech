import React from 'react';
import { demoBusinesses } from '../data/demoData.js';
import { Badge } from './ui.jsx';

export default function TopBar({ pageTitle, appInfo, onBusinessSelect, selectedBusinessId, activePage, setActivePage }) {
  const pageTitles = {
    overview: 'Overview Dashboard',
    portfolio: 'MSME Portfolio',
    assessment: 'Risk Assessment',
    reports: 'Reports',
    settings: 'Settings',
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    if (query.length < 2) return;
    const match = demoBusinesses.find(
      (b) => b.name.toLowerCase().includes(query) || b.location.toLowerCase().includes(query)
    );
    if (match && onBusinessSelect) {
      onBusinessSelect(match);
    }
  };

  return (
    <div className="top-bar">
      <div className="page-title-container">
        <h2>{pageTitles[activePage] || pageTitle}</h2>
        {activePage === 'assessment' && selectedBusinessId && (
          <Badge variant="demo" style={{ marginLeft: '0.75rem', fontSize: '0.75rem' }}>
            Viewing Assessment
          </Badge>
        )}
      </div>
      {activePage === 'overview' || activePage === 'portfolio' ? (
        <input
          type="text"
          placeholder="Search businesses..."
          className="input"
          style={{ width: '240px', marginRight: '1rem' }}
          onChange={handleSearch}
        />
      ) : null}
      <div className="top-bar-right">
        <div className="demo-indicator">
          <span className="dot"></span>
          <span>Demo Mode</span>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>
          v{appInfo.version}
        </span>
      </div>
    </div>
  );
}
