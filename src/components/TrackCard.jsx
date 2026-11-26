import { Link } from 'react-router-dom';
import { useApp } from '../hooks/useApp.jsx';
import Icon from './Icon.jsx';
import ProgressBar from './ProgressBar.jsx';

export default function TrackCard({ track, index }) {
  const { t, pick, completedSet, bestScores } = useApp();
  const done = track.lessons.filter((l) => completedSet.has(l.id)).length;
  const progress = track.lessons.length ? (done / track.lessons.length) * 100 : 0;
  const best = bestScores[track.id];
  const name = pick(track.name);

  return (
    <Link
      to={`/track/${track.id}`}
      aria-label={t('card.open', { name })}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-card p-6 transition duration-300 hover:border-accent/40 hover:shadow-[0_20px_50px_-25px_rgba(252,194,36,.35)] motion-safe:animate-fade-up motion-safe:hover:-translate-y-1"
      style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          dir="ltr"
          className="rounded-xl bg-accent/12 px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wider text-accent-text"
        >
          {track.id}
        </span>
        <Icon
          name="arrowRight"
          className="size-5 text-muted transition group-hover:text-accent-text motion-safe:group-hover:translate-x-1 rtl:motion-safe:group-hover:-translate-x-1"
        />
      </div>

      <h3 className="mt-5 text-2xl font-bold">{name}</h3>

      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="book" className="size-4" />
          {t('card.lessons', { n: track.lessons.length })}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="target" className="size-4" />
          {t('card.questions', { n: track.quiz.length })}
        </span>
      </p>

      <div className="mt-auto pt-6">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-muted" dir="ltr">
            {done}/{track.lessons.length}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="trophy" className="size-3.5 text-accent-text" />
            <span className="text-muted">{t('card.best')}:</span>
            <span className="font-semibold">{best === undefined ? t('card.noBest') : `${best}%`}</span>
          </span>
        </div>
        <ProgressBar value={progress} label={`${name}: ${Math.round(progress)}%`} />
      </div>
    </Link>
  );
}
