import React, { useState } from 'react';
import { ownerBusiness } from '../data/demoData.js';

const STATUS_CFG = {
  'Ready':       { badge: 'badge-success', icon: '&#10003;', color: 'var(--color-success)' },
  'In Progress': { badge: 'badge-warning', icon: '&#9654;',  color: 'var(--color-warning)' },
  'Not Ready':   { badge: 'badge-danger',  icon: '&#9675;',  color: 'var(--color-danger)'  },
};

const CATEGORY_ICONS = {
  Financial: '&#9733;',
  Legal:     '&#9998;',
  Climate:   '&#9906;',
  Debt:      '&#9679;',
};

export default function DocumentsPage() {
  const [docs, setDocs] = useState(ownerBusiness.documents);
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = ['all', ...new Set(docs.map(d => d.category))];
  const filtered   = activeCategory === 'all' ? docs : docs.filter(d => d.category === activeCategory);

  const ready    = docs.filter(d => d.status === 'Ready').length;
  const inProg   = docs.filter(d => d.status === 'In Progress').length;
  const notReady = docs.filter(d => d.status === 'Not Ready').length;

  const cycleStatus = (id) => {
    setDocs(prev => prev.map(d => {
      if (d.id !== id) return d;
      const next = { 'Not Ready': 'In Progress', 'In Progress': 'Ready', 'Ready': 'Not Ready' };
      return { ...d, status: next[d.status] };
    }));
  };

  return (
    <div>
      {/* Summary */}
      <div className="grid-3 mb-3">
        {[
          { label: 'Ready',        value: ready,    color: 'var(--color-success)' },
          { label: 'In Progress',  value: inProg,   color: 'var(--color-warning)' },
          { label: 'Not Ready',    value: notReady, color: 'var(--color-danger)'  },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ '--accent-start': s.color, '--accent-end': s.color }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: '1.6rem' }}>{s.value}</div>
            <div className="stat-sub">of {docs.length} documents</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="card mb-3">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
          <h3 style={{ margin: 0 }}>Document Preparation</h3>
          <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>
            {ready}/{docs.length} ready
          </span>
        </div>
        <div className="progress-track" style={{ height: 8 }}>
          <div className="progress-fill" style={{
            width: `${Math.round((ready / docs.length) * 100)}%`,
            background: 'linear-gradient(90deg, var(--color-primary), var(--color-success))',
          }} />
        </div>
        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
          Click the status badge on any document to cycle its status. Document requirements vary by lender.
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {categories.map(c => (
          <button
            key={c}
            className={`btn btn-xs ${activeCategory === c ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveCategory(c)}
          >
            {c === 'all' ? 'All Categories' : c}
          </button>
        ))}
      </div>

      {/* Document list */}
      <div className="card" style={{ padding: 0 }}>
        {filtered.map((doc, i) => {
          const cfg = STATUS_CFG[doc.status] || STATUS_CFG['Not Ready'];
          return (
            <div
              key={doc.id}
              className="checklist-item"
              style={{ cursor: 'default' }}
            >
              <span style={{ fontSize: '1rem', color: cfg.color, width: 22, flexShrink: 0, textAlign: 'center' }}
                dangerouslySetInnerHTML={{ __html: cfg.icon }} />

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.15rem' }}>{doc.name}</div>
                {doc.linkedAction && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)' }}>
                    &#9679; Linked to improvement action
                  </div>
                )}
              </div>

              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', marginRight: '0.75rem' }}>
                <span dangerouslySetInnerHTML={{ __html: CATEGORY_ICONS[doc.category] || '&#9679;' }} />
                {' '}{doc.category}
              </span>

              <button
                className={`badge ${cfg.badge}`}
                style={{ cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}
                title="Click to update status"
                onClick={() => cycleStatus(doc.id)}
              >
                {doc.status}
              </button>
            </div>
          );
        })}
      </div>

      <div className="disclaimer" style={{ marginTop: '1.25rem' }}>
        <span className="disclaimer-icon">&#9888;</span>
        This checklist is illustrative. Actual document requirements vary by lender and loan product.
        Climora does not store uploaded files in this demo.
      </div>
    </div>
  );
}
