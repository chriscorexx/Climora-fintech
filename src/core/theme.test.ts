import { describe, it, expect } from 'vitest';
import {
  THEME_MODES,
  THEME_STORAGE_KEY,
  THEME_COLORS,
  normalizeThemeMode,
  getResolvedTheme,
  getSystemPrefersDark,
  applyTheme,
  watchSystemTheme,
} from './theme';
import { getStoredThemeMode, saveStoredThemeMode } from './storage';

describe('Climora UI mode engine', () => {
  it('exposes exactly the three UI modes', () => {
    expect(THEME_MODES).toEqual(['light', 'dark', 'system']);
    expect(THEME_STORAGE_KEY).toBe('climora-ui-mode');
    expect(Object.keys(THEME_COLORS).sort()).toEqual(['dark', 'light']);
  });

  it('normalizes unknown persisted values to system', () => {
    expect(normalizeThemeMode('light')).toBe('light');
    expect(normalizeThemeMode('dark')).toBe('dark');
    expect(normalizeThemeMode('system')).toBe('system');
    expect(normalizeThemeMode('sepia')).toBe('system');
    expect(normalizeThemeMode(undefined)).toBe('system');
    expect(normalizeThemeMode(null)).toBe('system');
  });

  it('resolves explicit modes without consulting the OS', () => {
    expect(getResolvedTheme('light')).toBe('light');
    expect(getResolvedTheme('dark')).toBe('dark');
  });

  it('falls back to a safe resolved theme when no DOM is available', () => {
    expect(getSystemPrefersDark()).toBe(true);
    expect(getResolvedTheme('system')).toBe('dark');
    expect(() => applyTheme('system')).not.toThrow();
    expect(applyTheme('light')).toBe('light');
  });

  it('returns a no-op cleanup when matchMedia is unavailable', () => {
    const unsubscribe = watchSystemTheme(() => {});
    expect(typeof unsubscribe).toBe('function');
    expect(() => unsubscribe()).not.toThrow();
  });

  it('defaults persisted UI mode to system and survives a missing storage API', () => {
    expect(getStoredThemeMode()).toBe('system');
    const originalError = console.error;
    console.error = () => {};
    try {
      expect(() => saveStoredThemeMode('dark')).not.toThrow();
    } finally {
      console.error = originalError;
    }
    expect(getStoredThemeMode()).toBe('system');
  });
});
