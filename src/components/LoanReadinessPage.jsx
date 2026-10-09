import React, { useState } from 'react';
import { ownerBusiness, demoRoadmapActions } from '../data/demoData.js';

const READINESS_ITEMS = [
  { id: 'r1', label: 'Business profile complete',          category: 'Profile',   status: 'complete',     icon: '&#9679;' },
  { id: 'r2', label: 'Location and industry recorded',     category: 'Profile',   status: 'complete',     icon: '&#9679;' },
  { id: 'r3', label: 'Revenue and expenses documented',    category: 'Financials',status: 'complete',     icon: '&#9679;' },
  { id: 'r4', label: 'Existing debt obligations listed',   category: 'Financials',status: 'complete',     icon: '&#9679;' },
  { id: 'r5', label: 'Cash-flow forecast prepared',        category: 'Financials',status: 'in-progress',  icon: '&#9654;' },
  { id: 'r6', label: 'Emergency reserve plan documented',  category: 'Financials',status: 'needs-action', icon: '&#9675;' },
  { id: 'r7', label: 'Flood response plan documented',     category: 'Climate',   status: 'needs-action', icon: '&#9675;' },
  { id: 'r8', label: 'Business continuity plan drafted',   category: 'Climate',   status: 'needs-action', icon: '&#9675;' },
  { id: 'r9', label: 'Bank statements (24 months) ready',  category: 'Documents', status: 'complete',     icon: '&#9679;' },
  { id: 'r10',label: 'Tax returns (2 years) ready',        category: 'Documents', status: 'in-progress',  icon: '&#9654;' },
  { id: 'r11',label: 'Business registration document',     category: 'Documents', status: 'complete',     icon: '&#9679;' },
  { id: 'r12',label: 'Supporting documents checklist done',category: 'Documents', status: 'needs-action', icon: '&#9675;' },
];

const STATUS_CONFIG = {
  complete:    { label: 'Complete',    badge: 'badge-success', color: 'var(--color-success)' },
  'in-progress':{ label: 'In Progress',badge: 'badge-warning', color: 'var(--color-warning)' },
  'needs-action':{ label: 'Needs Action',badge: 'badge-danger', color: 'var(--color-danger)' },
};

const CATEGORY_ICONS = {
  Profile: '&#9992;', Financials: '&#9733;', Climate: '&#9906;', Documents: '&#9671;',
};

export default function LoanReadinessPage({ setActivePage }) {
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = ['all', ...new Set(READINESS_ITEMS.map(r => r.category))];
  const filtered   = activeCategory === 'all' ? READINESS_ITEMS : READINESS_ITEMS.filter(r => r.category === activeCategory);

  const total      = READINESS_ITEMS.length;
  const complete   = READINESS_ITEMS.filter(r => r.status === 'complete').length;
  const inProg     = READINESS_ITEMS.filter(r => r.status === 'in-progress').length;
  const needed     = READINESS_ITEMS.filter(r => r.status === 'needs-action').length;
  const pct        = Math.round((complete / total) * 100);

  const completedRoadmap = demoRoadmapActions.filter(a => a.status === 'Completed').length;
  const totalRoadmap     = demoRoadmapActions.length;

  return (
    <div>
      {/* Summary cards */}
      <div className="grid-4 mb-3">
        {[
          { label: 'Readiness Score',    value: `${pct}%`,       sub: 'of checklist complete',  color: pct >= 75 ? 'var(--color-success)' : pct >= 50 ? 'var(--color-warning)' : 'var(--color-danger)' },
          { label: 'Items Complete',     value: complete,         sub: `of ${total} items`,       color: 'var(--color-success)'  },
          { label: 'In Progress',        value: inProg,           sub: 'items underway',          color: 'var(--color-warning)'  },
          { label: 'Needs Attention',    value: needed,           sub: 'items outstanding',       color: 'var(--color-danger)'   },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ '--accent-start': s.color, '--accent-end': s.color }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: '1.6rem' }}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Overall readiness bar */}
      <div className="card mb-3">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.2rem' }}>Loan Readiness Checklist</h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
              This checklist measures your preparation — it does not estimate the probability of approval.
            </div>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.3rem', color: pct >= 75 ? 'var(--color-success)' : pct >= 50 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
            {pct}%
          </span>
        </div>
        <div className="progress-track" style={{ height: 10, marginBottom: '0.5rem' }}>
          <div className="progress-fill" style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, var(--color-primary), ${pct >= 75 ? 'var(--color-success)' : 'var(--color-warning)'})`,
          }} />
        </div>

        {/* Category breakdown */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.85rem' }}>
          {['Profile', 'Financials', 'Climate', 'Documents'].map(cat => {
            const items   = READINESS_ITEMS.filter(r => r.category === cat);
            const done    = items.filter(r => r.status === 'complete').length;
            const catPct  = Math.round((done / items.length) * 100);
            const col     = catPct === 100 ? 'var(--color-success)' : catPct >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';
            return (
              <div key={cat} style={{ flex: 1, minWidth: 110 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    <span dangerouslySetInnerHTML={{ __html: CATEGORY_ICONS[cat] }} /> {cat}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: col }}>{done}/{items.length}</span>
                </div>
                <div className="progress-track" style={{ height: 5 }}>
                  <div className="progress-fill" style={{ width: `${catPct}%`, background: col }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Roadmap link card */}
      <div className="card mb-3" style={{ borderLeft: '3px solid var(--color-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h4 style={{ margin: '0 0 0.25rem' }}>Improvement Roadmap</h4>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
            {completedRoadmap} of {totalRoadmap} improvement actions completed. Continue working through your personalised roadmap to address the lender&#8217;s recorded reasons.
          </div>
        </div>
        <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }} onClick={() => setActivePage('roadmap')}>
          Open Roadmap &#8250;
        </button>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {categories.map(c => (
          <button
            key={c}
            className={`btn btn-xs ${activeCategory === c ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveCategory(c)}
          >
            {c === 'all' ? 'All' : c}
          </button>
        ))}
      </div>

      {/* Checklist */}
      <div className="card">
        {filtered.map((item, i) => {
          const cfg = STATUS_CONFIG[item.status];
          return (
            <div key={item.id} className="checklist-item">
              <span style={{ fontSize: '0.85rem', color: cfg.color, width: 18, flexShrink: 0 }}
                dangerouslySetInnerHTML={{ __html: item.icon }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.85rem', textDecoration: item.status === 'complete' ? 'line-through' : 'none', color: item.status === 'complete' ? 'var(--color-text-tertiary)' : 'var(--color-text)' }}>
                  {item.label}
                </span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--color-text-tertiary)', marginRight: '0.5rem' }}>{item.category}</span>
              <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
            </div>
          );
        })}
      </div>

      <div className="disclaimer" style={{ marginTop: '1.25rem' }}>
        <span className="disclaimer-icon">&#9888;</span>
        This checklist measures your preparation against Climora&#8217;s illustrative criteria. It does not represent the actual requirements of any specific lender. Requirements vary by institution and loan product.
      </div>
    </div>
  );
}
