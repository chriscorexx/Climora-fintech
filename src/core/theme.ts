export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_MODES: ThemeMode[] = ['light', 'dark', 'system'];
export const THEME_STORAGE_KEY = 'climora-ui-mode';

export const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: '#F8FAFC',
  dark: '#090D16',
};

const DARK_QUERY = '(prefers-color-scheme: dark)';

export function normalizeThemeMode(value: unknown): ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

export function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return true;
  }
  return window.matchMedia(DARK_QUERY).matches;
}

export function getResolvedTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') {
    return getSystemPrefersDark() ? 'dark' : 'light';
  }
  return mode;
}

export function applyTheme(mode: ThemeMode): ResolvedTheme {
  const resolved = getResolvedTheme(mode);
  if (typeof document === 'undefined') {
    return resolved;
  }

  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;

  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', THEME_COLORS[resolved]);

  return resolved;
}

export function watchSystemTheme(handler: (prefersDark: boolean) => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }

  const mql = window.matchMedia(DARK_QUERY);
  const listener = (event: MediaQueryListEvent) => handler(event.matches);

  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }

  if (typeof mql.addListener === 'function') {
    mql.addListener(listener);
    return () => mql.removeListener(listener);
  }

  return () => {};
}
