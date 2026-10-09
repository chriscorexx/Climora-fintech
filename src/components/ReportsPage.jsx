import React from 'react';
import { Card, Badge } from './ui.jsx';

export default function ReportsPage() {
  return (
    <div>
      <Card style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>Export Assessment Report</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
          Generate a PDF or CSV summary of a business's climate-risk assessment, including the
          overall score, dimension breakdown, contributing factors, recommendations, and limitations.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" disabled>
            Export PDF (Not yet implemented)
          </button>
          <button className="btn btn-secondary" disabled>
            Export CSV (Not yet implemented)
          </button>
        </div>
      </Card>

      <Card>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>Report Templates</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
          Pre-defined report templates for lender review meetings and MSME owner discussions.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" disabled>
            Assessment Summary (Not yet implemented)
          </button>
          <button className="btn btn-secondary" disabled>
            Loan Readiness (Not yet implemented)
          </button>
          <button className="btn btn-secondary" disabled>
            Improvement Progress (Not yet implemented)
          </button>
        </div>
        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
          <Badge variant="demo">Placeholder pages - report generation will be implemented after core assessment workflow</Badge>
        </div>
      </Card>
    </div>
  );
}
