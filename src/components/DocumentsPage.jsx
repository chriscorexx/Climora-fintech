import React, { useMemo, useState } from 'react';
import { useCurrentBusiness } from '../services/DataProvider.jsx';
import { api } from '../services/apiClient.js';
import { useAsync } from '../hooks/useAsync.js';
import { formatDate } from '../services/mappers.js';
import { Button, Card, EmptyState, ErrorState, LoadingState } from './ui.jsx';

const STATUS_CFG = {
  ready:       { label: 'Ready',       badge: 'badge-success', icon: '&#10003;', color: 'var(--color-success)' },
  in_progress: { label: 'In Progress', badge: 'badge-warning', icon: '&#9654;',  color: 'var(--color-warning)' },
  missing:     { label: 'Not Ready',   badge: 'badge-danger',  icon: '&#9675;',  color: 'var(--color-danger)'  },
};

const NEXT_STATUS = {
  missing: 'in_progress',
  in_progress: 'ready',
  ready: 'missing',
};

const CATEGORY_ICONS = { Financial: '&#9733;', Legal: '&#9998;', Climate: '&#9906;', Debt: '&#9679;', Profile: '&#9992;', Documents: '&#9671;' };

function categoryOf(documentName) {
  const name = documentName.toLowerCase();
  if (name.includes('registration') || name.includes('udyam') || name.includes('license') || name.includes('kyc')) return 'Profile';
  if (name.includes('financial') || name.includes('bank statement') || name.includes('tax') || name.includes('gst')) return 'Financial';
  if (name.includes('climate') || name.includes('continuity') || name.includes('risk')) return 'Climate';
  if (name.includes('loan') || name.includes('debt') || name.includes('facilit')) return 'Debt';
  return 'Documents';
}

export default function DocumentsPage() {
  const { business } = useCurrentBusiness();
  const [activeCategory, setActiveCategory] = useState('all');
  const [saving, setSaving] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const state = useAsync(() => (business ? api.loanReadiness(business.id) : Promise.resolve(null)), {
    deps: [business?.id],
    immediate: Boolean(business),
  });

  const readiness = state.data?.loanReadiness || null;
  const docs = useMemo(() => {
    const checklist = readiness?.documentChecklist || [];
    return checklist.map((item) => ({ ...item, category: categoryOf(item.documentName) }));
  }, [readiness]);

  const categories = useMemo(() => ['all', ...Array.from(new Set(docs.map((doc) => doc.category)))], [docs]);
  const filtered = activeCategory === 'all' ? docs : docs.filter((doc) => doc.category === activeCategory);

  const ready = docs.filter((doc) => doc.status === 'ready').length;
  const inProg = docs.filter((doc) => doc.status === 'in_progress').length;
  const notReady = docs.filter((doc) => doc.status === 'missing').length;

  const cycleStatus = async (doc) => {
    const next = NEXT_STATUS[doc.status] || 'in_progress';
    setSaving(doc.documentName);
    setSaveError(null);
    try {
      await api.updateDocumentStatus(business.id, doc.documentName, next);
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
        <EmptyState title="No business profile" message="Create a business profile to track documents." />
      </Card>
    );
  }

  if (state.loading) return <LoadingState label="Loading document checklist…" rows={4} />;
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;

  return (
    <div>
      {/* Summary */}
      <div className="grid-3 mb-3">
        {[
          { label: 'Ready', value: ready, color: 'var(--color-success)' },
          { label: 'In Progress', value: inProg, color: 'var(--color-warning)' },
          { label: 'Not Ready', value: notReady, color: 'var(--color-danger)' },
        ].map((card, index) => (
          <div key={index} className="stat-card" style={{ '--accent-start': card.color, '--accent-end': card.color }}>
            <div className="stat-label">{card.label}</div>
            <div className="stat-value" style={{ color: card.color, fontSize: '1.6rem' }}>{card.value}</div>
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
          <div
            className="progress-fill"
            style={{
              width: `${docs.length ? Math.round((ready / docs.length) * 100) : 0}%`,
              background: 'linear-gradient(90deg, var(--color-primary), var(--color-success))',
            }}
          />
        </div>
        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
          Click the status badge on any document to cycle its status. Document requirements vary by lender.
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {categories.map((category) => (
          <button
            key={category}
            className={`btn btn-xs ${activeCategory === category ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveCategory(category)}
          >
            {category === 'all' ? 'All Categories' : category}
          </button>
        ))}
      </div>

      {saveError && <ErrorState error={saveError} onRetry={() => setSaveError(null)} />}

      {/* Document list */}
      <div className="card" style={{ padding: 0 }}>
        {docs.length === 0 ? (
          <EmptyState title="No checklist" message="The loan readiness checklist could not be loaded for this business." />
        ) : (
          filtered.map((doc) => {
            const config = STATUS_CFG[doc.status] || STATUS_CFG.missing;
            const busy = saving === doc.documentName;
            return (
              <div key={doc.documentName} className="checklist-item" style={{ cursor: 'default' }}>
                <span
                  style={{ fontSize: '1rem', color: config.color, width: 22, flexShrink: 0, textAlign: 'center' }}
                  dangerouslySetInnerHTML={{ __html: config.icon }}
                />

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.15rem' }}>{doc.documentName}</div>
                  {doc.required && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-danger)' }}>&#8226; Required by the checklist</div>
                  )}
                  {doc.updatedAt && (
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-tertiary)' }}>Updated {formatDate(doc.updatedAt)}</div>
                  )}
                </div>

                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-tertiary)', marginRight: '0.75rem' }}>
                  <span dangerouslySetInnerHTML={{ __html: CATEGORY_ICONS[doc.category] || '&#9679;' }} />
                  {' '}{doc.category}
                </span>

                <Button
                  size="sm"
                  className={`badge ${config.badge}`}
                  onClick={() => cycleStatus(doc)}
                  disabled={busy}
                >
                  {busy ? '…' : config.label}
                </Button>
              </div>
            );
          })
        )}
      </div>

      <div className="disclaimer" style={{ marginTop: '1.25rem' }}>
        <span className="disclaimer-icon">&#9888;</span>
        This checklist reflects Climora&rsquo;s illustrative loan-readiness criteria, not the requirements of any
        specific lender. Requirements vary by institution and loan product.
      </div>
    </div>
  );
}
