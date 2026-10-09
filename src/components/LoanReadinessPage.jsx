import React, { useMemo, useState } from 'react';
import { useCurrentBusiness } from '../services/DataProvider.jsx';
import { api } from '../services/apiClient.js';
import { useAsync } from '../hooks/useAsync.js';
import { formatDate } from '../services/mappers.js';
import { Button, Card, EmptyState, ErrorState, LoadingState } from './ui.jsx';

const STATUS_CONFIG = {
  ready:        { label: 'Ready',       badge: 'badge-success', color: 'var(--color-success)', icon: '&#9679;' },
  in_progress:  { label: 'In Progress', badge: 'badge-warning', color: 'var(--color-warning)', icon: '&#9654;' },
  missing:      { label: 'Missing',     badge: 'badge-danger',  color: 'var(--color-danger)',  icon: '&#9675;' },
};

const NEXT_STATUS = {
  missing: 'in_progress',
  in_progress: 'ready',
  ready: 'missing',
};

const CATEGORY_ICONS = { Profile: '&#9992;', Financials: '&#9733;', Climate: '&#9906;', Documents: '&#9671;' };

/** Groups a document checklist entry into a reporting category from its name. */
function categoryOf(documentName) {
  const name = documentName.toLowerCase();
  if (name.includes('registration') || name.includes('udyam') || name.includes('license')) return 'Profile';
  if (name.includes('financial') || name.includes('bank statement') || name.includes('tax') || name.includes('gst')) return 'Financials';
  if (name.includes('climate') || name.includes('continuity') || name.includes('risk')) return 'Climate';
  return 'Documents';
}

