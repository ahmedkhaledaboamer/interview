import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Icon from '../components/Icon.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import Terminal from '../components/Terminal.jsx';
import TrackCard from '../components/TrackCard.jsx';
import { btn } from '../components/buttonStyles.js';
import { useApp } from '../hooks/useApp.jsx';
import { useDueCount } from '../hooks/useDueCount.js';
import { examConfig, tracks } from '../utils/quiz.js';

function StatCard({ icon, label, value, children }) {
  return (
    <div className="rounded-3xl border border-line bg-card/90 p-6 backdrop-blur">
      <div className="flex items-center gap-3 text-sm text-muted">
        <span className="grid size-9 place-items-center rounded-xl bg-accent/12 text-accent-text">
          <Icon name={icon} className="size-[18px]" />
        </span>
        {label}
      </div>
      <p className="mt-4 font-display text-4xl font-bold tracking-tight" dir="ltr">
        <bdi>{value}</bdi>
      </p>
      {children}
    </div>
  );
}

export default function Home() {
  const { t, completedSet, bestScores, bestExam, resetProgress } = useApp();
  const [confirmReset, setConfirmReset] = useState(false);

  const commands = useMemo(() => tracks.map((tr) => `study --track ${tr.id}`), []);

  const totalLessons = tracks.reduce((n, tr) => n + tr.lessons.length, 0);
  const doneLessons = tracks.reduce(
    (n, tr) => n + tr.lessons.filter((l) => completedSet.has(l.id)).length,
    0,
  );
  const overall = totalLessons ? Math.round((doneLessons / totalLessons) * 100) : 0;

  const scored = tracks.map((tr) => bestScores[tr.id]).filter((s) => s !== undefined);
  const avgScore = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null;
  const due = useDueCount();
  const hasProgress = doneLessons > 0 || scored.length > 0 || bestExam !== null;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* Hero */}
      <section className="pt-16 pb-14 sm:pt-24 sm:pb-20">
        <p className="flex items-center gap-3 text-sm font-medium text-muted motion-safe:animate-fade-up sm:text-base">
          <span aria-hidden="true" className="h-0.5 w-10 rounded-full bg-accent" />
          {t('hero.greeting')}
        </p>
        <h1
          className="mt-6 max-w-4xl text-5xl font-bold tracking-tighter motion-safe:animate-fade-up sm:text-6xl lg:text-[5.25rem] lg:leading-[1.02]"
          style={{ animationDelay: '60ms' }}
        >
          {t('hero.titleA')} <span className="text-accent-text">{t('hero.titleB')}</span>{' '}
          {t('hero.titleC')}
        </h1>
        <p
          className="mt-6 max-w-2xl text-lg text-muted motion-safe:animate-fade-up sm:text-xl"
          style={{ animationDelay: '120ms' }}
        >
          {t('hero.sub', { tracks: tracks.length })}
        </p>

        <div
          className="mt-8 flex flex-wrap items-center gap-3 motion-safe:animate-fade-up"
          style={{ animationDelay: '180ms' }}
        >
          <Link to="/#tracks" className={btn('primary', 'lg')}>
            {t('hero.start')}
            <Icon name="arrowRight" className="size-5" />
          </Link>
          <Link to="/exam" className={btn('ghost', 'lg')}>
            <Icon name="flag" className="size-5" />
            {t('hero.exam')}
          </Link>
        </div>

        <div className="mt-10 motion-safe:animate-fade-up" style={{ animationDelay: '240ms' }}>
          <Terminal commands={commands} />
        </div>
      </section>

      {/* Daily review */}
      {due > 0 && (
        <Link
          to="/review"
          className="mb-4 flex flex-col gap-4 rounded-3xl border border-accent/50 bg-accent/10 p-5 transition hover:bg-accent/15 sm:flex-row sm:items-center sm:justify-between sm:p-6"
        >
          <span className="flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent text-accent-fg">
              <Icon name="refresh" className="size-6" />
            </span>
            <span>
              <span className="block text-lg font-bold">{t('home.reviewTitle', { n: due })}</span>
              <span className="block text-sm text-muted">{t('home.reviewSub')}</span>
            </span>
          </span>
          <span className={btn('primary', 'md', 'self-start sm:self-auto')}>
            {t('home.reviewGo')}
            <Icon name="arrowRight" className="size-4" />
          </span>
        </Link>
      )}

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-3" aria-label={t('stats.progress')}>
        <StatCard icon="book" label={t('stats.progress')} value={`${overall}%`}>
          <ProgressBar value={overall} label={t('stats.progress')} className="mt-4" />
          <p className="mt-2 text-sm text-muted">
            {t('stats.lessons', { done: doneLessons, total: totalLessons })}
          </p>
        </StatCard>
        <StatCard icon="target" label={t('stats.avg')} value={avgScore === null ? '—' : `${avgScore}%`}>
          <p className="mt-2 text-sm text-muted">
            {avgScore === null ? t('stats.noScores') : `${scored.length} / ${tracks.length}`}
          </p>
        </StatCard>
        <StatCard icon="trophy" label={t('stats.exam')} value={bestExam === null ? '—' : `${bestExam}%`}>
          <p className="mt-2 text-sm text-muted">
            {bestExam === null
              ? t('stats.noExam')
              : bestExam >= examConfig.passPercent
                ? t('exam.passed')
                : t('exam.failed')}
          </p>
        </StatCard>
      </section>

      {/* Tracks */}
      <section id="tracks" aria-labelledby="tracks-title" className="scroll-mt-24 pt-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-3 text-sm font-medium text-accent-text">
              <span aria-hidden="true" className="h-0.5 w-8 rounded-full bg-accent" />
              {t('nav.tracks')} · {tracks.length}
            </p>
            <h2 id="tracks-title" className="mt-2 text-4xl font-bold sm:text-5xl">
              {t('home.tracksTitle')}
            </h2>
            <p className="mt-3 max-w-xl text-muted">{t('home.tracksSub')}</p>
          </div>
          {hasProgress && (
            <button type="button" onClick={() => setConfirmReset(true)} className={btn('subtle', 'sm')}>
              <Icon name="refresh" className="size-4" />
              {t('home.reset')}
            </button>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tracks.map((track, i) => (
            <TrackCard key={track.id} track={track} index={i} />
          ))}
        </div>
      </section>

      {/* Final exam CTA */}
      <section className="py-20">
        <div className="relative overflow-hidden rounded-[2rem] border border-accent/30 bg-card p-8 sm:p-12">
          <div
            aria-hidden="true"
            className="absolute -top-24 -end-24 size-72 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(252,194,36,.22), transparent 70%)' }}
          />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold sm:text-4xl">{t('home.examTitle')}</h2>
              <p className="mt-3 text-lg text-muted">
                {t('home.examSub', {
                  count: examConfig.questionCount,
                  minutes: examConfig.durationMinutes,
                  pass: examConfig.passPercent,
                })}
              </p>
            </div>
            <Link to="/exam" className={btn('primary', 'lg', 'shrink-0')}>
              <Icon name="flag" className="size-5" />
              {t('nav.exam')}
            </Link>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={confirmReset}
        title={t('home.resetTitle')}
        body={t('home.resetBody')}
        confirmLabel={t('home.reset')}
        cancelLabel={t('common.cancel')}
        tone="danger"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetProgress();
          setConfirmReset(false);
        }}
      />
    </div>
  );
}
