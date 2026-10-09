import React, { useState } from 'react';

export default function SettingsPage() {
  const [dataSource, setDataSource] = useState('simulated');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const thresholds = [
    { label: 'Low',       range: '0 – 24',   color: 'var(--color-low)'       },
    { label: 'Moderate',  range: '25 – 49',  color: 'var(--color-moderate)'  },
    { label: 'High',      range: '50 – 74',  color: 'var(--color-high)'      },
    { label: 'Very High', range: '75 – 100', color: 'var(--color-very-high)' },
  ];

  const weights = [
    { label: 'Flood Exposure',        w: 30, icon: '&#9650;' },
    { label: 'Heavy Rainfall',        w: 25, icon: '&#9652;' },
    { label: 'Extreme Heat',          w: 20, icon: '&#9728;'   },
    { label: 'Business Vulnerability',w: 15, icon: '&#9632;' },
    { label: 'Financial Resilience',  w: 10, icon: '&#9733;'   },
  ];

  return (
    <div>
      {/* Data source */}
      <div className="card mb-3">
        <h3 style={{ marginBottom: '1rem' }}>Data Source</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
          {[
            { value: 'simulated', label: 'Simulated Demo Data', sub: 'Fictional values for hackathon demonstration. Currently active.' },
            { value: 'live',      label: 'Live Open-Meteo API', sub: 'Real weather indicators from open-meteo.com. Requires network access. Not yet implemented.' },
          ].map(opt => (
            <label
              key={opt.value}
              style={{
                display: 'flex', gap: '0.75rem', padding: '0.85rem 1rem',
                background: dataSource === opt.value ? 'var(--color-primary-dim)' : 'var(--color-bg-tertiary)',
                border: `1px solid ${dataSource === opt.value ? 'rgba(13,148,136,0.4)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'var(--transition-fast)',
              }}
              onClick={() => setDataSource(opt.value)}
            >
              <input type="radio" name="dataSource" value={opt.value} checked={dataSource === opt.value} readOnly
                style={{ marginTop: '2px', accentColor: 'var(--color-primary)', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.15rem' }}>{opt.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{opt.sub}</div>
              </div>
            </label>
          ))}
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleSave}>
          {saved ? '&#10003; Saved' : 'Save Settings'}
        </button>
      </div>

      {/* Risk thresholds */}
      <div className="card mb-3">
        <h3 style={{ marginBottom: '0.5rem' }}>Risk Category Thresholds</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
          Provisional hackathon thresholds. Must be calibrated before any real-world use.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {thresholds.map(t => (
            <div key={t.label} style={{ flex: 1, minWidth: 100, padding: '0.75rem', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${t.color}`, textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: t.color, marginBottom: '0.25rem' }}>{t.label}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>{t.range}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Model weights */}
      <div className="card mb-3">
        <h3 style={{ marginBottom: '0.5rem' }}>Model Weights</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
          Weights used in the illustrative risk scoring model. Must be validated before real-world lending use.
        </p>
        {weights.map(w => (
          <div key={w.label} style={{ marginBottom: '0.65rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '0.4rem' }}>
                <span dangerouslySetInnerHTML={{ __html: w.icon }} /> {w.label}
              </span>
              <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>{w.w}%</span>
            </div>
            <div className="progress-track" style={{ height: 6 }}>
              <div className="progress-fill" style={{ width: `${w.w}%`, background: 'var(--color-primary)' }} />
            </div>
          </div>
        ))}
      </div>

      {/* About */}
      <div className="card">
        <h3 style={{ marginBottom: '0.75rem' }}>About Climora</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { label: 'Version',     value: '0.1.0 (Hackathon Demo)' },
            { label: 'Stack',       value: 'Electron + React + Vite + Node.js' },
            { label: 'Data',        value: 'Simulated demo data — Open-Meteo integration planned' },
            { label: 'License',     value: 'MIT' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.5rem 0', borderBottom: i < 3 ? '1px solid var(--color-border)' : 'none' }}>
              <span style={{ width: 80, fontSize: '0.78rem', color: 'var(--color-text-tertiary)', flexShrink: 0 }}>{r.label}</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{r.value}</span>
            </div>
          ))}
        </div>
        <div className="disclaimer" style={{ marginTop: '1rem' }}>
          <span className="disclaimer-icon">&#9888;</span>
          Risk scores are illustrative heuristics, not validated credit ratings or probabilities of default. This prototype must not be used for real lending decisions.
        </div>
      </div>
    </div>
  );
}
