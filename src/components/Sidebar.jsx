import React from 'react';

export default function Sidebar({ activePage, setActivePage }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: 'M' },
    { id: 'portfolio', label: 'MSME Portfolio', icon: 'B' },
    { id: 'assessment', label: 'Risk Assessments', icon: 'A' },
    { id: 'reports', label: 'Reports', icon: 'R' },
    { id: 'settings', label: 'Settings', icon: 'S' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">C</div>
          <span className="logo-text">Climora</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <div
            key={item.id}
            className={`sidebar-nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>
    </aside>
  );
}
