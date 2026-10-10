import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
  AuthErrorBanner,
  AuthShell,
  AuthSubmitButton,
  AuthTextField,
  PasswordToggle,
} from './AuthShell';
import { AuthUser, login } from '../../core/auth';

interface LoginPageProps {
  onAuthenticated: (user: AuthUser) => void;
  onNavigateToRegister: () => void;
  onBackToHome?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onAuthenticated,
  onNavigateToRegister,
  onBackToHome,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldError(null);

    if (!email.trim() || !password) {
      setFieldError(!email.trim() ? 'Email address is required.' : 'Password is required.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await login(email, password);
      onAuthenticated(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Sign in to Climora"
      subtitle="Access your climate risk workspace and portfolio."
      headerAction={
        onBackToHome ? (
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-fin-muted hover:text-fin-text transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg px-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home
          </button>
        ) : undefined
      }
      footer={
        <p className="text-xs text-fin-muted">
          New to Climora?{' '}
          <button
            type="button"
            onClick={onNavigateToRegister}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold"
          >
            Create an account
          </button>
        </p>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <AuthErrorBanner message={error} />

        <AuthTextField
          id="login-email"
          label="Email Address"
          type="email"
          value={email}
          onChange={(value) => setEmail(value)}
          placeholder="lender@climora.in"
          autoComplete="email"
          error={fieldError && !email.trim() ? fieldError : null}
        />

        <div>
          <AuthTextField
            id="login-password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(value) => setPassword(value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            error={fieldError && email.trim() ? fieldError : null}
            trailing={
              <PasswordToggle
                visible={showPassword}
                onToggle={() => setShowPassword((prev) => !prev)}
                labelledBy="login-password"
              />
            }
          />
        </div>

        <AuthSubmitButton label="Sign In" loadingLabel="Signing in..." isLoading={isLoading} />
      </form>
    </AuthShell>
  );
};
