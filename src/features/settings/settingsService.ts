import type { AppSettings, SettingsInput } from '../../types';
import { DEFAULT_LANGUAGE, DEFAULT_PAGE_SIZE, DEFAULT_SORT } from '../../constants/statuses';
import * as repo from '../../features/jobs/jobRepository';
import { todayISO } from '../../utils/format';

export function defaultSettings(): AppSettings {
  return {
    id: 'app',
    defaultPage: 'dashboard',
    defaultSort: DEFAULT_SORT,
    itemsPerPage: DEFAULT_PAGE_SIZE,
    language: DEFAULT_LANGUAGE,
    theme: 'system',
    preferredRoles: [],
    preferredLocations: [],
    salaryRange: '',
    experienceRange: '',
    updatedAt: todayISO(),
  };
}

export async function getSettings(): Promise<AppSettings> {
  const settings = await repo.getSettings();
  return settings ?? defaultSettings();
}

export async function saveSettings(input: SettingsInput): Promise<AppSettings> {
  const existing = await repo.getSettings();
  const settings: AppSettings = {
    id: 'app',
    defaultPage: input.defaultPage,
    defaultSort: input.defaultSort,
    itemsPerPage: Math.max(1, Math.min(100, Math.floor(input.itemsPerPage) || DEFAULT_PAGE_SIZE)),
    language: input.language || DEFAULT_LANGUAGE,
    theme: input.theme,
    preferredRoles: input.preferredRoles,
    preferredLocations: input.preferredLocations,
    salaryRange: input.salaryRange,
    experienceRange: input.experienceRange,
    updatedAt: todayISO(),
    ...(existing ? { updatedAt: todayISO() } : {}),
  };
  return repo.saveSettings(settings);
}
