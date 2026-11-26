import { useApp } from '../../hooks/useApp.jsx';
import { examConfig, examDurationMinutes, totalQuestions, tracks } from '../../utils/quiz.js';
import Icon from '../Icon.jsx';
import { btn } from '../buttonStyles.js';

export default function ExamSetup({ selected, onChange, onStart }) {
  const { t, pick } = useApp();
  const ids = tracks.map((tr) => tr.id).filter((id) => selected.includes(id));
  const count = Math.min(examConfig.questionCount, totalQuestions(ids));
  const minutes = examDurationMinutes(count);

  const toggle = (id) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const facts = [
    { icon: 'target', label: t('exam.questions'), value: count },
    { icon: 'clock', label: t('exam.duration'), value: t('exam.minutes', { n: minutes }) },
    { icon: 'trophy', label: t('exam.pass'), value: `${examConfig.passPercent}%` },
  ];

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div role="group" aria-labelledby="exam-pick-title" className="rounded-3xl border border-line bg-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="exam-pick-title" className="text-xl font-bold">
            {t('exam.pickTracks')}
          </h2>
          <div className="flex gap-2">
            <button type="button" onClick={() => onChange(tracks.map((tr) => tr.id))} className={btn('ghost', 'sm')}>
              {t('exam.all')}
            </button>
            <button type="button" onClick={() => onChange([])} className={btn('subtle', 'sm')}>
              {t('exam.none')}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {tracks.map((tr) => {
            const checked = selected.includes(tr.id);
            return (
              <label
                key={tr.id}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
                  checked ? 'border-accent/50 bg-accent/10' : 'border-line hover:border-line-strong hover:bg-card-2'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(tr.id)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`grid size-6 shrink-0 place-items-center rounded-lg border transition ${
                    checked ? 'border-accent bg-accent text-accent-fg' : 'border-line-strong'
                  }`}
                >
                  {checked && <Icon name="check" className="size-4" strokeWidth={3} />}
                </span>
                <span className="flex-1 font-medium">{pick(tr.name)}</span>
                <span className="font-mono text-xs text-muted">{tr.quiz.length}</span>
              </label>
            );
          })}
        </div>
      </div>

      <aside className="flex flex-col gap-4 rounded-3xl border border-line bg-card p-6 sm:p-8 lg:sticky lg:top-24 lg:self-start">
        <dl className="grid gap-4">
          {facts.map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-accent/12 text-accent-text">
                <Icon name={f.icon} className="size-5" />
              </span>
              <div>
                <dt className="text-xs text-muted">{f.label}</dt>
                <dd className="text-lg font-bold">{f.value}</dd>
              </div>
            </div>
          ))}
        </dl>
        <p className="text-sm text-muted">{t('exam.rules')}</p>
        {ids.length === 0 && (
          <p role="alert" className="text-sm font-medium text-bad">
            {t('exam.pickOne')}
          </p>
        )}
        <button
          type="button"
          disabled={ids.length === 0}
          onClick={() => onStart(ids)}
          className={btn('primary', 'lg', 'w-full')}
        >
          {t('exam.start')}
          <Icon name="arrowRight" className="size-5" />
        </button>
      </aside>
    </div>
  );
}
