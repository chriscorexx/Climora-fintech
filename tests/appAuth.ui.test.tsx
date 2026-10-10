import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { App } from '@/App';
import { ThemeProvider } from '@/components/common/ThemeProvider';
import { getSession, logout } from '@/core/auth';

class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

beforeAll(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  });
});

function typeInto(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe('App authentication gate (jsdom UI harness)', () => {
  beforeEach(() => {
    cleanup();
    logout();
    (globalThis.localStorage as unknown as MemoryStorage).clear();
  });

  it('shows only the sign-in page when there is no session', async () => {
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );
    expect(await screen.findByText('Sign in to Climora')).toBeInTheDocument();
    expect(screen.queryByText('MSME Underwriting Pipeline')).not.toBeInTheDocument();
    expect(getSession()).toBeNull();
  });

  it('navigates between login and register pages', async () => {
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Create an account' }));
    expect(await screen.findByText('Create your Climora account')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Sign in to Climora')).toBeInTheDocument();
  });

  it('routes a registered lender into the lender workspace with a persisted session', async () => {
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Create an account' }));
    expect(await screen.findByText('Create your Climora account')).toBeInTheDocument();

    typeInto('Full Name', 'Ananya Sharma');
    typeInto('Email Address', 'lender@climora.in');
    typeInto('Password', 'climora2026');
    typeInto('Confirm Password', 'climora2026');
    fireEvent.click(screen.getByRole('radio', { name: /Lender/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(
      () => expect(screen.getByText('MSME Underwriting Pipeline')).toBeInTheDocument(),
      { timeout: 10000 },
    );
    expect(screen.queryByText('Sign in to Climora')).not.toBeInTheDocument();
    expect(getSession()?.role).toBe('lender');
  });

  it('blocks sign-in with incorrect credentials', async () => {
    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );

    typeInto('Email Address', 'nobody@climora.in');
    typeInto('Password', 'climora2026');
    fireEvent.click(await screen.findByRole('button', { name: 'Sign In' }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password.');
    expect(screen.getByText('Sign in to Climora')).toBeInTheDocument();
  });
});
