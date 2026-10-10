import React from 'react';
import climoraLogo from '../../assets/Climora-logo.jpg';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const AuthShell: React.FC<AuthShellProps> = ({ title, subtitle, children, footer }) => {
  return (
    <div className="min-h-screen bg-fin-bg text-fin-text flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-fin-sunken border border-emerald-500/30 overflow-hidden shadow-sm">
            <img src={climoraLogo} alt="Climora Logo" className="w-full h-full object-cover" />
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="font-extrabold text-2xl tracking-tight text-fin-text">CLIMORA</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                IFC FIN-05
              </span>
            </div>
            <p className="text-xs text-fin-muted tracking-wide mt-1">
              Real-Time Climate Risk & Underwriting for MSMEs
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-fin-card border border-fin-border shadow-fin-card p-6 sm:p-8">
          <h1 className="text-lg font-bold text-fin-text tracking-tight">{title}</h1>
          <p className="text-xs text-fin-muted mt-1 mb-5">{subtitle}</p>
          {children}
        </div>

        {footer && <div className="mt-4 text-center">{footer}</div>}

        <p className="text-[10px] text-fin-muted text-center mt-6 leading-relaxed">
          Demo-grade authentication: accounts and sessions are stored locally in this browser only.
        </p>
      </div>
    </div>
  );
};

interface TextFieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string | null;
  autoComplete?: string;
  trailing?: React.ReactNode;
}

export const AuthTextField: React.FC<TextFieldProps> = ({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
  trailing,
}) => {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-fin-secondary mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={`w-full px-3 py-2 rounded-lg bg-fin-inset border text-fin-text placeholder-fin-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/60 ${
            error ? 'border-rose-500/60' : 'border-fin-border'
          } ${trailing ? 'pr-10' : ''}`}
        />
        {trailing && <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
      {error && (
        <p id={errorId} className="text-[11px] text-rose-700 dark:text-rose-300 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};

interface PasswordToggleProps {
  visible: boolean;
  onToggle: () => void;
  labelledBy: string;
}

export const PasswordToggle: React.FC<PasswordToggleProps> = ({
  visible,
  onToggle,
  labelledBy,
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? 'Hide password' : 'Show password'}
      aria-pressed={visible}
      className="p-1 rounded-md text-fin-muted hover:text-fin-text hover:bg-fin-hover transition-colors"
    >
      {visible ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-4 h-4"
          aria-labelledby={labelledBy}
        >
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
          <line x1="2" x2="22" y1="2" y2="22" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-4 h-4"
          aria-labelledby={labelledBy}
        >
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
};

interface AuthErrorBannerProps {
  message: string | null;
}

export const AuthErrorBanner: React.FC<AuthErrorBannerProps> = ({ message }) => {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 dark:bg-rose-500/15 px-3 py-2.5 text-xs text-rose-700 dark:text-rose-300"
    >
      {message}
    </div>
  );
};

interface SubmitButtonProps {
  label: string;
  loadingLabel: string;
  isLoading: boolean;
}

export const AuthSubmitButton: React.FC<SubmitButtonProps> = ({
  label,
  loadingLabel,
  isLoading,
}) => {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
    >
      {isLoading && (
        <svg
          className="animate-spin w-4 h-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      <span>{isLoading ? loadingLabel : label}</span>
    </button>
  );
};
