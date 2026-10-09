import React, { useState } from 'react';
import { useCurrentBusiness } from '../services/DataProvider.jsx';
import { api } from '../services/apiClient.js';
import { useAsync } from '../hooks/useAsync.js';
import { formatDate } from '../services/mappers.js';
import { Card, EmptyState, ErrorState, LoadingState } from './ui.jsx';

const PRIORITY_META = {
  High:   { badge: 'badge-high',     color: 'var(--color-danger)'  },
  Medium: { badge: 'badge-moderate', color: 'var(--color-warning)' },
  Low:    { badge: 'badge-low',      color: 'var(--color-success)' },
};

const STATUS_META = {
  done:           { label: 'Done',         badge: 'badge-success', icon: '&#10003;', checkClass: 'checked'     },
  in_progress:    { label: 'In Progress',  badge: 'badge-warning', icon: '&#9654;',  checkClass: 'in-progress' },
  open:           { label: 'Open',         badge: 'badge-muted',   icon: '&#9675;',  checkClass: ''            },
  not_applicable: { label: 'N/A',          badge: 'badge-muted',   icon: '&#8212;',  checkClass: ''            },
};

const NEXT_STATUS = {
  open: 'in_progress',
  in_progress: 'done',
  done: 'open',
};

export default function ImprovementRoadmapPage() {
  const { business } = useCurrentBusiness();
  const [expanded, setExpanded] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [saving, setSaving] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const state = useAsync(() => (business ? api.improvements(business.id) : Promise.resolve({ improvementActions: [] })), {
    deps: [business?.id],
    immediate: Boolean(business),
  });
  const readinessState = useAsync(
    () => (business ? api.loanReadiness(business.id) : Promise.resolve(null)),
    { deps: [business?.id], immediate: Boolean(business) }
  );

  const actions = state.data?.improvementActions || [];
  const readiness = readinessState.data?.loanReadiness || null;

  const completed = actions.filter((action) => action.status === 'done').length;
  const inProgress = actions.filter((action) => action.status === 'in_progress').length;
  const notStarted = actions.filter((action) => action.status === 'open').length;
  const total = actions.length;
  const progressPct = total ? Math.round((completed / total) * 100) : 0;

  const filtered = actions.filter((action) => {
    const matchesPriority = priorityFilter === 'all' || action.priority === priorityFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'open' && (action.status === 'open' || action.status === 'in_progress')) ||
      action.status === statusFilter;
    return matchesPriority && matchesStatus;
  });

  const cycle = async (action) => {
    const next = NEXT_STATUS[action.status] || 'in_progress';
    setSaving(action.id);
    setSaveError(null);
    try {
      await api.updateImprovement(business.id, action.id, next);
      state.reload();
    } catch (error) {
      setSaveError(error);
    } finally {
      setSaving(null);
    }
  };

  if (!business) {
    return (
      <Card>
        <EmptyState title="No business profile" message="Create a business profile to see your improvement roadmap." />
      </Card>
    );
  }

  if (state.loading) return <LoadingState label="Loading roadmap…" rows={4} />;
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;

  return (
    <div>
      {/* Rejection context banner */}
      {readiness?.applicationStatus === 'rejected' && (
        <div
          style={{
            marginBottom: '1.25rem',
            padding: '1rem 1.25rem',
            background: 'var(--color-danger-dim)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start',
          }}
          role="status"
        >
          <span style={{ fontSize: '1.2rem', color: 'var(--color-danger)', flexShrink: 0 }}>&#10007;</span>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--color-danger)', marginBottom: '0.25rem' }}>
              Loan application recorded as rejected
            </div>
            {readiness.rejectionReason ? (
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '0.4rem' }}>
                <span style={{ color: 'var(--color-danger)' }}>&#8227;</span> {readiness.rejectionReason}
              </div>
            ) : (
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                No specific reason was recorded by the lender.
              </div>
            )}
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
              The actions below are improvement opportunities identified by Climora — only the recorded rejection reason
              came from the lender.
            </div>
          </div>
        </div>
      )}

      {/* Progress summary */}
      <div className="grid-4 mb-3" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[
          { label: 'Total Actions', value: total, color: 'var(--color-text)' },
          { label: 'Completed', value: completed, color: 'var(--color-success)' },
          { label: 'In Progress', value: inProgress, color: 'var(--color-warning)' },
          { label: 'Open', value: notStarted, color: 'var(--color-text-secondary)' },
        ].map((card, index) => (
          <div key={index} className="stat-card">
            <div className="stat-label">{card.label}</div>
            <div className="stat-value" style={{ color: card.color, fontSize: '1.6rem' }}>{card.value}</div>
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
          {completed} of {total} actions completed — completing this roadmap does not guarantee loan approval.
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Priority:</span>
        {['all', 'High', 'Medium', 'Low'].map((priority) => (
          <button
            key={priority}
            className={`btn btn-xs ${priorityFilter === priority ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setPriorityFilter(priority)}
          >
            {priority === 'all' ? 'All' : priority}
          </button>
        ))}
        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginLeft: '0.75rem' }}>Status:</span>
        <label className="sr-only" htmlFor="roadmap-status-filter">
          Filter by status
        </label>
        <select
          id="roadmap-status-filter"
          className="select"
          style={{ width: 150 }}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="open">Open / in progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      {saveError && <ErrorState error={saveError} onRetry={() => setSaveError(null)} />}

      {/* Action list */}
      {total === 0 ? (
        <Card>
          <EmptyState
            title="No actions yet"
            message="Run an assessment for this business to generate improvement actions from the risk engine."
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {filtered.map((action) => {
            const statusMeta = STATUS_META[action.status] || STATUS_META.open;
            const priorityMeta = PRIORITY_META[action.priority] || PRIORITY_META.Low;
            const isOpen = expanded === action.id;
            const busy = saving === action.id;
            return (
              <div key={action.id} className="card card-sm" style={{ borderLeft: `3px solid ${priorityMeta.color}` }}>
                <div
                  style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', cursor: 'pointer' }}
                  onClick={() => setExpanded(isOpen ? null : action.id)}
                >
                  <button
                    type="button"
                    className={`action-item-check ${statusMeta.checkClass}`}
                    title={`Cycle status (currently: ${statusMeta.label})`}
                    aria-label={`Change status of ${action.title}, currently ${statusMeta.label}`}
                    disabled={busy}
                    onClick={(event) => {
                      event.stopPropagation();
                      cycle(action);
                    }}
                    dangerouslySetInnerHTML={{ __html: busy ? '&#8230;' : statusMeta.icon }}
                  />

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: 'var(--color-text-tertiary)',
                          letterSpacing: '0.06em',
                        }}
                      >
                        {action.source === 'climora_engine' ? 'Climora engine' : action.source}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{action.title}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, alignItems: 'center' }}>
                    <span className={`badge ${priorityMeta.badge}`}>{action.priority}</span>
                    <span className={`badge ${statusMeta.badge}`}>{statusMeta.label}</span>
                    <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.9rem' }} aria-hidden="true">
                      {isOpen ? '&#9650;' : '&#9660;'}
                    </span>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', marginBottom: '0.3rem' }}>
                        Recommended action
                      </div>
                      <div style={{ fontSize: '0.83rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                        {action.description}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)' }}>
                      Created {formatDate(action.createdAt)} · Updated {formatDate(action.updatedAt)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="disclaimer" style={{ marginTop: '1.25rem' }}>
        <span className="disclaimer-icon">&#9888;</span>
        Completing these actions improves your preparation for a future lender review. It does not guarantee loan
        approval, and no action is presented as a confirmed lender requirement unless you recorded it as such.
      </div>
    </div>
  );
}
