import { Moon, Sun } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';

/**
 * Application-level theme toggle shown in the header.
 * Switches between light and dark, persisting the explicit choice
 * to IndexedDB settings so it survives refresh and stays in sync
 * with Settings > Appearance.
 */
export function ThemeToggle() {
  const { effectiveTheme, toggleTheme } = useSettings();

  const isDark = effectiveTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => void toggleTheme()}
      className="flex min-h-[44px] items-center justify-center rounded-lg px-2.5 text-blue-100 transition-colors hover:bg-blue-800/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}
