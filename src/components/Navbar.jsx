import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../hooks/useApp.jsx';
import Icon from './Icon.jsx';
import { btn } from './buttonStyles.js';

function PillLink({ to, active, children }) {
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-accent/15 text-accent-text ring-1 ring-accent/40'
          : 'text-muted hover:bg-card-2 hover:text-fg'
      }`}
    >
      {children}
    </Link>
  );
}

const roundBtn =
  'grid size-10 place-items-center rounded-full border border-line bg-card/70 text-fg transition hover:border-line-strong hover:bg-card-2 motion-safe:hover:-translate-y-0.5';

export default function Navbar() {
  const { t, lang, theme, toggleLang, toggleTheme } = useApp();
  const { pathname } = useLocation();
  const nextMode = theme === 'dark' ? 'light' : 'dark';
  const themeLabel = t('nav.toggleTheme', { mode: t(`mode.${nextMode}`) });

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <Link
          to="/"
          dir="ltr"
          className="me-auto shrink-0 font-display text-xs font-bold uppercase tracking-[0.22em] text-accent-text min-[380px]:text-sm sm:text-base sm:tracking-[0.32em]"
        >
          Ahmed Khaled
        </Link>

        <nav
          aria-label={t('nav.menu')}
          className="order-last flex w-full items-center gap-1 sm:order-none sm:w-auto"
        >
          <PillLink to="/" active={pathname === '/'}>
            {t('nav.home')}
          </PillLink>
          <PillLink to="/#tracks" active={pathname.startsWith('/track/')}>
            {t('nav.tracks')}
          </PillLink>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className={roundBtn}
            aria-label={themeLabel}
            title={themeLabel}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="size-[18px]" />
          </button>
          <button
            type="button"
            onClick={toggleLang}
            className={`${roundBtn} text-xs font-bold`}
            aria-label={t('nav.toggleLang')}
            title={t('nav.toggleLang')}
          >
            <span lang={lang === 'ar' ? 'en' : 'ar'}>{lang === 'ar' ? 'EN' : 'ع'}</span>
          </button>
          <Link
            to="/exam"
            aria-current={pathname === '/exam' ? 'page' : undefined}
            aria-label={t('nav.exam')}
            title={t('nav.exam')}
            className={btn('primary', 'sm', 'size-10 p-0 sm:size-auto sm:px-4 sm:py-2')}
          >
            <Icon name="flag" className="size-4" />
            <span className="hidden sm:inline">{t('nav.exam')}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
