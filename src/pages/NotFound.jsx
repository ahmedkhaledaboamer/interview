import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { btn } from '../components/buttonStyles.js';
import { useApp } from '../hooks/useApp.jsx';

export default function NotFound() {
  const { t } = useApp();
  return (
    <div className="mx-auto max-w-2xl px-4 py-28 text-center sm:px-6">
      <p className="font-mono text-sm text-accent-text" dir="ltr">
        ~/ahmed $ cd ./404
      </p>
      <h1 className="mt-4 text-5xl font-bold tracking-tighter">{t('notFound.title')}</h1>
      <p className="mt-3 text-muted">{t('notFound.body')}</p>
      <Link to="/" className={btn('primary', 'md', 'mt-8')}>
        <Icon name="arrowLeft" className="size-4" />
        {t('nav.home')}
      </Link>
    </div>
  );
}
