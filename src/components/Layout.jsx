import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../hooks/useApp.jsx';
import Background from './Background.jsx';
import Navbar from './Navbar.jsx';

export default function Layout() {
  const { t } = useApp();
  const { pathname, hash, key } = useLocation();

  // Back to the top when the page changes (search-param updates keep the scroll position).
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, [pathname]);

  // Scroll to an anchor such as /#tracks, even when clicking the same link twice.
  useEffect(() => {
    if (!hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash, key]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-accent px-4 py-2 font-semibold text-accent-fg focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
      >
        {t('nav.skip')}
      </a>
      <Background />
      <Navbar />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-sm text-muted sm:px-6">
          <p>{t('footer.made')}</p>
          <p className="font-mono text-xs" dir="ltr">
            ~/ahmed $ <span className="text-accent-text">echo &quot;good luck&quot;</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
