import { Activity, Menu } from 'lucide-react';
import { NAV_ITEMS, SETTINGS_ITEM, type PageKey } from './navItems';
import { ThemeToggle } from './ThemeToggle';
import { DateTimeBadge } from './DateTimeBadge';

interface HeaderProps {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
  onOpenMobileNav: () => void;
}

export function Header({ current, onNavigate, onOpenMobileNav }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-blue-900/60 bg-brand-900 text-white shadow-sm">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-2 px-3 sm:px-5">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="mr-1 rounded-lg p-2 text-blue-100 hover:bg-blue-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 lg:hidden"
          aria-label="Open navigation menu"
          aria-expanded="false"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="flex min-h-[44px] items-center gap-2 rounded-lg px-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          aria-label="CareerPulse home"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Activity className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-left">
            <span className="block text-[15px] font-bold leading-tight tracking-tight">CareerPulse</span>
            <span className="hidden text-[10px] font-medium leading-tight text-blue-200 sm:block">
              Track every opportunity. Measure every move.
            </span>
          </span>
        </button>

        <nav className="ml-4 hidden items-center gap-0.5 lg:flex" aria-label="Main navigation">
          {[...NAV_ITEMS, SETTINGS_ITEM].map((item) => {
            const Icon = item.icon;
            const active = current === item.key;
            const isSettings = item.key === 'settings';
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onNavigate(item.key)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                  active
                    ? 'bg-blue-800/70 text-white'
                    : 'text-blue-100 hover:bg-blue-800/40 hover:text-white'
                } ${isSettings ? 'ml-2 border-l border-blue-700/70 pl-4' : ''}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <DateTimeBadge />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
