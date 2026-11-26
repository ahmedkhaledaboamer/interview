import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../hooks/useApp.jsx';
import { examConfig, getTrack, percent } from '../../utils/quiz.js';
import Icon from '../Icon.jsx';
import ProgressBar from '../ProgressBar.jsx';
import ReviewList from '../ReviewList.jsx';
import ScoreRing from '../ScoreRing.jsx';
import { btn } from '../buttonStyles.js';

export default function ExamResult({ result, onRestart }) {
  const { t, pick } = useApp();
  const ref = useRef(null);
  const { questions, answers, timeUp, isBest } = result;

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const correct = questions.filter((q) => answers[q.id] === q.correct).length;
  const score = percent(correct, questions.length);
  const passed = score >= examConfig.passPercent;

  const byTrack = [];
  for (const q of questions) {
    let row = byTrack.find((r) => r.trackId === q.trackId);
    if (!row) {
      row = { trackId: q.trackId, total: 0, correct: 0 };
      byTrack.push(row);
    }
    row.total++;
    if (answers[q.id] === q.correct) row.correct++;
  }
  byTrack.sort((a, b) => percent(a.correct, a.total) - percent(b.correct, b.total));

  const wrong = questions
    .filter((q) => answers[q.id] !== q.correct)
    .map((q) => ({ question: q, selected: answers[q.id] }));

  return (
    <div className="grid gap-10">
      <section
        ref={ref}
        tabIndex={-1}
        aria-labelledby="exam-result-title"
        className={`flex flex-col items-center gap-8 rounded-[2rem] border bg-card p-8 text-center outline-none motion-safe:animate-fade-up sm:flex-row sm:p-10 sm:text-start ${
          passed ? 'border-ok/40' : 'border-bad/40'
        }`}
      >
        <ScoreRing value={score} tone={passed ? 'ok' : 'bad'} size={168} />
        <div className="flex-1">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-sm font-bold ${
              passed ? 'bg-ok/15 text-ok' : 'bg-bad/15 text-bad'
            }`}
          >
            <Icon name={passed ? 'check' : 'x'} className="size-4" strokeWidth={3} />
            {passed ? t('exam.passed') : t('exam.failed')}
          </span>
          <h2 id="exam-result-title" className="mt-4 text-3xl font-bold sm:text-4xl">
            {t('exam.title')}
          </h2>
          <p className="mt-2 text-muted">
            {t('exam.resultSub', { correct, total: questions.length, pass: examConfig.passPercent })}
          </p>
          {timeUp && (
            <p className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-accent-text">
              <Icon name="clock" className="size-4" />
              {t('exam.timeUp')}
            </p>
          )}
          {isBest && (
            <p className="mt-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-sm font-semibold text-accent-text">
                <Icon name="trophy" className="size-4" />
                {t('quiz.newBest')}
              </span>
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3 sm:justify-start">
            <button type="button" onClick={onRestart} className={btn('primary')}>
              <Icon name="refresh" className="size-4" />
              {t('exam.again')}
            </button>
            <Link to="/" className={btn('ghost')}>
              {t('exam.home')}
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="breakdown-title">
        <h3 id="breakdown-title" className="mb-4 text-2xl font-bold">
          {t('exam.breakdown')}
        </h3>
        <ul className="grid gap-3 sm:grid-cols-2">
          {byTrack.map((row) => {
            const p = percent(row.correct, row.total);
            const name = pick(getTrack(row.trackId)?.name);
            return (
              <li key={row.trackId} className="rounded-2xl border border-line bg-card p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <Link to={`/track/${row.trackId}`} className="font-semibold hover:text-accent-text">
                    {name}
                  </Link>
                  <span className="font-mono text-sm" dir="ltr">
                    <span className={p >= examConfig.passPercent ? 'text-ok' : 'text-bad'}>{p}%</span>
                    <span className="text-muted">
                      {' '}
                      · {row.correct}/{row.total}
                    </span>
                  </span>
                </div>
                <ProgressBar value={p} label={`${name}: ${p}%`} />
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="wrong-title">
        <h3 id="wrong-title" className="mb-4 text-2xl font-bold">
          {t('exam.review')}
        </h3>
        {wrong.length === 0 ? (
          <p className="rounded-3xl border border-ok/40 bg-ok/10 p-5 font-medium">{t('exam.noWrong')}</p>
        ) : (
          <ReviewList items={wrong} showTrack />
        )}
      </section>
    </div>
  );
}
