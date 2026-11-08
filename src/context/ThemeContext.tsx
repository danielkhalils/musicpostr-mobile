import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { Storage } from '@/services/storage';

export interface AppThemeColors {
  isDark: boolean;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  destructive: string;
  amber: string;
  emerald: string;
  rose: string;
}

export const DARK_PALETTE: AppThemeColors = {
  isDark: true,
  background: '#09090b',
  foreground: '#fafafa',
  card: '#18181b',
  cardForeground: '#fafafa',
  primary: '#8b5cf6',
  primaryForeground: '#ffffff',
  secondary: '#27272a',
  secondaryForeground: '#fafafa',
  muted: '#27272a',
  mutedForeground: '#a1a1aa',
  border: '#27272a',
  input: '#3f3f46',
  destructive: '#ef4444',
  amber: '#f59e0b',
  emerald: '#10b981',
  rose: '#f43f5e',
};

export const LIGHT_PALETTE: AppThemeColors = {
  isDark: false,
  background: '#ffffff',
  foreground: '#09090b',
  card: '#ffffff',
  cardForeground: '#09090b',
  primary: '#7c3aed',
  primaryForeground: '#ffffff',
  secondary: '#f4f4f5',
  secondaryForeground: '#18181b',
  muted: '#f4f4f5',
  mutedForeground: '#71717a',
  border: '#e4e4e7',
  input: '#e4e4e7',
  destructive: '#ef4444',
  amber: '#f59e0b',
  emerald: '#10b981',
  rose: '#f43f5e',
};

interface ThemeContextValue {
  isDark: boolean;
  colors: AppThemeColors;
  toggleTheme: () => void;
  setDarkMode: (val: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  colors: DARK_PALETTE,
  toggleTheme: () => {},
  setDarkMode: () => {},
});

const THEME_STORAGE_KEY = 'musicpostr_theme';

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = Storage.getItem(THEME_STORAGE_KEY);
    return saved ? saved === 'dark' : true;
  });

  const setDarkMode = useCallback((val: boolean) => {
    setIsDark(val);
    Storage.setItem(THEME_STORAGE_KEY, val ? 'dark' : 'light');
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      Storage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      isDark,
      colors: isDark ? DARK_PALETTE : LIGHT_PALETTE,
      toggleTheme,
      setDarkMode,
    }),
    [isDark, toggleTheme, setDarkMode]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
