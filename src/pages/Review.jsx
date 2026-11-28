import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import OptionList from '../components/OptionList.jsx';
import PredictOutput from '../components/PredictOutput.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { btn } from '../components/buttonStyles.js';
import { useApp } from '../hooks/useApp.jsx';
import { prepareQuestion } from '../utils/quiz.js';
import { INTERVALS, SESSION_SIZE, dueKeys, resolveKey, upcoming } from '../utils/review.js';

const EXT = { js: 'js', ts: 'ts', python: 'py', php: 'php' };

function Stat({ value, label }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4 text-center">
      <p className="font-display text-3xl font-bold" dir="ltr">
        <bdi>{value}</bdi>
      </p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}

/** Shows how far an item has climbed through the review boxes. */
function BoxMeter({ box }) {
  const { t } = useApp();
  return (
    <span className="inline-flex items-center gap-1" title={t('review.level', { n: box, total: INTERVALS.length })}>
      {INTERVALS.map((_, i) => (
        <span key={i} className={`h-1.5 w-4 rounded-full ${i < box ? 'bg-accent' : 'bg-line'}`} />
      ))}
      <span className="sr-only">{t('review.level', { n: box, total: INTERVALS.length })}</span>
    </span>
  );
}

function OutcomeNote({ outcome }) {
  const { t } = useApp();
  if (!outcome) return null;
  let text;
  if (outcome.type === 'mastered') text = t('review.mastered');
  else if (outcome.type === 'up') text = t(outcome.inDays === 1 ? 'review.nextTomorrow' : 'review.nextIn', { n: outcome.inDays });
  else text = t('review.again');
  return (
    <p className="mt-3 flex items-center gap-2 text-sm font-medium text-accent-text">
      <Icon name="clock" className="size-4" />
      {text}
    </p>
  );
}

function QuizCard({ entry, onAnswered, answered, outcome, onNext }) {
  const { t, pick } = useApp();
  const q = useMemo(() => prepareQuestion(entry.item, entry.track.id), [entry]);
  const [selected, setSelected] = useState(undefined);
  const nextRef = useRef(null);
  const isCorrect = selected === q.correct;

  useEffect(() => {
    if (answered) nextRef.current?.focus({ preventScroll: true });
  }, [answered]);

  return (
    <>
      <h2 id={`rq-${q.id}`} className="text-xl font-bold leading-snug sm:text-2xl">
        <bdi>{pick(q.question)}</bdi>
      </h2>
      <div className="mt-6">
        <OptionList
          options={q.options}
          selected={selected}
          correct={q.correct}
          reveal={answered}
          locked={answered}
          onSelect={(i) => {
            if (answered) return;
            setSelected(i);
            onAnswered(i === q.correct);
          }}
          labelledBy={`rq-${q.id}`}
        />
      </div>
      <div aria-live="polite" role="status">
        {answered && (
          <div
            className={`mt-6 rounded-2xl border p-4 motion-safe:animate-fade-up ${
              isCorrect ? 'border-ok/40 bg-ok/10' : 'border-bad/40 bg-bad/10'
            }`}
          >
            <p className={`flex items-center gap-2 font-bold ${isCorrect ? 'text-ok' : 'text-bad'}`}>
              <Icon name={isCorrect ? 'check' : 'x'} className="size-5" strokeWidth={3} />
              {isCorrect ? t('quiz.correct') : t('quiz.wrong')}
            </p>
            {!isCorrect && (
              <p className="mt-1 text-sm">
                {t('quiz.answerWas', { answer: '' })}
                <bdi className="font-semibold">{pick(q.options[q.correct])}</bdi>
              </p>
            )}
            <p className="mt-2 text-sm text-muted">{pick(q.explanation)}</p>
            <OutcomeNote outcome={outcome} />
          </div>
        )}
      </div>
      <div className="mt-6 flex justify-end">
        <button ref={nextRef} type="button" onClick={onNext} disabled={!answered} className={btn('primary')}>
          {t('quiz.next')}
          <Icon name="arrowRight" className="size-4" />
        </button>
      </div>
    </>
  );
}

