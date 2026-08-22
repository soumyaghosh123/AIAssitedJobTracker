import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppSettings, SettingsInput } from '../types';
import { getSettings, saveSettings } from '../features/settings/settingsService';

export interface UseSettingsResult {
  settings: AppSettings;
  loading: boolean;
  error: string | null;
  update: (input: SettingsInput) => Promise<boolean>;
  refresh: () => Promise<void>;
  /** Resolved theme: 'light' or 'dark' (accounts for the 'system' preference). */
  effectiveTheme: 'light' | 'dark';
  /** Toggles between light and dark and persists the explicit choice. */
  toggleTheme: () => Promise<boolean>;
}

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const next = await getSettings();
      setSettings(next);
    } catch (e) {
      setError('Could not load settings from local storage.');
      console.error(e);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const next = await getSettings();
        if (!cancelled) setSettings(next);
      } catch (e) {
        if (!cancelled) {
          setError('Could not load settings from local storage.');
          console.error(e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback(async (input: SettingsInput) => {
    try {
      const saved = await saveSettings(input);
      setSettings(saved);
      return true;
    } catch (e) {
      setError('Could not save settings.');
      console.error(e);
      return false;
    }
  }, []);

  const theme = settings?.theme ?? 'system';

  const effectiveTheme = useMemo(() => {
    if (theme === 'system') {
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [effectiveTheme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const root = document.documentElement;
      if (media.matches) root.classList.add('dark');
      else root.classList.remove('dark');
    };
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, [theme]);

  const toggleTheme = useCallback(async () => {
    const next: 'light' | 'dark' = effectiveTheme === 'dark' ? 'light' : 'dark';
    return update({ ...(settings ?? defaultSettingsValue), theme: next });
  }, [effectiveTheme, settings, update]);

  return {
    settings: settings ?? defaultSettingsValue,
    loading,
    error,
    update,
    refresh,
    effectiveTheme,
    toggleTheme,
  };
}

const defaultSettingsValue: AppSettings = {
  id: 'app',
  defaultPage: 'dashboard',
  defaultSort: 'updatedAt',
  itemsPerPage: 20,
  language: 'English',
  theme: 'system',
  preferredRoles: [],
  preferredLocations: [],
  salaryRange: '',
  experienceRange: '',
  updatedAt: '',
};
