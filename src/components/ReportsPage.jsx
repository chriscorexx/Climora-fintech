import React, { useState } from 'react';
import { useData } from '../services/DataProvider.jsx';
import { api } from '../services/apiClient.js';
import { useAsync } from '../hooks/useAsync.js';
import { formatDate, formatDimension, formatIndustry, formatMoney } from '../services/mappers.js';
import { EmptyState, ErrorState, LoadingState } from './ui.jsx';

const DISCLAIMER = [
  'This report is generated from an illustrative prototype heuristic',
  'scoring model. It is not a validated credit rating, a probability',
  'of default, or an official financial assessment, and must not be',
  'used as the sole basis for any lending decision.',
].join('\n');

function slug(value) {
  return String(value || 'report').replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').toLowerCase();
}

/** Builds a plain-text assessment report from a backend assessment record. */
function generateTextReport(business, assessment, factors) {
  const lines = [
    '================================================',
    '  CLIMORA — ILLUSTRATIVE CLIMATE RISK REPORT',
    '================================================',
    '',
    `Business Name  : ${business.name}`,
    `Industry       : ${formatIndustry(business.industry, business.sectors)}`,
    `Location       : ${business.location}`,
    business.state ? `State          : ${business.state}` : null,
    `Employees      : ${business.employeeCount ?? '—'}`,
    `Annual Turnover: ${formatMoney(business.annualTurnover)}`,
    `Annual Expenses: ${formatMoney(business.annualExpenses)}`,
    '',
    '-- ILLUSTRATIVE RISK SCORE ----------------------',
  ].filter(Boolean);

  if (!assessment) {
    lines.push('Overall Score  : not assessed yet');
    lines.push('Run an assessment to populate this report.');
    return lines.join('\n');
  }

  lines.push(
    `Overall Score  : ${assessment.overallScore} / 100`,
    `Category       : ${assessment.category}`,
    `Assessed       : ${formatDate(assessment.createdAt)}`,
    `Assessment ID  : ${assessment.id}`,
    `Complete       : ${assessment.isIncomplete ? 'no — missing ' + (assessment.missingDimensions || []).join(', ') : 'yes'}`,
    '',
    '-- DIMENSION BREAKDOWN --------------------------'
  );

  for (const factor of factors) {
    if (factor.score === null || factor.score === undefined) {
      lines.push(`${formatDimension(factor.dimension).padEnd(24)} : no data (excluded from score)`);
    } else {
      lines.push(
        `${formatDimension(factor.dimension).padEnd(24)} : ${String(factor.score).padStart(3)}  (weight ${Math.round((factor.effectiveWeight ?? factor.baseWeight ?? 0) * 100)}%)`,
        `  why: ${factor.explanation}`
      );
    }
  }

  lines.push(
    '',
    '-- METHODOLOGY ----------------------------------',
    assessment.methodology || '',
    '',
    '-- DATA NOTE ------------------------------------',
    assessment.dataNote || '',
    '',
    '-- DISCLAIMER -----------------------------------'
  );

  for (const line of DISCLAIMER.split('\n')) lines.push(line);

  lines.push('================================================', `Generated: ${new Date().toISOString()}`);
  return lines.join('\n');
}

function generateCSV(rows) {
  const header = [
    'Business',
    'Industry',
    'Location',
    'State',
    'Size',
    'Employees',
    'Annual Turnover',
    'Overall Score',
    'Category',
    'Complete',
    'Flood',
    'Rainfall',
    'Heat',
    'Business',
    'Financial',
    'Last Assessed',
  ];
  const body = rows.map((row) => {
    const dimensions = row.dimensions || {};
    const value = (key) => (dimensions[key] === undefined || dimensions[key] === null ? '' : dimensions[key]);
    return [
      `"${row.business.name}"`,
      formatIndustry(row.business.industry, null),
      `"${row.business.location || ''}"`,
      `"${row.business.state || ''}"`,
      row.business.businessSize || '',
      row.business.employeeCount ?? '',
      row.business.annualTurnover ?? '',
      row.score ?? '',
      row.category || 'Not assessed',
      row.isIncomplete ? 'no' : 'yes',
      value('flood'),
      value('rainfall'),
      value('heat'),
      value('business'),
      value('financial'),
      row.assessedAt || '',
    ].join(',');
  });
  return [header.join(','), ...body].join('\n');
}

