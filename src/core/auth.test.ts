import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import {
  PASSWORD_MIN_LENGTH,
  generateSalt,
  getSession,
  hashPassword,
  isValidEmail,
  login,
  logout,
  normalizeAuthRole,
  register,
  toHex,
  validateEmail,
  validateName,
  validatePassword,
} from './auth';

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

beforeEach(() => {
  (globalThis.localStorage as unknown as MemoryStorage).clear();
});

describe('Auth validation', () => {
  it('validates email format', () => {
    expect(isValidEmail('lender@climora.in')).toBe(true);
    expect(isValidEmail(' owner@climora.co.in ')).toBe(true);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('missing@domain')).toBe(false);
    expect(isValidEmail('')).toBe(false);

    expect(validateEmail('lender@climora.in')).toBeNull();
    expect(validateEmail('')).toMatch(/required/i);
    expect(validateEmail('bad-email')).toMatch(/valid email/i);
  });

  it('validates password strength with clear messages', () => {
    expect(validatePassword('')).toMatch(/required/i);
    expect(validatePassword('short')).toMatch(new RegExp(`${PASSWORD_MIN_LENGTH} characters`));
    expect(validatePassword('climora2026')).toBeNull();
  });

  it('validates display names and normalizes roles', () => {
    expect(validateName('')).toMatch(/required/i);
    expect(validateName('A')).toMatch(/2 characters/);
    expect(validateName('Ananya Sharma')).toBeNull();

    expect(normalizeAuthRole('lender')).toBe('lender');
    expect(normalizeAuthRole('msme_owner')).toBe('msme_owner');
    expect(normalizeAuthRole('command_center')).toBeNull();
    expect(normalizeAuthRole(undefined)).toBeNull();
  });
});

describe('Password hashing', () => {
  it('encodes buffers as hex', () => {
    const bytes = new Uint8Array([0, 15, 16, 255]);
    expect(toHex(bytes.buffer)).toBe('000f10ff');
  });

  it('produces deterministic salted SHA-256 hashes', async () => {
    const salt = generateSalt();
    expect(salt).toMatch(/^[0-9a-f]{32}$/);

    const first = await hashPassword('climora2026', salt);
    const second = await hashPassword('climora2026', salt);
    const other = await hashPassword('climora2026', generateSalt());

    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(first).toBe(second);
    expect(first).not.toBe(other);
    expect(first).not.toContain('climora2026');
  });

  it('generates unique salts', () => {
    const salts = new Set([generateSalt(), generateSalt(), generateSalt()]);
    expect(salts.size).toBe(3);
  });
});

describe('Auth session flow', () => {
  it('registers a user, persists a session, and never stores plaintext passwords', async () => {
    const user = await register({
      email: 'Lender@Climora.in',
      name: '  Ananya Sharma  ',
      password: 'climora2026',
      role: 'lender',
    });

    expect(user.email).toBe('lender@climora.in');
    expect(user.name).toBe('Ananya Sharma');
    expect(user.role).toBe('lender');

    const raw = localStorage.getItem('climora_users_v1');
    expect(raw).toBeTruthy();
    expect(raw).not.toContain('climora2026');
    expect(JSON.parse(raw as string)[0].passwordHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.parse(raw as string)[0].salt).toMatch(/^[0-9a-f]{32}$/);

    const session = getSession();
    expect(session).toEqual({
      id: user.id,
      email: 'lender@climora.in',
      name: 'Ananya Sharma',
      role: 'lender',
    });
  });

  it('rejects duplicate registrations with a clear message', async () => {
    await register({
      email: 'owner@climora.in',
      name: 'Owner One',
      password: 'climora2026',
      role: 'msme_owner',
    });
    await expect(
      register({
        email: 'owner@climora.in',
        name: 'Owner Two',
        password: 'climora2026',
        role: 'msme_owner',
      }),
    ).rejects.toThrow(/already exists/i);
  });

  it('logs in with correct credentials and rejects wrong passwords or unknown emails', async () => {
    await register({
      email: 'owner@climora.in',
      name: 'Owner One',
      password: 'climora2026',
      role: 'msme_owner',
    });
    logout();
    expect(getSession()).toBeNull();

    const user = await login('owner@climora.in', 'climora2026');
    expect(user.email).toBe('owner@climora.in');
    expect(getSession()?.id).toBe(user.id);

    await expect(login('owner@climora.in', 'wrong-password')).rejects.toThrow(
      /invalid email or password/i,
    );
    await expect(login('stranger@climora.in', 'climora2026')).rejects.toThrow(
      /invalid email or password/i,
    );
  });

  it('rejects invalid registration input before touching storage', async () => {
    await expect(
      register({ email: 'bad', name: 'Test', password: 'climora2026', role: 'lender' }),
    ).rejects.toThrow(/valid email/i);
    await expect(
      register({ email: 'a@b.in', name: '', password: 'climora2026', role: 'lender' }),
    ).rejects.toThrow(/name/i);
    await expect(
      register({ email: 'a@b.in', name: 'Test', password: '123', role: 'lender' }),
    ).rejects.toThrow(/8 characters/);
    expect(localStorage.getItem('climora_users_v1')).toBeNull();
  });

  it('clears the session on logout', async () => {
    await register({
      email: 'owner@climora.in',
      name: 'Owner One',
      password: 'climora2026',
      role: 'msme_owner',
    });
    expect(getSession()).not.toBeNull();
    logout();
    expect(getSession()).toBeNull();
  });
});
