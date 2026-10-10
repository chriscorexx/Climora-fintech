export type AuthRole = 'lender' | 'msme_owner';

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  role: AuthRole;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: AuthRole;
}

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
  role: AuthRole;
}

const USERS_KEY = 'climora_users_v1';
const SESSION_KEY = 'climora_session_v1';

export const PASSWORD_MIN_LENGTH = 8;
export const AUTH_ROLES: AuthRole[] = ['lender', 'msme_owner'];

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return 'Email address is required.';
  if (!isValidEmail(trimmed)) return 'Enter a valid email address (e.g. lender@climora.in).';
  return null;
}

export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Full name is required.';
  if (trimmed.length < 2) return 'Name must be at least 2 characters.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.';
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  return null;
}

export function normalizeAuthRole(value: unknown): AuthRole | null {
  return (AUTH_ROLES as string[]).includes(value as string) ? (value as AuthRole) : null;
}

export function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes.buffer);
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoded = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return toHex(digest);
}

function toAuthUser(user: StoredUser): AuthUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

function readUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to persist user registry:', err);
  }
}

function writeSession(user: AuthUser): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to persist session:', err);
  }
}

export function getSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const role = normalizeAuthRole(parsed.role);
    if (typeof parsed.id !== 'string' || typeof parsed.email !== 'string' || !role) return null;
    return {
      id: parsed.id,
      email: parsed.email,
      name: typeof parsed.name === 'string' && parsed.name ? parsed.name : parsed.email,
      role,
    };
  } catch {
    return null;
  }
}

export function logout(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (err) {
    console.error('Failed to clear session:', err);
  }
}

export async function register(input: RegisterInput): Promise<AuthUser> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const role = normalizeAuthRole(input.role);

  const emailError = validateEmail(email);
  if (emailError) throw new Error(emailError);
  const nameError = validateName(name);
  if (nameError) throw new Error(nameError);
  const passwordError = validatePassword(input.password);
  if (passwordError) throw new Error(passwordError);
  if (!role) throw new Error('Select a valid workspace role.');

  const users = readUsers();
  if (users.some((user) => user.email === email)) {
    throw new Error('An account with this email already exists. Please sign in instead.');
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(input.password, salt);
  const stored: StoredUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    email,
    name,
    role,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  };
  writeUsers([...users, stored]);

  const sessionUser = toAuthUser(stored);
  writeSession(sessionUser);
  return sessionUser;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const normalizedEmail = email.trim().toLowerCase();

  const emailError = validateEmail(normalizedEmail);
  if (emailError) throw new Error(emailError);
  if (!password) throw new Error('Password is required.');

  const users = readUsers();
  const user = users.find((candidate) => candidate.email === normalizedEmail);
  if (!user) throw new Error('Invalid email or password.');

  const passwordHash = await hashPassword(password, user.salt);
  if (passwordHash !== user.passwordHash) {
    throw new Error('Invalid email or password.');
  }

  const sessionUser = toAuthUser(user);
  writeSession(sessionUser);
  return sessionUser;
}
