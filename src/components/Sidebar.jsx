import React from 'react';
import logoSrc from '../assets/logo.jpg';

const LENDER_NAV = [
  { id: 'overview',     label: 'Overview',          icon: '⊞',  badge: null },
  { id: 'portfolio',    label: 'MSME Portfolio',     icon: '◫',  badge: null },
  { id: 'assessment',   label: 'Risk Assessments',   icon: '◈',  badge: null },
  { id: 'loanApps',     label: 'Loan Applications',  icon: '⊟',  badge: '3'  },
  { id: 'reports',      label: 'Reports',            icon: '⊜',  badge: null },
  { id: 'settings',     label: 'Settings',           icon: '⊙',  badge: null },
];

const OWNER_NAV = [
  { id: 'ownerDashboard',   label: 'My Dashboard',       icon: '⊞',  badge: null },
  { id: 'myBusiness',       label: 'My Business',        icon: '◫',  badge: null },
  { id: 'climateExposure',  label: 'Climate Exposure',   icon: '◈',  badge: null },
  { id: 'loanReadiness',    label: 'Loan Readiness',     icon: '⊟',  badge: null },
  { id: 'roadmap',          label: 'Improvement Roadmap',icon: '◉',  badge: '2'  },
  { id: 'documents',        label: 'Documents',          icon: '⊜',  badge: null },
  { id: 'history',          label: 'Assessment History', icon: '⊙',  badge: null },
];

export default function Sidebar({ activePage, setActivePage, role, setRole }) {
  const nav = role === 'lender' ? LENDER_NAV : OWNER_NAV;

  const userName  = role === 'lender' ? 'Alex Rivera'    : 'Maria Santos';
  const userInitials = role === 'lender' ? 'AR' : 'MS';
  const userRole  = role === 'lender' ? 'Credit Analyst' : 'Business Owner';

  const handleRoleSwitch = (r) => {
    setRole(r);
    setActivePage(r === 'lender' ? 'overview' : 'ownerDashboard');
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <img src={logoSrc} alt="Climora logo" />
        <span className="sidebar-logo-text">Climora</span>
        <span className="sidebar-logo-badge">DEMO</span>
      </div>

      {/* Role switcher */}
      <div className="role-switcher">
        <button
          className={`role-btn ${role === 'lender' ? 'active' : ''}`}
          onClick={() => handleRoleSwitch('lender')}
        >
          ⊛ Lender
        </button>
        <button
          className={`role-btn ${role === 'owner' ? 'active' : ''}`}
          onClick={() => handleRoleSwitch('owner')}
        >
          ⊚ Owner
        </button>
      </div>

      {/* Navigation */}
      <div className="sidebar-section-label">
        {role === 'lender' ? 'Lender Workspace' : 'Owner Workspace'}
      </div>
      <nav className="sidebar-nav" aria-label={role === 'lender' ? 'Lender navigation' : 'Owner navigation'}>
        {nav.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sidebar-nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
            aria-current={activePage === item.id ? 'page' : undefined}
          >
            <span className="nav-icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && (
              <span className="nav-badge">{item.badge}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer user */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">{userInitials}</div>
          <div className="user-info">
            <div className="user-name">{userName}</div>
            <div className="user-role">{userRole}</div>
          </div>
          <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.75rem' }}>&#8942;</span>
        </div>
      </div>
    </aside>
  );
}
