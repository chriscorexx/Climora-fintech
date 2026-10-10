import React, { useState } from 'react';
import { Lock, ShieldAlert, X } from 'lucide-react';
import { verifyCommandCenterPassword } from '../../core/commandCenter';
import { PasswordToggle } from './AuthShell';

interface PasswordGateProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const PasswordGate: React.FC<PasswordGateProps> = ({ onSuccess, onClose }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Password is required.');
      return;
    }

    setIsLoading(true);
    try {
      if (verifyCommandCenterPassword(password)) {
        setPassword('');
        onSuccess();
        return;
      }
      setError('Incorrect password. Access denied.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Command Center access gate"
    >
      <div className="w-full max-w-sm rounded-2xl bg-fin-card border border-fin-border shadow-2xl p-6">
        <div className="flex items-start justify-between pb-4 border-b border-fin-border">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-700 dark:text-amber-300" />
            <div>
              <h2 className="text-sm font-bold text-fin-text tracking-tight">
                Command Center Locked
              </h2>
              <p className="text-xs text-fin-muted">Enter the access password to continue.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close command center password gate"
            className="p-1.5 rounded-lg text-fin-muted hover:text-fin-text hover:bg-fin-inset transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-4">
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 dark:bg-rose-500/15 px-3 py-2.5 text-xs text-rose-700 dark:text-rose-300"
            >
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="command-center-password"
              className="block text-xs font-medium text-fin-secondary mb-1.5"
            >
              Access Password
            </label>
            <div className="relative">
              <input
                id="command-center-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
                placeholder="Enter command center password"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'command-center-password-error' : undefined}
                className={`w-full px-3 py-2 pr-10 rounded-lg bg-fin-inset border text-fin-text placeholder-fin-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/60 ${
                  error ? 'border-rose-500/60' : 'border-fin-border'
                }`}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <PasswordToggle
                  visible={showPassword}
                  onToggle={() => setShowPassword((prev) => !prev)}
                  labelledBy="command-center-password"
                />
              </div>
            </div>
            {error && (
              <p
                id="command-center-password-error"
                className="text-[11px] text-rose-700 dark:text-rose-300 mt-1"
              >
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm transition-colors shadow-sm disabled:opacity-70"
          >
            Unlock Command Center
          </button>
        </form>
      </div>
    </div>
  );
};
