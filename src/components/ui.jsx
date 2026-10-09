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
