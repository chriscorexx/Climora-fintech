import React, { useState } from 'react';
import { useData, useCurrentBusiness } from '../services/DataProvider.jsx';
import { api } from '../services/apiClient.js';
import { formatIndustry, formatMoney, formatNumber, formatSize, formatStage } from '../services/mappers.js';
import { Button, Card, EmptyState, ErrorState } from './ui.jsx';

const EMPTY_FORM = {
  name: '',
  industry: 'retail',
  location: '',
  state: '',
  latitude: '',
  longitude: '',
  businessSize: 'micro',
  businessStage: 'startup',
  annualTurnover: '',
  annualExpenses: '',
  monthlyOperatingCost: '',
  employeeCount: '',
  fundingRequired: '',
  hasBackupSupplier: false,
  hasEmergencyReserve: false,
  operationalDetails: '',
};

function toForm(business) {
  return {
    name: business?.name || '',
    industry: business?.industry || 'retail',
    location: business?.location || '',
    state: business?.state || '',
    latitude: business?.coordinates?.lat ?? '',
    longitude: business?.coordinates?.lng ?? '',
    businessSize: business?.businessSize || 'micro',
    businessStage: business?.businessStage || 'startup',
    annualTurnover: business?.annualTurnover ?? '',
    annualExpenses: business?.annualExpenses ?? '',
    monthlyOperatingCost: business?.monthlyOperatingCost ?? '',
    employeeCount: business?.employeeCount ?? '',
    fundingRequired: business?.fundingRequired ?? '',
    hasBackupSupplier: Boolean(business?.hasBackupSupplier),
    hasEmergencyReserve: Boolean(business?.hasEmergencyReserve),
    operationalDetails: business?.operationalDetails || '',
  };
}

function toPayload(form) {
  const number = (value) => (value === '' || value === null || value === undefined ? null : Number(value));
  const text = (value) => (value === '' || value === null || value === undefined ? null : value);
  return {
    name: form.name.trim(),
    industry: form.industry,
    location: form.location.trim(),
    state: text(form.state)?.trim() || null,
    latitude: number(form.latitude),
    longitude: number(form.longitude),
    businessSize: form.businessSize,
    businessStage: form.businessStage,
    annualTurnover: number(form.annualTurnover),
    annualExpenses: number(form.annualExpenses),
    monthlyOperatingCost: number(form.monthlyOperatingCost),
    employeeCount: number(form.employeeCount),
    fundingRequired: number(form.fundingRequired),
    hasBackupSupplier: form.hasBackupSupplier,
    hasEmergencyReserve: form.hasEmergencyReserve,
    operationalDetails: text(form.operationalDetails)?.trim() || null,
  };
}

const INDIAN_INDUSTRIES = ['retail', 'manufacturing', 'agriculture', 'food_processing', 'hospitality', 'construction', 'services', 'logistics', 'other'];

