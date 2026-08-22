import { Activity, X } from 'lucide-react';
import { NAV_ITEMS, SETTINGS_ITEM, type PageKey } from './navItems';

interface MobileNavProps {
  open: boolean;
  current: PageKey;
  onNavigate: (page: PageKey) => void;
  onClose: () => void;
}

export function MobileNav({ open, current, onNavigate, onClose }: MobileNavProps) {
  if (!open) return null;

  const handleNavigate = (page: PageKey) => {
    onNavigate(page);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl dark:bg-slate-800">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white">
              <Activity className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">CareerPulse</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Track every opportunity.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3" aria-label="Mobile navigation">
          <ul className="space-y-1">
            {[...NAV_ITEMS, SETTINGS_ITEM].map((item) => {
              const Icon = item.icon;
              const active = current === item.key;
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => handleNavigate(item.key)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex w-full min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      active
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-slate-200 px-4 py-3 text-[11px] text-slate-400 dark:border-slate-700 dark:text-slate-500">
          Local-first · Your data stays in this browser
        </div>
      </div>
    </div>
  );
}
