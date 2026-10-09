import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ThemeMode,
  ResolvedTheme,
  applyTheme,
  getSystemPrefersDark,
  watchSystemTheme,
} from '../../core/theme';
import { getStoredThemeMode, saveStoredThemeMode } from '../../core/storage';

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  availableModes: ThemeMode[];
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => getStoredThemeMode());
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => getSystemPrefersDark());

  useEffect(() => {
    return watchSystemTheme((prefersDark) => setSystemPrefersDark(prefersDark));
  }, []);

  const resolvedTheme: ResolvedTheme = mode === 'system' ? (systemPrefersDark ? 'dark' : 'light') : mode;

  useEffect(() => {
    applyTheme(mode);
  }, [mode, systemPrefersDark]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    saveStoredThemeMode(next);
  }, []);

  const availableModes = useMemo<ThemeMode[]>(() => ['light', 'dark', 'system'], []);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolvedTheme, setMode, availableModes }),
    [mode, resolvedTheme, setMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