export default function MyBusinessPage() {
  const { sectors, industries, refresh, refreshBusinesses, selectBusiness } = useData();
  const { business } = useCurrentBusiness();
  const [mode, setMode] = useState('view'); // 'view' | 'create' | 'edit'
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const industryList = industries || INDIAN_INDUSTRIES.map((key) => ({ value: key, label: sectors?.[key]?.label || key })).map((item) => item.value);
  const industryOptions = Array.isArray(industryList) ? industryList : Object.keys(industryList);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setMode('create');
  };

  const openEdit = () => {
    setForm(toForm(business));
    setFormError(null);
    setMode('edit');
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.location.trim()) {
      setFormError({ message: 'Business name and location are required.' });
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = toPayload(form);
      if (mode === 'create') {
        const payloadResponse = await api.createBusiness(payload);
        await refresh();
        selectBusiness(payloadResponse?.business?.id || null);
      } else {
        await api.updateBusiness(business.id, payload);
        await Promise.all([refresh(), refreshBusinesses()]);
      }
      setMode('view');
    } catch (error) {
      setFormError(error);
    } finally {
      setSaving(false);
    }
  };

  // ── Create / edit form ──
  if (mode !== 'view') {
    return (
      <form onSubmit={submit} noValidate>
        <Card className="mb-3">
          <div className="card-header">
            <h3>{mode === 'create' ? 'Create Business Profile' : 'Edit Business Profile'}</h3>
            <span className="badge badge-muted">Saved to backend SQLite</span>
          </div>

          {formError && <ErrorState error={formError} onRetry={() => setFormError(null)} />}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
            <Field label="Business name" required>
              <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={160} />
            </Field>
            <Field label="Industry">
              <select className="select" value={form.industry} onChange={(event) => setForm({ ...form, industry: event.target.value })}>
                {industryOptions.map((option) => (
                  <option key={option} value={option}>
                    {sectors?.[option]?.label || option.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Location" required hint="City, district — used for geocoding">
              <input className="input" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} required maxLength={160} />
            </Field>
            <Field label="State / region">
              <input className="input" value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} maxLength={80} />
            </Field>
            <Field label="Latitude" hint="Optional; resolved via geocoding if blank">
              <input className="input" type="number" step="any" value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} />
            </Field>
            <Field label="Longitude">
              <input className="input" type="number" step="any" value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} />
            </Field>
            <Field label="Business size">
              <select className="select" value={form.businessSize} onChange={(event) => setForm({ ...form, businessSize: event.target.value })}>
                {['micro', 'small', 'medium'].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Business stage">
              <select className="select" value={form.businessStage} onChange={(event) => setForm({ ...form, businessStage: event.target.value })}>
                {['startup', 'growth', 'established'].map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Annual turnover (INR)">
              <input className="input" type="number" min="0" value={form.annualTurnover} onChange={(event) => setForm({ ...form, annualTurnover: event.target.value })} />
            </Field>
            <Field label="Annual expenses (INR)">
              <input className="input" type="number" min="0" value={form.annualExpenses} onChange={(event) => setForm({ ...form, annualExpenses: event.target.value })} />
            </Field>
            <Field label="Monthly operating cost (INR)">
              <input className="input" type="number" min="0" value={form.monthlyOperatingCost} onChange={(event) => setForm({ ...form, monthlyOperatingCost: event.target.value })} />
            </Field>
            <Field label="Employees">
              <input className="input" type="number" min="0" value={form.employeeCount} onChange={(event) => setForm({ ...form, employeeCount: event.target.value })} />
            </Field>
            <Field label="Funding required (INR)">
              <input className="input" type="number" min="0" value={form.fundingRequired} onChange={(event) => setForm({ ...form, fundingRequired: event.target.value })} />
            </Field>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
              <input type="checkbox" checked={form.hasBackupSupplier} onChange={(event) => setForm({ ...form, hasBackupSupplier: event.target.checked })} />
              Has a backup supplier
            </label>
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
              <input type="checkbox" checked={form.hasEmergencyReserve} onChange={(event) => setForm({ ...form, hasEmergencyReserve: event.target.checked })} />
              Maintains an emergency reserve
            </label>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <Field label="Operational details" hint="Optional context for reviewers">
              <textarea
                className="input"
                rows={3}
                value={form.operationalDetails}
                onChange={(event) => setForm({ ...form, operationalDetails: event.target.value })}
              />
            </Field>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving…' : mode === 'create' ? 'Create profile' : 'Save changes'}
            </Button>
            <Button type="button" onClick={() => setMode('view')} disabled={saving}>
              Cancel
            </Button>
          </div>
        </Card>
      </form>
    );
  }

  // ── No businesses yet ──
  if (!business) {
    return (
      <Card>
        <EmptyState
          title="No business profile"
          message="Create your business profile to record financial details and enable climate assessments."
          action={
            <Button variant="primary" onClick={openCreate}>
              Create business profile
            </Button>
          }
        />
      </Card>
    );
  }

  const ratio = (business.annualTurnover && business.annualExpenses) || null;
  const profitMargin = ratio ? (((business.annualTurnover - business.annualExpenses) / business.annualTurnover) * 100).toFixed(1) : null;
  const reserveMonths = business.hasEmergencyReserve && business.monthlyOperatingCost ? 3 : null;

  return (
    <div>
      {/* Header card */}
      <Card className="mb-3">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: '0 0 0.3rem' }}>{business.name}</h2>
            <div style={{ fontSize: '0.83rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem' }}>
              {formatIndustry(business.industry, sectors)} &middot; {business.location}
              {business.state ? `, ${business.state}` : ''}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-primary">&#9906; {formatSize(business.businessSize)}</span>
              <span className="badge badge-muted">{formatStage(business.businessStage)}</span>
              <span className="badge badge-muted">{formatNumber(business.employeeCount)} employees</span>
              {business.isDemo && <span className="badge badge-simulated">Demo record</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={openEdit}>
              &#9998; Edit Profile
            </Button>
            <Button variant="secondary" onClick={openCreate}>
              + New Business
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid-2" style={{ gap: '1rem' }}>
        {/* Profile details */}
        <Card>
          <h3 style={{ marginBottom: '1rem' }}>Business Profile</h3>
          {[
            { label: 'Business Name', value: business.name },
            { label: 'Industry', value: formatIndustry(business.industry, sectors) },
            { label: 'Location', value: business.location },
            {
              label: 'Coordinates',
              value:
                business.coordinates?.lat != null && business.coordinates?.lng != null
                  ? `${business.coordinates.lat.toFixed(4)}, ${business.coordinates.lng.toFixed(4)}`
                  : 'Not recorded — will be geocoded from location',
            },
            { label: 'Size', value: formatSize(business.businessSize) },
            { label: 'Stage', value: formatStage(business.businessStage) },
            { label: 'Created', value: business.createdAt ? new Date(business.createdAt).toLocaleDateString('en-IN') : '—' },
          ].map((field) => (
            <div key={field.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.6rem 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-tertiary)', flexShrink: 0 }}>{field.label}</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, textAlign: 'right' }}>{field.value}</span>
            </div>
          ))}
        </Card>

        {/* Financial indicators */}
        <Card>
          <h3 style={{ marginBottom: '1rem' }}>Financial Indicators</h3>
          {[
            { label: 'Annual Turnover', value: formatMoney(business.annualTurnover), color: 'var(--color-success)' },
            { label: 'Annual Expenses', value: formatMoney(business.annualExpenses), color: 'var(--color-text)' },
            { label: 'Monthly Operating Cost', value: formatMoney(business.monthlyOperatingCost), color: 'var(--color-text)' },
            { label: 'Funding Required', value: formatMoney(business.fundingRequired), color: 'var(--color-warning)' },
            { label: 'Backup Supplier', value: business.hasBackupSupplier ? 'Yes' : 'Not recorded', color: 'var(--color-info)' },
            { label: 'Emergency Reserve', value: business.hasEmergencyReserve ? 'Yes' : 'Not recorded', color: 'var(--color-info)' },
          ].map((field) => (
            <div key={field.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.6rem 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-tertiary)', flexShrink: 0 }}>{field.label}</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: field.color }}>{field.value}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Derived ratios */}
      <div className="grid-3 mt-2" style={{ gap: '1rem' }}>
        {[
          {
            label: 'Profit Margin',
            value: profitMargin ? `${profitMargin}%` : '—',
            sub: 'Turnover minus expenses',
            color: profitMargin === null ? 'var(--color-text-tertiary)' : parseFloat(profitMargin) > 15 ? 'var(--color-success)' : 'var(--color-warning)',
          },
          {
            label: 'Expense Ratio',
            value: ratio ? `${((business.annualExpenses / business.annualTurnover) * 100).toFixed(1)}%` : '—',
            sub: 'Expenses as share of turnover',
            color: ratio ? (business.annualExpenses / business.annualTurnover > 0.8 ? 'var(--color-danger)' : 'var(--color-warning)') : 'var(--color-text-tertiary)',
          },
          {
            label: 'Reserve Coverage',
            value: reserveMonths ? `${reserveMonths} mo` : 'Not recorded',
            sub: 'Months of expenses covered',
            color: reserveMonths ? 'var(--color-success)' : 'var(--color-text-tertiary)',
          },
        ].map((card, index) => (
          <div key={index} className="stat-card" style={{ '--accent-start': card.color, '--accent-end': card.color }}>
            <div className="stat-label">{card.label}</div>
            <div className="stat-value" style={{ color: card.color, fontSize: '1.6rem' }}>{card.value}</div>
            <div className="stat-sub">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="disclaimer" style={{ marginTop: '1.25rem' }}>
        <span className="disclaimer-icon">&#9888;</span>
        Financial indicators are derived from the values you record. They are not audited figures or official financial
        statements, and Climora does not verify them.
      </div>
    </div>
  );
}

function Field({ label, hint, required, children }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginBottom: '0.3rem' }}>
        {label}
        {required ? ' *' : ''}
        {hint ? ` — ${hint}` : ''}
      </span>
      {children}
    </label>
  );
}