export default function ReportsPage() {
  const { dashboard, businesses, sectors, health } = useData();
  const [selectedId, setSelectedId] = useState('');
  const [preview, setPreview] = useState('');
  const [previewType, setPreviewType] = useState(null);

  const metrics = dashboard?.metrics || null;
  const scoreByBusiness = new Map();
  for (const entry of metrics?.latestAssessmentByBusiness || []) scoreByBusiness.set(entry.businessId, entry);

  const rows = (metrics?.businesses?.length ? metrics.businesses : businesses).map((business) => {
    const latest = scoreByBusiness.get(business.id);
    return {
      business,
      score: latest?.overallScore ?? null,
      category: latest?.category ?? null,
      assessedAt: latest?.createdAt ?? null,
      isIncomplete: latest?.isIncomplete ?? true,
      dimensions: {},
    };
  });

  const selected = rows.find((row) => row.business.id === selectedId) || rows[0] || null;

  // Full factors for the selected business (history list omits them).
  const detailState = useAsync(
    () => (selected ? api.listBusinessAssessments(selected.business.id, { limit: 1 }) : Promise.resolve(null)),
    { deps: [selected?.business.id], immediate: Boolean(selected) }
  );
  const latestAssessment = detailState.data?.assessments?.[0] || null;
  const factors = latestAssessment?.factors || [];

  const handleDownload = (content, filename, mime) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!selected) {
    return (
      <div className="card">
        <EmptyState
          title="Nothing to export"
          message="Create an MSME profile and run an assessment to generate reports."
        />
      </div>
    );
  }


  return (
    <div>
      {/* ── Single assessment report ── */}
      <div className="card mb-3">
        <div className="card-header">
          <h3>Assessment Report — Single Business</h3>
          <span className="badge badge-demo">Text export</span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <label className="sr-only" htmlFor="report-business">
            Business to report on
          </label>
          <select
            id="report-business"
            className="select"
            style={{ flex: '1 1 200px', maxWidth: 300 }}
            value={selected.business.id}
            onChange={(event) => {
              setSelectedId(event.target.value);
              setPreview('');
              setPreviewType(null);
            }}
          >
            {rows.map((row) => (
              <option key={row.business.id} value={row.business.id}>
                {row.business.name}
              </option>
            ))}
          </select>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setPreview(
                generateTextReport({ ...selected.business, sectors }, latestAssessment, factors)
              );
              setPreviewType('text');
            }}
          >
            &#9654; Preview Report
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() =>
              handleDownload(
                generateTextReport({ ...selected.business, sectors }, latestAssessment, factors),
                `${slug(selected.business.name)}_risk_report.txt`,
                'text/plain'
              )
            }
          >
            &#8595; Download .txt
          </button>
        </div>

        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-tertiary)', marginBottom: '0.75rem' }}>
          {latestAssessment
            ? `Latest assessment: ${formatDate(latestAssessment.createdAt)} · score ${latestAssessment.overallScore}/100 (${latestAssessment.category})`
            : 'This business has no recorded assessment yet — the report will state that explicitly.'}
        </p>

        {detailState.loading && <LoadingState label="Loading latest assessment…" rows={2} />}
        {detailState.error && <ErrorState error={detailState.error} onRetry={detailState.reload} />}

        {previewType === 'text' && preview && (
          <pre
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              fontFamily: "'Courier New', monospace",
              overflowX: 'auto',
              whiteSpace: 'pre',
              maxHeight: 320,
              overflowY: 'auto',
            }}
          >
            {preview}
          </pre>
        )}
      </div>

      {/* ── Portfolio CSV ── */}
      <div className="card mb-3">
        <div className="card-header">
          <h3>Portfolio Export — All Businesses</h3>
          <span className="badge badge-demo">CSV</span>
        </div>
        <p style={{ fontSize: '0.83rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
          Export all {rows.length} businesses with their illustrative risk scores and the portfolio metrics computed by
          the backend.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setPreview(generateCSV(rows));
              setPreviewType('csv');
            }}
          >
            &#9654; Preview CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => handleDownload(generateCSV(rows), 'climora_portfolio.csv', 'text/csv')}>
            &#8595; Download CSV
          </button>
          <span className={health.online ? 'badge badge-demo' : 'badge badge-simulated'}>
            {health.online ? 'Live data' : 'Backend offline'}
          </span>
        </div>

        {previewType === 'csv' && preview && (
          <pre
            style={{
              marginTop: '1rem',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              fontSize: '0.72rem',
              color: 'var(--color-text-secondary)',
              fontFamily: "'Courier New', monospace",
              overflowX: 'auto',
              whiteSpace: 'pre',
              maxHeight: 240,
              overflowY: 'auto',
            }}
          >
            {preview}
          </pre>
        )}
      </div>

      {/* ── Portfolio summary ── */}
      <div className="card mb-3">
        <div className="card-header">
          <h3>Portfolio Summary</h3>
          <span className="badge badge-muted">From /api/dashboard</span>
        </div>
        {metrics ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
            {[
              { label: 'Portfolio size', value: metrics.portfolioSize },
              { label: 'Assessed', value: metrics.assessedBusinesses },
              { label: 'Average score', value: metrics.averageRiskScore },
              { label: 'Elevated risk', value: metrics.highRiskBusinesses },
              { label: 'Incomplete', value: metrics.incompleteAssessments },
              { label: 'Assessments (30d)', value: metrics.assessmentsLast30Days },
              { label: 'Saved schemes', value: metrics.savedSchemes },
              { label: 'Open actions', value: metrics.openImprovementActions },
            ].map((item) => (
              <div key={item.label} style={{ background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{item.value ?? '—'}</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '0.83rem', color: 'var(--color-text-secondary)' }}>Dashboard metrics unavailable.</p>
        )}
      </div>

      {/* ── Placeholder templates ── */}
      <div className="card">
        <div className="card-header">
          <h3>Report Templates</h3>
          <span className="badge badge-muted">Not implemented</span>
        </div>
        <div className="grid-3" style={{ gap: '0.75rem' }}>
          {['Lender Review Summary', 'Loan Readiness Pack', 'Improvement Progress Report'].map((template) => (
            <div key={template} style={{ padding: '1rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', opacity: 0.5 }}>&#9671;</div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>{template}</div>
              <button className="btn btn-secondary btn-xs" disabled>
                Not implemented
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="disclaimer" style={{ marginTop: '1.25rem' }}>
        <span className="disclaimer-icon">&#9888;</span>
        Exported reports contain illustrative prototype scores computed from Open-Meteo data where available. They are
        not validated financial assessments and must not be presented as official credit reports.
      </div>
    </div>
  );
}