export default function LoanReadinessPage({ setActivePage }) {
  const { business } = useCurrentBusiness();
  const [activeCategory, setActiveCategory] = useState('all');
  const [saving, setSaving] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const state = useAsync(() => (business ? api.loanReadiness(business.id) : Promise.resolve(null)), {
    deps: [business?.id],
    immediate: Boolean(business),
  });
  const actionsState = useAsync(
    () => (business ? api.improvements(business.id) : Promise.resolve({ improvementActions: [] })),
    { deps: [business?.id], immediate: Boolean(business) }
  );

  const readiness = state.data?.loanReadiness || null;
  const items = useMemo(() => {
    const checklist = readiness?.documentChecklist || [];
    return checklist.map((item) => ({ ...item, category: categoryOf(item.documentName) }));
  }, [readiness]);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(items.map((item) => item.category)))],
    [items]
  );
  const filtered = activeCategory === 'all' ? items : items.filter((item) => item.category === activeCategory);

  const total = items.length;
  const complete = items.filter((item) => item.status === 'ready').length;
  const inProg = items.filter((item) => item.status === 'in_progress').length;
  const needed = items.filter((item) => item.status === 'missing').length;
  const pct = total ? Math.round((complete / total) * 100) : 0;

  const actions = actionsState.data?.improvementActions || [];
  const completedRoadmap = actions.filter((action) => action.status === 'done').length;

  const advanceStatus = async (item) => {
    const next = NEXT_STATUS[item.status] || 'in_progress';
    setSaving(item.documentName);
    setSaveError(null);
    try {
      await api.updateDocumentStatus(business.id, item.documentName, next);
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
        <EmptyState title="No business profile" message="Create a business profile to track loan readiness." />
      </Card>
    );
  }

  if (state.loading) return <LoadingState label="Loading loan readiness…" rows={4} />;
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;

  return (
    <div>
      {/* Summary cards */}
      <div className="grid-4 mb-3">
        {[
          { label: 'Readiness Score', value: `${pct}%`, sub: 'of checklist complete', color: pct >= 75 ? 'var(--color-success)' : pct >= 50 ? 'var(--color-warning)' : 'var(--color-danger)' },
          { label: 'Items Complete', value: complete, sub: `of ${total} items`, color: 'var(--color-success)' },
          { label: 'In Progress', value: inProg, sub: 'items underway', color: 'var(--color-warning)' },
          { label: 'Needs Attention', value: needed, sub: 'items outstanding', color: 'var(--color-danger)' },
        ].map((card, index) => (
          <div key={index} className="stat-card" style={{ '--accent-start': card.color, '--accent-end': card.color }}>
            <div className="stat-label">{card.label}</div>
            <div className="stat-value" style={{ color: card.color, fontSize: '1.6rem' }}>{card.value}</div>
            <div className="stat-sub">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Overall readiness bar */}
      <div className="card mb-3">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
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
          <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, var(--color-primary), ${pct >= 75 ? 'var(--color-success)' : 'var(--color-warning)'})` }} />
        </div>

        {readiness?.applicationStatus && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            <span className="badge badge-primary">Application: {readiness.applicationStatus.replace('_', ' ')}</span>
            {readiness.lenderName && <span>Lender: {readiness.lenderName}</span>}
            {readiness.lenderFeedback && <span>Feedback recorded {formatDate(readiness.updatedAt)}</span>}
          </div>
        )}

        {/* Category breakdown */}
        {categories.filter((category) => category !== 'all').length > 0 && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.85rem' }}>
            {categories.filter((category) => category !== 'all').map((category) => {
              const categoryItems = items.filter((item) => item.category === category);
              const done = categoryItems.filter((item) => item.status === 'ready').length;
              const categoryPct = Math.round((done / categoryItems.length) * 100);
              const col = categoryPct === 100 ? 'var(--color-success)' : categoryPct >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';
              return (
                <div key={category} style={{ flex: 1, minWidth: 110 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      <span dangerouslySetInnerHTML={{ __html: CATEGORY_ICONS[category] || '&#9671;' }} /> {category}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: col }}>{done}/{categoryItems.length}</span>
                  </div>
                  <div className="progress-track" style={{ height: 5 }}>
                    <div className="progress-fill" style={{ width: `${categoryPct}%`, background: col }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Roadmap link card */}
      <div className="card mb-3" style={{ borderLeft: '3px solid var(--color-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h4 style={{ margin: '0 0 0.25rem' }}>Improvement Roadmap</h4>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
            {completedRoadmap} of {actions.length} improvement actions completed. Work through your personalised roadmap
            to close the gaps in this checklist.
          </div>
        </div>
        <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }} onClick={() => setActivePage('roadmap')}>
          Open Roadmap &#8250;
        </button>
      </div>

      {saveError && <ErrorState error={saveError} onRetry={() => setSaveError(null)} />}

      {/* Category filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {categories.map((category) => (
          <button
            key={category}
            className={`btn btn-xs ${activeCategory === category ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveCategory(category)}
          >
            {category === 'all' ? 'All' : category}
          </button>
        ))}
      </div>

      {/* Checklist */}
      <div className="card">
        {total === 0 ? (
          <EmptyState title="Checklist unavailable" message="The readiness checklist could not be loaded for this business." />
        ) : (
          filtered.map((item) => {
            const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.missing;
            const busy = saving === item.documentName;
            return (
              <div key={item.documentName} className="checklist-item">
                <span style={{ fontSize: '0.85rem', color: config.color, width: 18, flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: config.icon }} />
                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      fontSize: '0.85rem',
                      textDecoration: item.status === 'ready' ? 'line-through' : 'none',
                      color: item.status === 'ready' ? 'var(--color-text-tertiary)' : 'var(--color-text)',
                    }}
                  >
                    {item.documentName}
                  </span>
                  {item.required && (
                    <span style={{ fontSize: '0.68rem', color: 'var(--color-danger)', marginLeft: '0.4rem' }}>required</span>
                  )}
                </div>
                <span style={{ fontSize: '0.68rem', color: 'var(--color-text-tertiary)', marginRight: '0.5rem' }}>{item.category}</span>
                <Button size="sm" onClick={() => advanceStatus(item)} disabled={busy}>
                  {busy ? 'Saving…' : config.label} &#8596;
                </Button>
              </div>
            );
          })
        )}
      </div>

      <div className="disclaimer" style={{ marginTop: '1.25rem' }}>
        <span className="disclaimer-icon">&#9888;</span>
        This checklist measures your preparation against Climora&rsquo;s illustrative criteria. It does not represent
        the actual requirements of any specific lender. Requirements vary by institution and loan product.
      </div>
    </div>
  );
}
