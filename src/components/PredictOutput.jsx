import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../hooks/useApp.jsx';
import { stripComments } from '../playground/stripComments.js';
import { useRunner } from '../playground/useRunner.js';
import Icon from './Icon.jsx';
import { btn } from './buttonStyles.js';

const MAX_LINES = 15;

// Loose comparison: ignore spaces, quote style and case, so `{ a: 'x' }` matches `{a:"x"}`.
const normalize = (s) =>
  String(s)
    .replace(/^[✖⚠]\s*/, '')
    .toLowerCase()
    .replace(/[\s'"`;]/g, '');

function lineText(l) {
  return l.type === 'error' ? `Error: ${l.text.replace(/^Uncaught (\(in promise\) )?/, '')}` : l.text;
}

/** "Predict the output": the code without its comments, one input per printed line, then a check. */
export default function PredictOutput({ example, label, onExit, onScore, onNext }) {
  const { t } = useApp();
  const runner = useRunner(example.lang);
  const code = useMemo(() => stripComments(example.code, example.lang), [example]);
  const [answers, setAnswers] = useState([]);
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const inputs = useRef([]);
  const { start } = runner;

  useEffect(() => {
    start(example.code);
  }, [start, example.code]);

  const expected = useMemo(
    () => runner.lines.flatMap((l) => lineText(l).split('\n')).slice(0, MAX_LINES),
    [runner.lines],
  );
  const ready = runner.status === 'done';
  const failed = ready && expected.length === 0;

  const results = expected.map((exp, i) => normalize(answers[i] ?? '') === normalize(exp));
  const score = results.filter(Boolean).length;

  const check = () => {
    setChecked(true);
    onScore?.(score, expected.length);
  };

  const retry = () => {
    setAnswers([]);
    setChecked(false);
    setRevealed(false);
    requestAnimationFrame(() => inputs.current[0]?.focus());
  };

  const onKeyDown = (e, i) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (i < expected.length - 1) inputs.current[i + 1]?.focus();
    else if (!checked) check();
  };

  return (
    <div className="mt-3">
      <div dir="ltr" className="overflow-hidden rounded-2xl border border-line bg-code-bg text-code-fg">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
            <span className="ms-2 truncate font-mono text-xs text-white/45">{label}</span>
          </div>
          <span className="rounded-full bg-accent/90 px-2.5 py-0.5 text-xs font-bold text-accent-fg">
            {t('predict.badge')}
          </span>
        </div>
        <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed sm:p-5 sm:text-sm">
          <code>{code}</code>
        </pre>
      </div>

      {runner.iframeProps && <iframe key={runner.runId} title="predict" className="hidden" {...runner.iframeProps} />}

      <div className="mt-3 rounded-2xl border border-line bg-card-2 p-4 sm:p-5">
        {!ready && (
          <p className="text-sm text-muted motion-safe:animate-pulse">{t('predict.preparing')}</p>
        )}

        {failed && <p className="text-sm text-muted">{t('predict.noOutput')}</p>}

        {ready && !failed && (
          <>
            <p className="font-semibold">
              {t(expected.length === 1 ? 'predict.askOne' : 'predict.ask', { n: expected.length })}
            </p>
            {runner.lines.length > MAX_LINES && (
              <p className="mt-1 text-xs text-muted">{t('predict.firstLines', { n: MAX_LINES })}</p>
            )}
            <ol className="mt-3 grid gap-2">
              {expected.map((exp, i) => {
                const ok = results[i];
                return (
                  <li key={i} className="grid gap-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 shrink-0 text-center font-mono text-xs text-muted">{i + 1}</span>
                      <input
                        ref={(el) => (inputs.current[i] = el)}
                        dir="ltr"
                        value={answers[i] ?? ''}
                        onChange={(e) => {
                          const next = [...answers];
                          next[i] = e.target.value;
                          setAnswers(next);
                        }}
                        onKeyDown={(e) => onKeyDown(e, i)}
                        readOnly={checked}
                        autoFocus={i === 0}
                        spellCheck={false}
                        autoComplete="off"
                        aria-label={t('predict.lineLabel', { n: i + 1 })}
                        placeholder={t('predict.placeholder')}
                        className={`min-w-0 flex-1 rounded-xl border bg-card px-3 py-2 font-mono text-sm outline-none focus:border-accent/70 ${
                          checked ? (ok ? 'border-ok/70' : 'border-bad/70') : 'border-line'
                        }`}
                      />
                      {checked && (
                        <Icon
                          name={ok ? 'check' : 'x'}
                          className={`size-5 ${ok ? 'text-ok' : 'text-bad'}`}
                          strokeWidth={3}
                        />
                      )}
                    </div>
                    {((checked && !ok) || revealed) && (
                      <p dir="ltr" className="ms-8 break-words font-mono text-sm text-ok">
                        {exp}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>

            {checked && (
              <p className="mt-4 rounded-xl bg-card px-3 py-2 font-semibold" aria-live="polite">
                {score === expected.length
                  ? t('predict.perfect')
                  : t('predict.score', { score, total: expected.length })}
              </p>
            )}
          </>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {ready && !failed && !checked && (
            <button type="button" onClick={check} className={btn('primary', 'sm')}>
              <Icon name="check" className="size-4" />
              {t('predict.check')}
            </button>
          )}
          {ready && !failed && !checked && !revealed && (
            <button type="button" onClick={() => setRevealed(true)} className={btn('ghost', 'sm')}>
              {t('predict.reveal')}
            </button>
          )}
          {checked && (
            <button type="button" onClick={retry} className={btn('ghost', 'sm')}>
              <Icon name="refresh" className="size-4" />
              {t('predict.retry')}
            </button>
          )}
          {onExit && (
            <button type="button" onClick={onExit} className={btn('subtle', 'sm')}>
              {t('predict.exit')}
            </button>
          )}
          {onNext && (checked || failed) && (
            <button type="button" onClick={onNext} className={btn('primary', 'sm', 'ms-auto')}>
              {t('quiz.next')}
              <Icon name="arrowRight" className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
