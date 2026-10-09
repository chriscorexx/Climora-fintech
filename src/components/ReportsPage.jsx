import React, { useState } from 'react';
import { demoBusinesses } from '../data/demoData.js';

function getCategory(score) {
  if (score <= 24) return 'Low';
  if (score <= 49) return 'Moderate';
  if (score <= 74) return 'High';
  return 'Very High';
}

function generateTextReport(b) {
  const dims = b.assessment.dimensions;
  return [
    '================================================',
    '  CLIMORA — ILLUSTRATIVE CLIMATE RISK REPORT',
    '================================================',
    '',
    `Business Name  : ${b.name}`,
    `Sector         : ${b.sector.replace('_', ' ')}`,
    `Location       : ${b.location}`,
    `Employees      : ${b.employeeCount}`,
    `Annual Revenue : $${b.revenue?.toLocaleString()}`,
    '',
    '-- ILLUSTRATIVE RISK SCORE ----------------------',
    `Overall Score  : ${b.assessment.overallScore} / 100`,
    `Category       : ${getCategory(b.assessment.overallScore)}`,
    `Last Assessed  : ${b.assessment.lastAssessed}`,
    '',
    '-- DIMENSION BREAKDOWN --------------------------',
    `Flood Exposure         : ${dims.flood}  (weight 30%)`,
    `Heavy Rainfall         : ${dims.rainfall}  (weight 25%)`,
    `Extreme Heat           : ${dims.heat}  (weight 20%)`,
    `Business Vulnerability : ${dims.business}  (weight 15%)`,
    `Financial Resilience   : ${dims.financial}  (weight 10%)`,
    '',
    '-- DATA NOTE ------------------------------------',
    b.assessment.dataNote,
    '',
    '-- DISCLAIMER -----------------------------------',
    'This score is an illustrative prototype heuristic,',
    'not a validated credit rating or probability of',
    'default. It must not be used as the sole basis',
    'for any lending decision.',
    '================================================',
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
  ].join('\n');
}

function generateCSV(businesses) {
  const header = 'Business,Sector,Location,Employees,Revenue,Overall Score,Category,Flood,Rainfall,Heat,Business,Financial,Last Assessed';
  const rows = businesses.map(b => {
    const d = b.assessment.dimensions;
    return [
      `"${b.name}"`, b.sector, `"${b.location}"`, b.employeeCount, b.revenue,
      b.assessment.overallScore, getCategory(b.assessment.overallScore),
      d.flood, d.rainfall, d.heat, d.business, d.financial,
      b.assessment.lastAssessed,
    ].join(',');
  });
  return [header, ...rows].join('\n');
}

export default function ReportsPage() {
  const [selectedId, setSelectedId] = useState(demoBusinesses[0].id);
  const [preview, setPreview]       = useState('');
  const [previewType, setPreviewType] = useState(null);

  const selected = demoBusinesses.find(b => b.id === selectedId);

  const handleTextPreview = () => {
    setPreview(generateTextReport(selected));
    setPreviewType('text');
  };

  const handleCSVPreview = () => {
    setPreview(generateCSV(demoBusinesses));
    setPreviewType('csv');
  };

  const handleDownload = (content, filename, mime) => {
    const blob = new Blob([content], { type: mime });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* ── Single assessment report ── */}
      <div className="card mb-3">
        <div className="card-header">
          <h3>Assessment Report — Single Business</h3>
          <span className="badge badge-demo">Text / CSV</span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <select
            className="select"
            style={{ flex: '1 1 200px', maxWidth: 300 }}
            value={selectedId}
            onChange={e => { setSelectedId(e.target.value); setPreview(''); setPreviewType(null); }}
          >
            {demoBusinesses.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={handleTextPreview}>
            &#9654; Preview Report
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleDownload(generateTextReport(selected), `${selected.name.replace(/\s+/g, '_')}_report.txt`, 'text/plain')}
          >
            &#8595; Download .txt
          </button>
        </div>

        {previewType === 'text' && preview && (
          <pre style={{
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
          }}>
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
          Export all {demoBusinesses.length} demo businesses with their risk scores and dimension breakdowns as a CSV file.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleCSVPreview}>
            &#9654; Preview CSV
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleDownload(generateCSV(demoBusinesses), 'climora_portfolio.csv', 'text/csv')}
          >
            &#8595; Download CSV
          </button>
        </div>

        {previewType === 'csv' && preview && (
          <pre style={{
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
          }}>
            {preview}
          </pre>
        )}
      </div>

      {/* ── Placeholder templates ── */}
      <div className="card">
        <div className="card-header">
          <h3>Report Templates</h3>
          <span className="badge badge-muted">Coming soon</span>
        </div>
        <div className="grid-3" style={{ gap: '0.75rem' }}>
          {['Lender Review Summary', 'Loan Readiness Pack', 'Improvement Progress Report'].map(t => (
            <div key={t} style={{ padding: '1rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', opacity: 0.5 }}>&#9671;</div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>{t}</div>
              <button className="btn btn-secondary btn-xs" disabled>Coming soon</button>
            </div>
          ))}
        </div>
      </div>

      <div className="disclaimer" style={{ marginTop: '1.25rem' }}>
        <span className="disclaimer-icon">&#9888;</span>
        All exported reports contain simulated demo data and illustrative risk scores. They are not validated financial assessments and must not be presented as official credit reports.
      </div>
    </div>
  );
}
