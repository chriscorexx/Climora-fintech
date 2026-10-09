import React, { useState, useEffect } from 'react';
import { ownerBusiness, businessSectors } from '../data/demoData.js';

const ipc = window.climora;

const SECTOR_OPTIONS = [
  { value: 'retail',         label: 'Retail'                },
  { value: 'manufacturing',  label: 'Manufacturing'         },
  { value: 'agriculture',    label: 'Agriculture'           },
  { value: 'food_processing',label: 'Food Processing'       },
  { value: 'hospitality',    label: 'Hospitality'           },
  { value: 'construction',   label: 'Construction'          },
  { value: 'services',       label: 'Professional Services' },
  { value: 'logistics',      label: 'Logistics/Warehousing' },
];

const EMPTY_FORM = {
  name: '', sector: 'retail', location: '',
  employeeCount: '', revenue: '', expenses: '',
  debtObligations: '', emergencyReserve: '',
};

function toNum(v) {
  const n = parseFloat(String(v).replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

function fmt(n) {
  if (n == null || n === '') return '';
  return Number(n).toLocaleString();
}

export default function MyBusinessPage() {
  const [editing, setEditing]   = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saved, setSaved]       = useState(null);   // persisted business from DB
  const [errors, setErrors]     = useState([]);
  const [saving, setSaving]     = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geoResult, setGeoResult] = useState(null);

  // Load existing business from DB (owner view uses first business for demo)
  useEffect(() => {
    if (!ipc) return;
    ipc.listBusinesses().then(res => {
      if (res.ok && res.data.length > 0) {
        const b = res.data[0];
        setSaved(b);
        setForm({
          name:             b.name             ?? '',
          sector:           b.sector           ?? 'retail',
          location:         b.location         ?? '',
          employeeCount:    b.employee_count   ?? '',
          revenue:          b.revenue          ?? '',
          expenses:         b.expenses         ?? '',
          debtObligations:  b.debt_obligations ?? '',
          emergencyReserve: b.emergency_reserve ?? '',
        });
      }
    });
  }, []);

  const business = saved || ownerBusiness;

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors([]);
  };

  const handleGeocode = async () => {
    if (!ipc || !form.location.trim()) return;
    setGeocoding(true);
    const res = await ipc.geocodeLocation(form.location);
    setGeocoding(false);
    if (res.ok) {
      setGeoResult(res.data);
    } else {
      setErrors([`Geocoding failed: ${res.errors[0]}`]);
    }
  };

  const handleSave = async () => {
    if (!ipc) {
      setErrors(['IPC bridge not available — running in browser mode.']);
      return;
    }
    setErrors([]);
    setSaving(true);

    const payload = {
      ...(saved?.id ? { id: saved.id } : {}),
      name:             form.name.trim(),
      sector:           form.sector,
      location:         form.location.trim(),
      latitude:         geoResult?.lat ?? saved?.latitude ?? null,
      longitude:        geoResult?.lng ?? saved?.longitude ?? null,
      employeeCount:    toNum(form.employeeCount),
      revenue:          toNum(form.revenue),
      expenses:         toNum(form.expenses),
      debtObligations:  toNum(form.debtObligations),
      emergencyReserve: toNum(form.emergencyReserve),
    };

    const res = await ipc.saveBusiness(payload);
    setSaving(false);

    if (res.ok) {
      setSaved(res.data);
      setEditing(false);
      setGeoResult(null);
    } else {
      setErrors(res.errors ?? ['Save failed']);
    }
  };

  const profitMargin = () => {
    const r = toNum(form.revenue), e = toNum(form.expenses);
    if (!r || !e) return null;
    return (((r - e) / r) * 100).toFixed(1);
  };

  const debtToRevenue = () => {
    const r = toNum(form.revenue), d = toNum(form.debtObligations);
    if (!r || d == null) return null;
    return ((d / r) * 100).toFixed(1);
  };

  const reserveMonths = () => {
    const e = toNum(form.expenses), res = toNum(form.emergencyReserve);
    if (!e || res == null) return null;
    return (res / (e / 12)).toFixed(1);
  };

  const Field = ({ label, field, type = 'text', placeholder = '' }) => (
    <div style={{ marginBottom: '0.85rem' }}>
      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
        {label}
      </label>
      {editing ? (
        <input
          type={type}
          className="input"
          placeholder={placeholder}
          value={form[field]}
          onChange={e => handleChange(field, e.target.value)}
        />
      ) : (
        <div style={{ fontSize: '0.88rem', fontWeight: 600, padding: '0.4rem 0', color: 'var(--color-text)' }}>
          {form[field] || <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>}
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="card mb-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: '0 0 0.3rem' }}>{form.name || 'My Business'}</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-primary">
              {SECTOR_OPTIONS.find(s => s.value === form.sector)?.label || form.sector}
            </span>
            {form.location && <span className="badge badge-muted">{form.location}</span>}
            {saved?.id ? (
              <span className="badge badge-success">&#10003; Saved to database</span>
            ) : (
              <span className="badge badge-warning">Demo data — not yet saved</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {editing ? (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(false); setErrors([]); setGeoResult(null); }}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : '&#10003; Save Business'}
              </button>
            </>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
              &#9998; Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', background: 'var(--color-danger-dim)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)' }}>
          {errors.map((e, i) => (
            <div key={i} style={{ fontSize: '0.83rem', color: 'var(--color-danger)' }}>&#10007; {e}</div>
          ))}
        </div>
      )}

      <div className="grid-2" style={{ gap: '1rem', alignItems: 'start' }}>
        {/* Profile */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Business Profile</h3>

          <Field label="Business Name"   field="name"          placeholder="e.g. Green Valley Grocers" />

          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
              Sector
            </label>
            {editing ? (
              <select className="select" value={form.sector} onChange={e => handleChange('sector', e.target.value)}>
                {SECTOR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <div style={{ fontSize: '0.88rem', fontWeight: 600, padding: '0.4rem 0' }}>
                {SECTOR_OPTIONS.find(s => s.value === form.sector)?.label || form.sector}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
              Location
            </label>
            {editing ? (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="City, Country"
                  value={form.location}
                  onChange={e => handleChange('location', e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-secondary btn-sm" onClick={handleGeocode} disabled={geocoding || !form.location.trim()}>
                  {geocoding ? '...' : '&#9906; Geocode'}
                </button>
              </div>
            ) : (
              <div style={{ fontSize: '0.88rem', fontWeight: 600, padding: '0.4rem 0' }}>
                {form.location || <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>}
              </div>
            )}
            {geoResult && (
              <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--color-success)' }}>
                &#10003; {geoResult.name}, {geoResult.country} ({geoResult.lat.toFixed(4)}, {geoResult.lng.toFixed(4)})
              </div>
            )}
          </div>

          <Field label="Employee Count" field="employeeCount" type="number" placeholder="e.g. 25" />
        </div>

        {/* Financials */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Financial Indicators</h3>
          <Field label="Annual Revenue ($)"      field="revenue"          type="number" placeholder="e.g. 4800000" />
          <Field label="Annual Expenses ($)"     field="expenses"         type="number" placeholder="e.g. 3900000" />
          <Field label="Debt Obligations ($)"    field="debtObligations"  type="number" placeholder="e.g. 420000"  />
          <Field label="Emergency Reserve ($)"   field="emergencyReserve" type="number" placeholder="e.g. 180000"  />
        </div>
      </div>

      {/* Derived ratios */}
      <div className="grid-3 mt-2" style={{ gap: '1rem' }}>
        {[
          { label: 'Profit Margin',    value: profitMargin(),    unit: '%',  good: v => parseFloat(v) > 15, sub: 'Revenue minus expenses' },
          { label: 'Debt-to-Revenue',  value: debtToRevenue(),   unit: '%',  good: v => parseFloat(v) < 15, sub: 'Annual debt obligations' },
          { label: 'Reserve Coverage', value: reserveMonths(),   unit: ' mo',good: v => parseFloat(v) >= 3,  sub: 'Months of expenses covered' },
        ].map((s, i) => {
          const color = s.value == null
            ? 'var(--color-text-tertiary)'
            : s.good(s.value) ? 'var(--color-success)' : 'var(--color-warning)';
          return (
            <div key={i} className="stat-card" style={{ '--accent-start': color, '--accent-end': color }}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color, fontSize: '1.6rem' }}>
                {s.value != null ? `${s.value}${s.unit}` : '—'}
              </div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          );
        })}
      </div>

      {!ipc && (
        <div className="disclaimer" style={{ marginTop: '1.25rem' }}>
          <span className="disclaimer-icon">&#9888;</span>
          Running in browser mode — IPC bridge unavailable. Open in Electron to save data to SQLite.
        </div>
      )}
    </div>
  );
}
