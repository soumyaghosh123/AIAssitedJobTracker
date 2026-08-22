import { useCallback, useEffect, useState } from 'react';
import { Header } from './components/navigation/Header';
import { MobileNav } from './components/navigation/MobileNav';
import { isPageKey, type PageKey } from './components/navigation/navItems';
import { DashboardPage } from './pages/DashboardPage';
import { TrackerPage } from './pages/TrackerPage';
import { JobsPage } from './pages/JobsPage';
import { ProfilePage } from './pages/ProfilePage';
import { DocsPage } from './pages/DocsPage';
import { SettingsPage } from './pages/SettingsPage';
import { useSettings } from './hooks/useSettings';

function pageFromHash(): PageKey {
  const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
  if (isPageKey(hash)) return hash;
  return 'dashboard';
}

export default function App() {
  const { settings } = useSettings();
  const [page, setPage] = useState<PageKey>(() => pageFromHash());
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const onHashChange = () => {
      setPage(pageFromHash());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Redirect to the settings default page on first load (empty hash).
  useEffect(() => {
    if (!window.location.hash && settings?.defaultPage) {
      window.location.hash = `/${settings.defaultPage}`;
    }
  }, [settings?.defaultPage]);

  const navigate = useCallback((next: PageKey) => {
    window.location.hash = `/${next}`;
    setPage(next);
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <Header current={page} onNavigate={navigate} onOpenMobileNav={() => setMobileNavOpen(true)} />
      <MobileNav
        open={mobileNavOpen}
        current={page}
        onNavigate={navigate}
        onClose={() => setMobileNavOpen(false)}
      />
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-3 py-6 sm:px-5" id="main-content">
        {page === 'dashboard' ? <DashboardPage /> : null}
        {page === 'tracker' ? <TrackerPage /> : null}
        {page === 'jobs' ? <JobsPage /> : null}
        {page === 'profile' ? <ProfilePage /> : null}
        {page === 'docs' ? <DocsPage /> : null}
        {page === 'settings' ? <SettingsPage /> : null}
      </main>
      <footer className="border-t border-slate-200 bg-white py-4 dark:border-slate-800 dark:bg-slate-800/50">
        <p className="mx-auto max-w-[1600px] px-3 text-center text-xs text-slate-500 dark:text-slate-400 sm:px-5">
          CareerPulse — Track every opportunity. Measure every move. · Local-first: your data never leaves this browser.
        </p>
      </footer>
    </div>
  );
}
