import React from 'react';
import { Card, Badge, Button } from './ui.jsx';

export default function SettingsPage() {
  return (
    <div>
      <Card style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>Application Settings</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
          Configure application behavior and preferences.
        </p>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>
            Data Source Mode
          </label>
          <select className="input" style={{ width: '200px' }}>
            <option>Simulated Demo Data (current)</option>
            <option>Live Open-Meteo (future)</option>
          </select>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            Currently using simulated demo data. Live API integration is not yet implemented.
          </p>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>
            Risk Category Thresholds
          </label>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
            Low (0-24), Moderate (25-49), High (50-74), Very High (75-100)  -  provisional hackathon thresholds.
          </p>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 500 }}>
            Demo Mode
          </label>
          <Badge variant="demo">Demo  -  simulated data only</Badge>
        </div>

        <Button variant="secondary" disabled>
          Save Settings  -  (Not persisted yet)
        </Button>
      </Card>

      <Card>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>About Climora</h3>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Climora is a climate-intelligence prototype for MSME lending.
          Version 0.1.0 (hackathon demo). Built with Electron, React, and Node.js.
        </p>
        <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
          This is a hackathon prototype. Risk scores are illustrative heuristics, not validated
          credit ratings or probabilities of default.
        </p>
      </Card>
    </div>
  );
}
