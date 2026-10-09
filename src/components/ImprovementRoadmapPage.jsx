import React, { useState } from 'react';
import { ownerBusiness } from '../data/demoData.js';

const PRIORITY_META = {
  High:   { badge: 'badge-danger',  color: 'var(--color-danger)'  },
  Medium: { badge: 'badge-warning', color: 'var(--color-warning)' },
  Low:    { badge: 'badge-success', color: 'var(--color-success)' },
};

const STATUS_META = {
  'Completed':   { badge: 'badge-success', icon: '&#10003;', checkClass: 'checked'     },
  'In Progress': { badge: 'badge-warning', icon: '&#9654;',  checkClass: 'in-progress' },
  'Not Started': { badge: 'badge-muted',   icon: '&#9675;',  checkClass: ''            },
};

export default function ImprovementRoadmapPage() {
  const [actions, setActions] = useState(ownerBusiness.roadmapActions);
  const [expanded, setExpanded] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState('all');

  const completed   = actions.filter(a => a.status === 'Completed').length;
  const inProgress  = actions.filter(a => a.status === 'In Progress').length;
  const notStarted  = actions.filter(a => a.status === 'Not Started').length;
  const total       = actions.length;
  const progressPct = Math.round((completed / total) * 100);

  const cycle = (id) => {
    setActions(prev => prev.map(a => {
      if (a.id !== id) return a;
      const next = { 'Not Started': 'In Progress', 'In Progress': 'Completed', 'Completed': 'Not Started' };
      return { ...a, status: next[a.status] };
    }));
  };

  const filtered = priorityFilter === 'all'
    ? actions
    : actions.filter(a => a.priority === priorityFilter);

  const loan = ownerBusiness.loanApplication;

  return (
    <div>
      {/* Loan outcome banner */}
      {loan?.status === 'Rejected' && (
        <div style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem', background: 'var(--color-danger-dim)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-lg)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.2rem', color: 'var(--color-danger)', flexShrink: 0 }}>&#10007;</span>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--color-danger)', marginBottom: '0.25rem' }}>
              Loan Application Rejected — {loan.applicationDate}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
              Recorded reasons from lender:
            </div>
            {loan.rejectionReasons.map((r, i) => (
              <div key={i} style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '0.4rem', marginBottom: '0.2rem' }}>
                <span style={{ color: 'var(--color-danger)' }}>&#8227;</span> {r}
              </div>
            ))}
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
              Actions marked with a lock icon are confirmed lender reasons. Others are additional improvement opportunities identified by Climora.
            </div>
          </div>
        </div>
      )}

      {/* Progress summary */}
      <div className="grid-4 mb-3" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[
          { label: 'Total Actions', value: total,       color: 'var(--color-text)'      },
          { label: 'Completed',     value: completed,   color: 'var(--color-success)'   },
          { label: 'In Progress',   value: inProgress,  color: 'var(--color-warning)'   },
          { label: 'Not Started',   value: notStarted,  color: 'var(--color-text-secondary)' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: '1.6rem' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Overall progress bar */}
      <div className="card mb-3">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <h4 style={{ margin: 0 }}>Overall Progress</h4>
          <span style={{ fontWeight: 700, color: progressPct === 100 ? 'var(--color-success)' : 'var(--color-text)' }}>
            {progressPct}% complete
          </span>
        </div>
        <div className="progress-track" style={{ height: 10 }}>
          <div
            className="progress-fill"
            style={{
              width: `${progressPct}%`,
              background: `linear-gradient(90deg, var(--color-primary), var(--color-success))`,
            }}
          />
        </div>
        <div style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: 'var(--color-text-tertiary)' }}>
          {completed} of {total} actions completed &mdash; completing this roadmap does not guarantee loan approval.
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Filter by priority:</span>
        {['all', 'High', 'Medium', 'Low'].map(p => (
          <button
            key={p}
            className={`btn btn-xs ${priorityFilter === p ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setPriorityFilter(p)}
          >
            {p === 'all' ? 'All' : p}
          </button>
        ))}
      </div>

      {/* Action list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {filtered.map((action) => {
          const sm  = STATUS_META[action.status];
          const pm  = PRIORITY_META[action.priority];
          const isOpen = expanded === action.id;
          return (
            <div
              key={action.id}
              className="card card-sm"
              style={{ borderLeft: `3px solid ${pm.color}` }}
            >
              <div
                style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', cursor: 'pointer' }}
                onClick={() => setExpanded(isOpen ? null : action.id)}
              >
                {/* Status toggle */}
                <div
                  className={`action-item-check ${sm.checkClass}`}
                  title={`Click to cycle status (currently: ${action.status})`}
                  onClick={(e) => { e.stopPropagation(); cycle(action.id); }}
                  dangerouslySetInnerHTML={{ __html: sm.icon }}
                />

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-tertiary)', letterSpacing: '0.06em' }}>
                          {action.category}
                        </span>
                        {action.confirmedReason && (
                          <span className="badge badge-danger" style={{ fontSize: '0.6rem' }}>&#9632; Confirmed reason</span>
                        )}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{action.action}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                      <span className={`badge ${pm.badge}`}>{action.priority}</span>
                      <span className={`badge ${sm.badge}`}>{action.status}</span>
                      <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.9rem' }}>
                        {isOpen ? '&#9650;' : '&#9660;'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', marginBottom: '0.3rem' }}>Why this matters</div>
                    <div style={{ fontSize: '0.83rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{action.why}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', marginBottom: '0.4rem' }}>Suggested documents / evidence</div>
                    <div className="tag-list">
                      {action.documents.map((d, i) => (
                        <span key={i} className="badge badge-muted">&#9671; {d}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="disclaimer" style={{ marginTop: '1.25rem' }}>
        <span className="disclaimer-icon">&#9888;</span>
        Completing these actions improves your preparation for a future lender review. It does not guarantee loan approval. Only actions marked with a confirmed reason lock icon were recorded by the lender as rejection reasons. Other suggestions are additional opportunities identified by Climora.
      </div>
    </div>
  );
}
