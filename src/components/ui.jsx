import React from 'react';

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    low: 'badge-low',
    moderate: 'badge-moderate',
    high: 'badge-high',
    veryHigh: 'badge-very-high',
    demo: 'badge-demo',
    simulated: 'badge-simulated',
    default: 'bg-tertiary text-tertiary',
  };
  const classes = `${variants[variant] || variants.default} badge ${className}`.trim();
  return <span className={classes}>{children}</span>;
}

export function Button({ children, variant = 'secondary', size = 'md', onClick, disabled, className = '' }) {
  const sizeClass = size === 'sm' ? 'btn-sm' : '';
  const variantClass = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
  return (
    <button
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function Input({ placeholder, value, onChange, className = '', type = 'text' }) {
  return (
    <input
      type={type}
      className={`input ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
}

export function Card({ children, className = '', hover = false }) {
  return (
    <div className={`card ${hover ? 'card-hover' : ''} ${className}`}>
      {children}
    </div>
  );
}

/** Skeleton placeholder that preserves layout while data loads. */
export function Skeleton({ width = '100%', height = 16, radius = 'var(--radius-sm)' }) {
  return <div className="skeleton" style={{ width, height, borderRadius: radius }} aria-hidden="true" />;
}

export function LoadingState({ label = 'Loading…', rows = 3 }) {
  return (
    <div className="state-block" aria-busy="true" aria-live="polite">
      <p className="state-label">{label}</p>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} height={index === 0 ? 22 : 14} />
        ))}
      </div>
      <span className="sr-only">Loading, please wait.</span>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const message = typeof error === 'string' ? error : error?.message || 'Something went wrong.';
  const offline = typeof error !== 'string' && error?.isNetworkError;
  return (
    <div className="state-block state-error" role="alert">
      <h3 className="state-title">{offline ? 'Backend unreachable' : 'Could not load this section'}</h3>
      <p className="state-label">{message}</p>
      {offline && (
        <p className="state-label">
          Start the API with <code>npm start</code> in the <code>backend/</code> folder, then retry.
        </p>
      )}
      {onRetry && (
        <Button variant="primary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="state-block">
      <h3 className="state-title">{title || 'Nothing here yet'}</h3>
      <p className="state-label">{message || 'There is no data to display for this view.'}</p>
      {action}
    </div>
  );
}
