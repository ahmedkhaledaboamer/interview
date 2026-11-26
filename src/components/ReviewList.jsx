import { useApp } from '../hooks/useApp.jsx';
import { getTrack } from '../utils/quiz.js';
import Icon from './Icon.jsx';

/** Lists wrong (or unanswered) questions with the user's answer, the right one and the explanation. */
export default function ReviewList({ items, showTrack = false }) {
  const { t, pick } = useApp();

  return (
    <ol className="grid gap-4">
      {items.map(({ question: q, selected }, idx) => (
        <li
          key={q.id}
          className="rounded-3xl border border-line bg-card p-5 motion-safe:animate-fade-up sm:p-6"
          style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}
        >
          {showTrack && (
            <span className="mb-2 inline-block rounded-full bg-card-2 px-3 py-0.5 text-xs font-semibold text-muted">
              {pick(getTrack(q.trackId)?.name)}
            </span>
          )}
          <p className="font-semibold">
            <bdi>{pick(q.question)}</bdi>
          </p>
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex items-start gap-2 rounded-xl bg-bad/10 px-3 py-2">
              <Icon name="x" className="mt-1 size-4 text-bad" strokeWidth={3} />
              <div>
                <dt className="text-xs font-semibold text-bad">{t('quiz.yourAnswer')}</dt>
                <dd>
                  {selected === null || selected === undefined ? (
                    <span className="text-muted italic">{t('quiz.noAnswer')}</span>
                  ) : (
                    <bdi>{pick(q.options[selected])}</bdi>
                  )}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-ok/10 px-3 py-2">
              <Icon name="check" className="mt-1 size-4 text-ok" strokeWidth={3} />
              <div>
                <dt className="text-xs font-semibold text-ok">{t('quiz.correctAnswer')}</dt>
                <dd>
                  <bdi>{pick(q.options[q.correct])}</bdi>
                </dd>
              </div>
            </div>
          </dl>
          <p className="mt-3 text-sm text-muted">{pick(q.explanation)}</p>
        </li>
      ))}
    </ol>
  );
}
