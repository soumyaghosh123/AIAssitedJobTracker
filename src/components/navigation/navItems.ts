import { Activity, Briefcase, FileText, FolderOpen, LayoutDashboard, Settings, User } from 'lucide-react';

export type PageKey = 'dashboard' | 'tracker' | 'jobs' | 'profile' | 'docs' | 'settings';

export const NAV_ITEMS: { key: PageKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'tracker', label: 'Tracker', icon: Briefcase },
  { key: 'jobs', label: 'Jobs', icon: FolderOpen },
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'docs', label: 'Docs', icon: FileText },
];

export const SETTINGS_ITEM: { key: PageKey; label: string; icon: typeof Settings } = {
  key: 'settings',
  label: 'Settings',
  icon: Settings,
};

export function isPageKey(value: string): value is PageKey {
  return NAV_ITEMS.some((item) => item.key === value) || value === 'settings';
}

export function brandIcon() {
  return Activity;
}
