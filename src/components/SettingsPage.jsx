import React from 'react';
import { useData } from '../services/DataProvider.jsx';
import { API_BASE_URL } from '../services/apiClient.js';
import { formatDate } from '../services/mappers.js';
import { EmptyState } from './ui.jsx';

const DIMENSION_LABELS = {
  flood: 'Flood Exposure',
  rainfall: 'Heavy Rainfall',
  heat: 'Extreme Heat',
  business: 'Business Vulnerability',
  financial: 'Financial Resilience',
};

export default function SettingsPage() {
  const { config, health, dashboard, refresh, checkHealth } = useData();

  const categories = config?.risk?.categories || [];
  const weights = config?.risk?.weights || {};
  const sectors = config?.sectors || {};
  const industries = config?.business?.industries || null;

  return (
    <div>
      {/* Backend connection */}
      <div className="card mb-3">
        <h3 style={{ marginBottom: '1rem' }}>Backend Connection</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          {[
            { label: 'API base URL', value: API_BASE_URL },
            { label: 'Status', value: health.online ? 'Connected' : 'Unreachable' },
            { label: 'Last checked', value: health.lastChecked ? formatDate(health.lastChecked, { time: true }) : '—' },
            { label: 'Environment', value: health.online ? (dashboard ? 'Online' : '—') : '—' },
          ].map((row, index) => (
            <div
              key={row.label}
              style={{
                display: 'flex',
                gap: '1rem',
                padding: '0.5rem 0',
                borderBottom: index < 3 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              <span style={{ width: 120, fontSize: '0.78rem', color: 'var(--color-text-tertiary)', flexShrink: 0 }}>{row.label}</span>
              <span
                style={{
                  fontSize: '0.82rem',
                  color: row.label === 'Status' ? (health.online ? 'var(--color-success)' : 'var(--color-danger)') : 'var(--color-text-secondary)',
                  fontWeight: row.label === 'Status' ? 700 : 400,
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary btn-sm" onClick={checkHealth}>
            Re-check connection
          </button>
          <button className="btn btn-secondary btn-sm" onClick={refresh}>
            Reload application data
          </button>
        </div>
        {!health.online && (
          <p style={{ fontSize: '0.8rem', color: 'var(--color-warning)', marginTop: '0.75rem' }}>
            The backend at this URL is not responding. Start it with <code>npm start</code> inside the{' '}
            <code>backend/</code> folder.
          </p>
        )}
      </div>

      {/* Data source */}
      <div className="card mb-3">
        <h3 style={{ marginBottom: '1rem' }}>Data Source</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
          {[
            {
              value: 'live',
              label: 'Live Open-Meteo API (via backend)',
              sub: 'Climate dimensions are fetched by the backend from open-meteo.com. Requires network access; missing dimensions are reported, never zero.',
              active: health.online,
            },
            {
              value: 'demo',
              label: 'Labelled demo fallback',
              sub: 'Demo values are only ever produced when a request explicitly passes forceDemo: true. Demo records are labelled as such in the UI.',
              active: false,
            },
          ].map((option) => (
            <div
              key={option.value}
              style={{
                display: 'flex',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                background: option.active ? 'var(--color-primary-dim)' : 'var(--color-bg-tertiary)',
                border: `1px solid ${option.active ? 'rgba(13,148,136,0.4)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-md)',
              }}
            >
              <input
                type="radio"
                name="dataSource"
                value={option.value}
                checked={option.active}
                readOnly
                style={{ marginTop: '2px', accentColor: 'var(--color-primary)', flexShrink: 0 }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.15rem' }}>
                  {option.label}
                  {option.value === 'live' ? (health.online ? ' · active' : ' · unreachable') : ''}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{option.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-tertiary)' }}>
          The data source is controlled by the backend configuration (<code>OPEN_METEO_*</code> variables) and cannot be
          switched from the UI.
        </p>
      </div>

      {/* Risk thresholds */}
      <div className="card mb-3">
        <h3 style={{ marginBottom: '0.5rem' }}>Risk Category Thresholds</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
          Loaded from <code>/api/config</code>. Provisional thresholds that must be calibrated before any real-world use.
        </p>
        {categories.length === 0 ? (
          <EmptyState title="Configuration unavailable" message="The backend config endpoint did not return categories." />
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {categories.map((category) => (
              <div
                key={category.key}
                style={{
                  flex: 1,
                  minWidth: 100,
                  padding: '0.75rem',
                  background: 'var(--color-bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `3px solid var(--color-${category.key === 'veryHigh' ? 'very-high' : category.key})`,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontWeight: 700, color: `var(--color-${category.key === 'veryHigh' ? 'very-high' : category.key})`, marginBottom: '0.25rem' }}>
                  {category.label}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                  {category.min} – {category.max}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Model weights */}
      <div className="card mb-3">
        <h3 style={{ marginBottom: '0.5rem' }}>Model Weights</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
          Weights used by the backend scoring engine. Illustrative assumptions, not validated parameters.
        </p>
        {Object.keys(weights).length === 0 ? (
          <EmptyState title="Configuration unavailable" message="Weights could not be loaded from the backend." />
        ) : (
          Object.entries(weights).map(([key, weight]) => (
            <div key={key} style={{ marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{DIMENSION_LABELS[key] || key}</span>
                <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>{Math.round(weight * 100)}%</span>
              </div>
              <div className="progress-track" style={{ height: 6 }}>
                <div className="progress-fill" style={{ width: `${Math.round(weight * 100)}%`, background: 'var(--color-primary)' }} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Industry configuration */}
      {(Object.keys(sectors).length > 0 || industries) && (
        <div className="card mb-3">
          <h3 style={{ marginBottom: '0.75rem' }}>Industry Configuration</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(industries || Object.keys(sectors)).map((industry) => (
              <span key={industry} className="badge badge-muted">
                {sectors[industry]?.label || industry}
                {sectors[industry]?.baseVulnerability !== undefined && ` · base ${sectors[industry].baseVulnerability}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* About */}
      <div className="card">
        <h3 style={{ marginBottom: '0.75rem' }}>About Climora</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { label: 'Version', value: '0.1.0 (Hackathon prototype)' },
            { label: 'Stack', value: 'Electron + React + Vite · Express 5 + SQLite backend' },
            { label: 'Data', value: 'Open-Meteo (CC BY 4.0) via the backend; labelled demo records for development' },
            { label: 'License', value: 'MIT' },
          ].map((row, index) => (
            <div
              key={row.label}
              style={{
                display: 'flex',
                gap: '1rem',
                padding: '0.5rem 0',
                borderBottom: index < 3 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              <span style={{ width: 80, fontSize: '0.78rem', color: 'var(--color-text-tertiary)', flexShrink: 0 }}>{row.label}</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{row.value}</span>
            </div>
          ))}
        </div>
        <div className="disclaimer" style={{ marginTop: '1rem' }}>
          <span className="disclaimer-icon">&#9888;</span>
          Risk scores are illustrative heuristics, not validated credit ratings or probabilities of default. This
          prototype must not be used for real lending decisions.
        </div>
      </div>
    </div>
  );
}
