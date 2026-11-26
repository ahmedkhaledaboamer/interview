import { useCallback, useEffect, useRef, useState } from 'react';
import { formatTime, useCountdown } from '../../hooks/useCountdown.js';
import { useApp } from '../../hooks/useApp.jsx';
import { getTrack } from '../../utils/quiz.js';
import ConfirmDialog from '../ConfirmDialog.jsx';
import Icon from '../Icon.jsx';
import OptionList from '../OptionList.jsx';
import ProgressBar from '../ProgressBar.jsx';
import { btn } from '../buttonStyles.js';

export default function ExamRunner({ questions, deadline, onSubmit }) {
  const { t, pick } = useApp();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const headingRef = useRef(null);
  const mounted = useRef(false);

  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const onExpire = useCallback(() => {
    setConfirmOpen(false);
    onSubmit(answersRef.current, true);
  }, [onSubmit]);

  const remaining = useCountdown(deadline, onExpire);
  const lowTime = remaining <= 60_000;

  // Warn before closing or reloading the tab mid-exam.
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = t('exam.leave');
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [t]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
  }, [current]);

  const q = questions[current];
  const answeredCount = Object.keys(answers).length;
  const unanswered = questions.length - answeredCount;

  const select = (i) => setAnswers((a) => ({ ...a, [q.id]: i }));

  const requestSubmit = () => {
    if (unanswered > 0) setConfirmOpen(true);
    else onSubmit(answers, false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem] lg:gap-8">
      {/* Status bar */}
      <div className="sticky top-[7.25rem] z-30 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-3xl border border-line bg-card/90 px-5 py-4 backdrop-blur-xl sm:top-20 lg:col-span-2">
        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-lg font-bold ${
            lowTime ? 'bg-bad/15 text-bad motion-safe:animate-pulse' : 'bg-accent/12 text-accent-text'
          }`}
          role="timer"
          aria-label={`${t('exam.timeLeft')} ${formatTime(remaining)}`}
        >
          <Icon name="clock" className="size-5" />
          <span dir="ltr">{formatTime(remaining)}</span>
        </div>
        <div className="min-w-40 flex-1">
          <p className="mb-1.5 text-sm text-muted">
            {t('exam.answered', { n: answeredCount, total: questions.length })}
          </p>
          <ProgressBar
            value={(answeredCount / questions.length) * 100}
            label={t('exam.answered', { n: answeredCount, total: questions.length })}
          />
        </div>
        <button type="button" onClick={requestSubmit} className={btn('primary')}>
          <Icon name="flag" className="size-4" />
          {t('exam.submit')}
        </button>
      </div>

      {/* Question */}
      <section key={q.id} className="rounded-3xl border border-line bg-card p-6 motion-safe:animate-fade-up sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-medium text-muted">
            {t('quiz.question', { n: current + 1, total: questions.length })}
          </span>
          <span className="rounded-full bg-card-2 px-3 py-0.5 text-xs font-semibold text-muted">
            {pick(getTrack(q.trackId)?.name)}
          </span>
        </div>
        <h2
          ref={headingRef}
          tabIndex={-1}
          id={`exam-q-${q.id}`}
          className="mt-4 text-xl font-bold leading-snug outline-none sm:text-2xl"
        >
          <bdi>{pick(q.question)}</bdi>
        </h2>
        <div className="mt-6">
          <OptionList
            options={q.options}
            selected={answers[q.id]}
            onSelect={select}
            labelledBy={`exam-q-${q.id}`}
          />
        </div>
        <div className="mt-8 flex justify-between gap-3">
          <button
            type="button"
            onClick={() => setCurrent((c) => c - 1)}
            disabled={current === 0}
            className={btn('ghost')}
          >
            <Icon name="arrowLeft" className="size-4" />
            {t('exam.prev')}
          </button>
          {current < questions.length - 1 ? (
            <button type="button" onClick={() => setCurrent((c) => c + 1)} className={btn('primary')}>
              {t('exam.next')}
              <Icon name="arrowRight" className="size-4" />
            </button>
          ) : (
            <button type="button" onClick={requestSubmit} className={btn('primary')}>
              <Icon name="flag" className="size-4" />
              {t('exam.submit')}
            </button>
          )}
        </div>
      </section>

      {/* Navigator */}
      <nav
        aria-label={t('exam.navigator')}
        className="rounded-3xl border border-line bg-card p-5 lg:sticky lg:top-48 lg:self-start"
      >
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">{t('exam.navigator')}</h2>
        <ol className="grid grid-cols-8 gap-2 sm:grid-cols-10 lg:grid-cols-5">
          {questions.map((item, i) => {
            const isCurrent = i === current;
            const isAnswered = answers[item.id] !== undefined;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setCurrent(i)}
                  aria-label={t('exam.goTo', { n: i + 1 })}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`grid aspect-square w-full place-items-center rounded-xl font-mono text-xs font-bold transition ${
                    isAnswered ? 'bg-accent text-accent-fg' : 'bg-card-2 text-muted hover:text-fg'
                  } ${isCurrent ? 'ring-2 ring-fg ring-offset-2 ring-offset-card' : ''}`}
                >
                  {i + 1}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <ConfirmDialog
        open={confirmOpen}
        title={t('exam.confirmTitle')}
        body={t('exam.confirmBody', { n: unanswered })}
        confirmLabel={t('exam.submitAnyway')}
        cancelLabel={t('exam.keepGoing')}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          onSubmit(answers, false);
        }}
      />
    </div>
  );
}
