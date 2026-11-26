import { useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import QuizPanel from '../components/QuizPanel.jsx';
import StudyPanel from '../components/StudyPanel.jsx';
import { btn } from '../components/buttonStyles.js';
import { useApp } from '../hooks/useApp.jsx';
import { getTrack } from '../utils/quiz.js';

const TABS = ['study', 'quiz'];

export default function TrackPage() {
  const { trackId } = useParams();
  const [params, setParams] = useSearchParams();
  const { t, pick, isRtl, completedSet, bestScores } = useApp();
  const tabRefs = useRef({});
  const track = getTrack(trackId);

  if (!track) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-4xl font-bold">{t('track.notFound')}</h1>
        <p className="mt-3 text-muted">{t('track.notFoundSub')}</p>
        <Link to="/#tracks" className={btn('primary', 'md', 'mt-8')}>
          <Icon name="arrowLeft" className="size-4" />
          {t('track.back')}
        </Link>
      </div>
    );
  }

  const tab = params.get('tab') === 'quiz' ? 'quiz' : 'study';
  const lessonId = params.get('lesson') ?? track.lessons[0]?.id;
  const done = track.lessons.filter((l) => completedSet.has(l.id)).length;
  const progress = track.lessons.length ? (done / track.lessons.length) * 100 : 0;
  const best = bestScores[track.id];

  const setTab = (next) =>
    setParams(
      (p) => {
        const copy = new URLSearchParams(p);
        copy.set('tab', next);
        return copy;
      },
      { replace: true },
    );

  const setLesson = (id) =>
    setParams(
      (p) => {
        const copy = new URLSearchParams(p);
        copy.set('lesson', id);
        copy.delete('tab');
        return copy;
      },
      { replace: true },
    );

  const onTabKey = (e) => {
    const forward = isRtl ? 'ArrowLeft' : 'ArrowRight';
    const back = isRtl ? 'ArrowRight' : 'ArrowLeft';
    if (![forward, back, 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    let i = TABS.indexOf(tab);
    if (e.key === forward) i = (i + 1) % TABS.length;
    if (e.key === back) i = (i - 1 + TABS.length) % TABS.length;
    if (e.key === 'Home') i = 0;
    if (e.key === 'End') i = TABS.length - 1;
    setTab(TABS[i]);
    tabRefs.current[TABS[i]]?.focus();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-20 sm:px-6">
      <Link
        to="/#tracks"
        className="inline-flex items-center gap-2 rounded-full text-sm font-medium text-muted transition-colors hover:text-fg"
      >
        <Icon name="arrowLeft" className="size-4" />
        {t('track.back')}
      </Link>

      <header className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="flex items-center gap-3 font-mono text-sm text-accent-text" dir="ltr">
            <span aria-hidden="true" className="h-0.5 w-8 rounded-full bg-accent" />~/{track.id}
          </p>
          <h1 className="mt-3 text-5xl font-bold tracking-tighter sm:text-6xl">{pick(track.name)}</h1>
        </div>
        <div className="w-full max-w-xs">
          <div className="mb-2 flex justify-between text-sm text-muted">
            <span dir="ltr">
              {done}/{track.lessons.length}
            </span>
            <span>
              {t('card.best')}:{' '}
              <span className="font-semibold text-fg">{best === undefined ? t('card.noBest') : `${best}%`}</span>
            </span>
          </div>
          <ProgressBar value={progress} label={pick(track.name)} />
        </div>
      </header>

      <div
        role="tablist"
        aria-label={pick(track.name)}
        onKeyDown={onTabKey}
        className="mt-8 mb-8 inline-flex rounded-full border border-line bg-card p-1"
      >
        {TABS.map((name) => {
          const active = tab === name;
          return (
            <button
              key={name}
              ref={(el) => {
                tabRefs.current[name] = el;
              }}
              id={`tab-${name}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${name}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setTab(name)}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${
                active ? 'bg-accent text-accent-fg' : 'text-muted hover:text-fg'
              }`}
            >
              <Icon name={name === 'study' ? 'book' : 'target'} className="size-4" />
              {t(`track.${name}`)}
            </button>
          );
        })}
      </div>

      <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'study' ? (
          <StudyPanel
            key={track.id}
            track={track}
            lessonId={lessonId}
            onLessonChange={setLesson}
            onGoQuiz={() => setTab('quiz')}
          />
        ) : (
          <QuizPanel key={track.id} track={track} onBackToStudy={() => setTab('study')} />
        )}
      </div>
    </div>
  );
}
