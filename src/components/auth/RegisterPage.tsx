import React, { useState } from 'react';
import { Building2, Layers } from 'lucide-react';
import {
  AuthErrorBanner,
  AuthShell,
  AuthSubmitButton,
  AuthTextField,
  PasswordToggle,
} from './AuthShell';
import { AuthRole, AuthUser, PASSWORD_MIN_LENGTH, register } from '../../core/auth';

interface RegisterPageProps {
  onAuthenticated: (user: AuthUser) => void;
  onNavigateToLogin: () => void;
}

const ROLE_OPTIONS: Array<{
  id: AuthRole;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'lender',
    label: 'Lender',
    description: 'Underwrite the full MSME climate risk portfolio',
    icon: Layers,
  },
  {
    id: 'msme_owner',
    label: 'MSME Owner',
    description: 'Manage your own enterprise risk profile',
    icon: Building2,
  },
];

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onAuthenticated,
  onNavigateToLogin,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<AuthRole>('lender');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = 'Full name is required.';
    if (!email.trim()) nextErrors.email = 'Email address is required.';
    if (!password) nextErrors.password = 'Password is required.';
    if (password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.';
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);
    try {
      const user = await register({ email, name, password, role });
      onAuthenticated(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your Climora account"
      subtitle="Register as a lender or MSME owner to access your workspace."
      footer={
        <p className="text-xs text-fin-muted">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold"
          >
            Sign in
          </button>
        </p>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthErrorBanner message={error} />

        <AuthTextField
          id="register-name"
          label="Full Name"
          type="text"
          value={name}
          onChange={(value) => setName(value)}
          placeholder="e.g. Ananya Sharma"
          autoComplete="name"
          error={fieldErrors.name}
        />

        <AuthTextField
          id="register-email"
          label="Email Address"
          type="email"
          value={email}
          onChange={(value) => setEmail(value)}
          placeholder="owner@climora.in"
          autoComplete="email"
          error={fieldErrors.email}
        />

        <AuthTextField
          id="register-password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(value) => setPassword(value)}
          placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
          autoComplete="new-password"
          error={fieldErrors.password}
          trailing={
            <PasswordToggle
              visible={showPassword}
              onToggle={() => setShowPassword((prev) => !prev)}
              labelledBy="register-password"
            />
          }
        />

        <AuthTextField
          id="register-confirm-password"
          label="Confirm Password"
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(value) => setConfirmPassword(value)}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          error={fieldErrors.confirmPassword}
        />

        <fieldset>
          <legend className="text-xs font-medium text-fin-secondary mb-1.5">Workspace Role</legend>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-2"
            role="radiogroup"
            aria-label="Workspace role"
          >
            {ROLE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isActive = role === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => setRole(option.id)}
                  className={`text-left p-3 rounded-xl border transition-colors ${
                    isActive
                      ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15'
                      : 'border-fin-border bg-fin-inset hover:border-fin-hover'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-fin-muted'
                      }`}
                    />
                    <span
                      className={`text-xs font-bold ${
                        isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-fin-text'
                      }`}
                    >
                      {option.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-fin-muted mt-1 leading-relaxed">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </fieldset>

        <AuthSubmitButton label="Create Account" loadingLabel="Creating..." isLoading={isLoading} />
      </form>
    </AuthShell>
  );
};
