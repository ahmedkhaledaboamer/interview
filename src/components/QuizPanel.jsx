import { useEffect, useRef, useState } from 'react';
import { useApp } from '../hooks/useApp.jsx';
import { buildTrackQuiz, percent } from '../utils/quiz.js';
import { quizKey } from '../utils/review.js';
import Icon from './Icon.jsx';
import OptionList from './OptionList.jsx';
import ProgressBar from './ProgressBar.jsx';
import ReviewList from './ReviewList.jsx';
import ScoreRing from './ScoreRing.jsx';
import { btn } from './buttonStyles.js';

export default function QuizPanel({ track, onBackToStudy }) {
  const { t, pick, bestScores, recordQuizScore, recordReview } = useApp();
  const [questions, setQuestions] = useState(() => buildTrackQuiz(track));
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const nextRef = useRef(null);
  const headingRef = useRef(null);
  const resultRef = useRef(null);

  const q = questions[index];
  const selected = answers[index];
  const answered = selected !== undefined;
  const isLast = index === questions.length - 1;

  // After answering, move focus to the "next" button so the keyboard flow continues.
  useEffect(() => {
    if (answered) nextRef.current?.focus({ preventScroll: true });
  }, [answered]);

  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  // Focus the new question's heading when moving forward.
  useEffect(() => {
    if (index > 0) headingRef.current?.focus({ preventScroll: true });
  }, [index]);

  if (questions.length === 0) {
    return <p className="rounded-3xl border border-line bg-card p-8 text-muted">{t('quiz.empty')}</p>;
  }

  const select = (i) => {
    if (answered) return;
    recordReview(quizKey(q.id), i === q.correct, { meta: { kind: 'quiz', trackId: q.trackId } });
    setAnswers((a) => {
      const copy = [...a];
      copy[index] = i;
      return copy;
    });
  };

  const next = () => {
    if (!isLast) {
      setIndex((i) => i + 1);
      return;
    }
    const correct = questions.filter((qq, i) => answers[i] === qq.correct).length;
    const score = percent(correct, questions.length);
    const isBest = recordQuizScore(track.id, score);
    setResult({ correct, score, isBest });
  };

  const retry = () => {
    setQuestions(buildTrackQuiz(track));
    setIndex(0);
    setAnswers([]);
    setResult(null);
  };

  if (result) {
    const mistakes = questions
      .map((question, i) => ({ question, selected: answers[i] }))
      .filter((item) => item.selected !== item.question.correct);
    const tone = result.score >= 70 ? 'ok' : result.score >= 40 ? 'accent' : 'bad';

    return (
      <div className="grid gap-8">
        <section
          ref={resultRef}
          tabIndex={-1}
          aria-labelledby="quiz-result-title"
          className="flex flex-col items-center gap-6 rounded-3xl border border-line bg-card p-8 text-center outline-none motion-safe:animate-fade-up sm:flex-row sm:text-start"
        >
          <ScoreRing value={result.score} tone={tone} />
          <div className="flex-1">
            <h2 id="quiz-result-title" className="text-sm font-semibold uppercase tracking-wider text-muted">
              {t('quiz.score')}
            </h2>
            <p className="mt-1 text-3xl font-bold" dir="ltr">
              <bdi>
                {result.correct} / {questions.length}
              </bdi>
            </p>
            <p className="mt-2 text-sm">
              {result.isBest ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 font-semibold text-accent-text">
                  <Icon name="trophy" className="size-4" />
                  {t('quiz.newBest')}
                </span>
              ) : (
                <span className="text-muted">{t('quiz.best', { n: bestScores[track.id] ?? result.score })}</span>
              )}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3 sm:justify-start">
              <button type="button" onClick={retry} className={btn('primary')}>
                <Icon name="refresh" className="size-4" />
                {t('quiz.retry')}
              </button>
              <button type="button" onClick={onBackToStudy} className={btn('ghost')}>
                <Icon name="book" className="size-4" />
                {t('quiz.backStudy')}
              </button>
            </div>
          </div>
        </section>

        <section aria-labelledby="mistakes-title">
          <h3 id="mistakes-title" className="mb-4 text-xl font-bold">
            {t('quiz.mistakes')}
          </h3>
          {mistakes.length === 0 ? (
            <p className="rounded-3xl border border-ok/40 bg-ok/10 p-5 font-medium">{t('quiz.perfect')}</p>
          ) : (
            <ReviewList items={mistakes} />
          )}
        </section>
      </div>
    );
  }

  const isCorrect = answered && selected === q.correct;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-muted">
          {t('quiz.question', { n: index + 1, total: questions.length })}
        </span>
        <span className="font-mono text-xs text-muted" dir="ltr">
          {Math.round((index / questions.length) * 100)}%
        </span>
      </div>
      <ProgressBar value={((index + (answered ? 1 : 0)) / questions.length) * 100} label={t('quiz.question', { n: index + 1, total: questions.length })} />

      <section key={q.id} className="mt-6 rounded-3xl border border-line bg-card p-6 motion-safe:animate-fade-up sm:p-8">
        <h2
          ref={headingRef}
          tabIndex={-1}
          id={`q-${q.id}`}
          className="text-xl font-bold leading-snug outline-none sm:text-2xl"
        >
          <bdi>{pick(q.question)}</bdi>
        </h2>

        <div className="mt-6">
          <OptionList
            options={q.options}
            selected={selected}
            correct={q.correct}
            reveal={answered}
            locked={answered}
            onSelect={select}
            labelledBy={`q-${q.id}`}
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
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button ref={nextRef} type="button" onClick={next} disabled={!answered} className={btn('primary')}>
            {isLast ? t('quiz.finish') : t('quiz.next')}
            <Icon name="arrowRight" className="size-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