function PredictCard({ entry, onAnswered, answered, outcome, onNext }) {
  const { t, pick } = useApp();
  const { lesson, track } = entry;
  return (
    <>
      <p className="text-sm font-semibold text-accent-text">{t('review.predictTitle')}</p>
      <h2 className="mt-1 text-xl font-bold leading-snug sm:text-2xl">{pick(lesson.title)}</h2>
      <PredictOutput
        example={lesson.example}
        label={`${lesson.id}.${EXT[lesson.example.lang] ?? 'txt'}`}
        onScore={(score, total) => {
          if (!answered) onAnswered(score === total);
        }}
        onNext={onNext}
      />
      <OutcomeNote outcome={outcome} />
      <Link
        to={`/track/${track.id}?lesson=${lesson.id}`}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg"
      >
        <Icon name="book" className="size-4" />
        {t('review.openLesson')}
      </Link>
    </>
  );
}

/** Flashcard for a mock-interview question: answer in your head (or out loud), then reveal and grade yourself. */
function LessonCard({ entry, onAnswered, answered, outcome, onNext }) {
  const { t, pick, lang } = useApp();
  const { lesson, track } = entry;
  const [shown, setShown] = useState(false);
  const answer = lesson.say ?? [lesson.short?.en, ...(lesson.points?.en ?? [])].filter(Boolean).join(' ');
  return (
    <>
      <p className="text-sm font-semibold text-accent-text">{t('review.lessonTitle')}</p>
      <h2 dir="ltr" lang="en" className="mt-1 text-start text-xl font-bold leading-snug sm:text-2xl">
        {lesson.title.en}
      </h2>
      {lang === 'ar' && <p className="mt-1 text-muted">{lesson.title.ar}</p>}
      {!shown ? (
        <>
          <p className="mt-6 text-muted">{t('review.lessonPrompt')}</p>
          <button type="button" onClick={() => setShown(true)} className={btn('primary', 'md', 'mt-4')}>
            {t('review.showAnswer')}
          </button>
        </>
      ) : (
        <div className="mt-6 motion-safe:animate-fade-up">
          {lesson.short && <p className="text-lg font-medium">{pick(lesson.short)}</p>}
          <p dir="ltr" lang="en" className="mt-3 rounded-2xl border border-accent/40 bg-accent/5 p-4 text-start leading-relaxed">
            {answer}
          </p>
          {!answered ? (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="me-2 text-sm font-semibold">{t('review.selfGrade')}</span>
              <button type="button" onClick={() => onAnswered(true)} className={btn('ghost', 'sm')}>
                <Icon name="check" className="size-4" />
                {t('review.knewIt')}
              </button>
              <button type="button" onClick={() => onAnswered(false)} className={btn('ghost', 'sm')}>
                <Icon name="x" className="size-4" />
                {t('review.didntKnow')}
              </button>
            </div>
          ) : (
            <>
              <OutcomeNote outcome={outcome} />
              <div className="mt-6 flex justify-end">
                <button type="button" onClick={onNext} className={btn('primary')}>
                  {t('quiz.next')}
                  <Icon name="arrowRight" className="size-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
      <Link
        to={`/track/${track.id}?lesson=${lesson.id}`}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg"
      >
        <Icon name="book" className="size-4" />
        {t('review.openLesson')}
      </Link>
    </>
  );
}

export default function Review() {
  const { t, pick, reviewQueue, reviewStats, recordReview, finishReviewDay } = useApp();

  // Freeze the session when the page opens, so answering doesn't reshuffle it.
  const [session, setSession] = useState(() =>
    dueKeys(reviewQueue).map(resolveKey).filter(Boolean).slice(0, SESSION_SIZE),
  );
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState([]); // per item: { ok, outcome }
  const headingRef = useRef(null);

  const dueNow = useMemo(() => dueKeys(reviewQueue).map(resolveKey).filter(Boolean).length, [reviewQueue]);
  const next = useMemo(() => upcoming(reviewQueue), [reviewQueue]);
  const finished = session.length > 0 && index >= session.length;

  useEffect(() => {
    if (finished) finishReviewDay();
  }, [finished, finishReviewDay]);

  useEffect(() => {
    if (index > 0) headingRef.current?.focus({ preventScroll: true });
  }, [index]);

  const restart = () => {
    setSession(dueKeys(reviewQueue).map(resolveKey).filter(Boolean).slice(0, SESSION_SIZE));
    setIndex(0);
    setResults([]);
  };

  const header = (
    <div className="mb-8">
      <p className="text-sm font-medium text-accent-text">{t('review.kicker')}</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{t('review.title')}</h1>
      <p className="mt-2 max-w-2xl text-muted">{t('review.sub')}</p>
    </div>
  );

  const stats = (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat value={next.tomorrow} label={t('review.tomorrow')} />
      <Stat value={next.week} label={t('review.week')} />
      <Stat value={reviewStats.streak ?? 0} label={t('review.streak')} />
      <Stat value={reviewStats.mastered ?? 0} label={t('review.masteredCount')} />
    </div>
  );

  // Nothing due today.
  if (session.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-10 pb-20 sm:px-6">
        {header}
        <section className="rounded-3xl border border-line bg-card p-6 text-center sm:p-10">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-ok/15 text-ok">
            <Icon name="check" className="size-7" strokeWidth={3} />
          </span>
          <h2 className="mt-4 text-2xl font-bold">
            {next.total === 0 ? t('review.emptyTitle') : t('review.doneTodayTitle')}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-muted">
            {next.total === 0 ? t('review.emptyBody') : t('review.doneTodayBody')}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/#tracks" className={btn('primary')}>
              <Icon name="book" className="size-4" />
              {t('review.goStudy')}
            </Link>
            <Link to="/exam" className={btn('ghost')}>
              <Icon name="flag" className="size-4" />
              {t('nav.exam')}
            </Link>
          </div>
        </section>
        <div className="mt-6">{stats}</div>
      </div>
    );
  }

  if (finished) {
    const right = results.filter((r) => r?.ok).length;
    return (
      <div className="mx-auto max-w-3xl px-4 pt-10 pb-20 sm:px-6">
        {header}
        <section className="rounded-3xl border border-line bg-card p-6 text-center motion-safe:animate-fade-up sm:p-10">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent/15 text-accent-text">
            <Icon name="trophy" className="size-7" />
          </span>
          <h2 className="mt-4 text-2xl font-bold">{t('review.finishedTitle')}</h2>
          <p className="mt-2 font-display text-3xl font-bold">
            <bdi dir="ltr">{`${right} / ${session.length}`}</bdi>
          </p>
          <p className="mx-auto mt-2 max-w-lg text-muted">{t('review.finishedBody')}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {dueNow > 0 && (
              <button type="button" onClick={restart} className={btn('primary')}>
                <Icon name="refresh" className="size-4" />
                {t('review.more', { n: Math.min(dueNow, SESSION_SIZE) })}
              </button>
            )}
            <Link to="/" className={btn(dueNow > 0 ? 'ghost' : 'primary')}>
              {t('nav.home')}
            </Link>
          </div>
        </section>
        <div className="mt-6">{stats}</div>
      </div>
    );
  }

  const entry = session[index];
  const result = results[index];
  const answered = result !== undefined;
  const box = reviewQueue[entry.key]?.box ?? 0;

  const onAnswered = (ok) => {
    const outcome = recordReview(entry.key, ok, { inReview: true });
    setResults((r) => {
      const copy = [...r];
      copy[index] = { ok, outcome };
      return copy;
    });
  };
  const goNext = () => setIndex((i) => i + 1);

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 pb-20 sm:px-6">
      {header}
      <div className="mb-3 flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-muted">
          {t('quiz.question', { n: index + 1, total: session.length })}
        </span>
        <span className="flex items-center gap-3">
          <span className="rounded-full border border-line bg-card-2 px-2.5 py-0.5 text-xs font-semibold">
            {pick(entry.track.name)}
          </span>
          <BoxMeter box={answered && result.outcome?.type === 'mastered' ? INTERVALS.length : box} />
        </span>
      </div>
      <ProgressBar
        value={((index + (answered ? 1 : 0)) / session.length) * 100}
        label={t('quiz.question', { n: index + 1, total: session.length })}
      />

      <section
        key={entry.key}
        ref={headingRef}
        tabIndex={-1}
        className="mt-6 rounded-3xl border border-line bg-card p-6 outline-none motion-safe:animate-fade-up sm:p-8"
      >
        {entry.kind === 'quiz' ? (
          <QuizCard entry={entry} answered={answered} outcome={result?.outcome} onAnswered={onAnswered} onNext={goNext} />
        ) : entry.kind === 'lesson' ? (
          <LessonCard entry={entry} answered={answered} outcome={result?.outcome} onAnswered={onAnswered} onNext={goNext} />
        ) : (
          <PredictCard entry={entry} answered={answered} outcome={result?.outcome} onAnswered={onAnswered} onNext={goNext} />
        )}
      </section>
    </div>
  );
}
