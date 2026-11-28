import { useEffect, useId, useRef, useState } from 'react';
import { useApp } from '../hooks/useApp.jsx';
import { buildSrcdoc, RUNNABLE_LANGS, UI_LANGS } from '../playground/sandbox.js';
import { copyText } from './CodeBlock.jsx';
import Icon from './Icon.jsx';
import { btn } from './buttonStyles.js';

const LANG_LABEL = {
  js: 'JavaScript',
  ts: 'TypeScript',
  react: 'React',
  rn: 'React Native',
  python: 'Python',
  php: 'PHP',
  bash: 'Bash',
  sql: 'SQL',
  yaml: 'YAML',
  dockerfile: 'Dockerfile',
  json: 'JSON',
};

const LINE_STYLE = {
  log: 'text-code-fg',
  warn: 'text-[#febc2e]',
  error: 'text-[#ff7b72]',
};

let runCounter = 0;

// Code-looking tokens (brackets, operators, quotes) inside the hint are isolated as LTR
// so they don't get scrambled inside Arabic sentences.
const CODE_TOKEN = /([^\s؀-ۿ]*[[\](){}=<>;'"`|&+*/%!][^\s؀-ۿ]*)/g;
function renderHint(text) {
  return text.split(CODE_TOKEN).map((part, i) =>
    i % 2 === 1 ? (
      <code key={i} dir="ltr" className="rounded bg-card-2 px-1 py-0.5 font-mono text-[0.9em]">
        {part}
      </code>
    ) : (
      part
    ),
  );
}

/** Practical example with an editable, runnable "try it yourself" sandbox. */
export default function Playground({ example, label }) {
  const { t, pick } = useApp();
  const original = example.code;
  const canRun = example.runnable !== false && RUNNABLE_LANGS.includes(example.lang);
  const isUi = UI_LANGS.includes(example.lang);

  const [code, setCode] = useState(original);
  const [editing, setEditing] = useState(false);
  const [run, setRun] = useState(null); // { id, srcdoc }
  const [status, setStatus] = useState('idle'); // idle | loading | running | done
  const [lines, setLines] = useState([]);
  const [height, setHeight] = useState(0);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef(null);
  const textRef = useRef(null);
  const editorId = useId();

  useEffect(() => {
    if (!run) return undefined;
    const onMessage = (e) => {
      const msg = e.data;
      if (!msg || msg.__pg !== run.id || e.source !== iframeRef.current?.contentWindow) return;
      if (msg.type === 'loading') setStatus('loading');
      else if (msg.type === 'ready') setStatus((s) => (s === 'done' ? s : 'running'));
      else if (msg.type === 'done') setStatus('done');
      else if (msg.type === 'height') setHeight(Math.min(Number(msg.text) || 0, 480));
      else setLines((prev) => (prev.length > 500 ? prev : [...prev, { type: msg.type, text: msg.text }]));
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [run]);

  // Plain JS has no explicit end signal; treat it as finished shortly after it starts.
  useEffect(() => {
    if (status !== 'running' || ['python', 'php'].includes(example.lang)) return undefined;
    const timer = setTimeout(() => setStatus('done'), 1500);
    return () => clearTimeout(timer);
  }, [status, example.lang]);

  const startRun = () => {
    runCounter += 1;
    const id = `pg-${Date.now()}-${runCounter}`;
    setLines([]);
    setHeight(0);
    setStatus('loading');
    setRun({ id, srcdoc: buildSrcdoc(example.lang, code, id) });
  };

  const stop = () => {
    setRun(null);
    setStatus('idle');
    setLines((prev) => [...prev, { type: 'warn', text: t('pg.stopped') }]);
  };

  const reset = () => {
    setCode(original);
    setRun(null);
    setStatus('idle');
    setLines([]);
  };

  const openEditor = () => {
    setEditing(true);
    requestAnimationFrame(() => textRef.current?.focus());
  };

  const onCopy = async () => {
    try {
      await copyText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const onKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (canRun) startRun();
      return;
    }
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      const el = e.currentTarget;
      const { selectionStart: s, selectionEnd: end } = el;
      const next = code.slice(0, s) + '  ' + code.slice(end);
      setCode(next);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = s + 2;
      });
    }
  };

  const busy = status === 'loading' || status === 'running';
  const changed = code !== original;
  const rows = Math.min(Math.max(code.split('\n').length + 1, 6), 28);

  return (
    <section aria-label={t('pg.title')} className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent-text">
          <Icon name="terminal" className="size-4" />
          {t('pg.title')}
        </h3>
        <span dir="ltr" className="rounded-full border border-line bg-card-2 px-2.5 py-0.5 font-mono text-xs text-muted">
          {LANG_LABEL[example.lang] ?? example.lang}
        </span>
      </div>

      <div dir="ltr" className="mt-3 overflow-hidden rounded-2xl border border-line bg-code-bg text-code-fg">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
            <span className="ms-2 truncate font-mono text-xs text-white/45">
              {label}
              {editing && changed ? ' •' : ''}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {changed && (
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 hover:bg-white/20 hover:text-white"
              >
                <Icon name="refresh" className="size-3.5" />
                {t('pg.reset')}
              </button>
            )}
            <button
              type="button"
              onClick={onCopy}
              aria-label={t('code.copyLabel')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                copied ? 'bg-accent text-accent-fg' : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
              }`}
            >
              <Icon name={copied ? 'check' : 'copy'} className="size-3.5" />
              <span aria-live="polite">{copied ? t('code.copied') : t('code.copy')}</span>
            </button>
          </div>
        </div>

        {editing ? (
          <>
            <label htmlFor={editorId} className="sr-only">
              {t('pg.editorLabel')}
            </label>
            <textarea
              id={editorId}
              ref={textRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={onKeyDown}
              rows={rows}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              className="block w-full resize-y bg-transparent p-4 font-mono text-[13px] leading-relaxed text-code-fg caret-accent outline-none focus-visible:bg-white/[0.03] sm:p-5 sm:text-sm"
            />
          </>
        ) : (
          <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed sm:p-5 sm:text-sm">
            <code>{code}</code>
          </pre>
        )}
      </div>

      {example.try && (
        <div className="mt-3 flex gap-3 rounded-2xl border border-dashed border-accent/50 bg-accent/5 p-3.5 text-sm sm:text-base">
          <Icon name="target" className="mt-0.5 size-5 text-accent-text" />
          <p>
            <span className="font-bold text-accent-text">{t('pg.tryHint')} </span>
            {renderHint(pick(example.try))}
          </p>
        </div>
      )}

      {canRun ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={startRun} disabled={status === 'loading'} className={btn('primary', 'sm')}>
            <Icon name="play" className="size-4" />
            {t('pg.run')}
          </button>
          {!editing && (
            <button type="button" onClick={openEditor} className={btn('ghost', 'sm')}>
              <Icon name="edit" className="size-4" />
              {t('pg.try')}
            </button>
          )}
          {busy && run && (
            <button type="button" onClick={stop} className={btn('subtle', 'sm')}>
              <Icon name="stop" className="size-4" />
              {t('pg.stop')}
            </button>
          )}
          {editing && <span className="text-xs text-muted">{t('pg.shortcut')}</span>}
        </div>
      ) : (
        <p className="mt-3 flex gap-2 text-sm text-muted">
          <Icon name="alert" className="mt-0.5 size-4" />
          {t('pg.notRunnable')}
        </p>
      )}

      {(run || lines.length > 0) && (
        <div className="mt-3 overflow-hidden rounded-2xl border border-line" aria-live="polite">
          <div className="flex items-center justify-between border-b border-line bg-card-2 px-4 py-2 text-xs font-semibold text-muted">
            <span>{isUi ? t('pg.preview') : t('pg.output')}</span>
            {status === 'loading' && (
              <span className="motion-safe:animate-pulse">{t(`pg.loading.${example.lang}`)}</span>
            )}
          </div>
          {run && (
            <iframe
              key={run.id}
              ref={iframeRef}
              title={t('pg.preview')}
              sandbox="allow-scripts"
              srcDoc={run.srcdoc}
              className={isUi ? 'block w-full border-0 bg-white' : 'hidden'}
              style={isUi ? { height: Math.max(height, 140) } : undefined}
            />
          )}
          {(!isUi || lines.length > 0) && (
            <pre
              dir="ltr"
              className={`max-h-80 overflow-auto bg-code-bg p-4 font-mono text-[13px] leading-relaxed ${isUi ? 'border-t border-white/10' : ''}`}
            >
              {lines.length === 0 ? (
                <span className="text-white/40">{status === 'done' ? t('pg.noOutput') : '…'}</span>
              ) : (
                lines.map((l, i) => (
                  <div key={i} className={`whitespace-pre-wrap break-words ${LINE_STYLE[l.type] ?? LINE_STYLE.log}`}>
                    {l.type === 'error' ? '✖ ' : l.type === 'warn' ? '⚠ ' : ''}
                    {l.text}
                  </div>
                ))
              )}
            </pre>
          )}
        </div>
      )}
    </section>
  );
}
