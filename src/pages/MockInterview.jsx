import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import ScoreRing from '../components/ScoreRing.jsx';
import { btn } from '../components/buttonStyles.js';
import { useApp } from '../hooks/useApp.jsx';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { speak, useSpeech } from '../hooks/useSpeech.js';
import { modelAnswer, pickQuestions, scoreAnswer, speechSupport } from '../utils/interview.js';
import { tracks } from '../utils/quiz.js';
import { lessonKey } from '../utils/review.js';

const COUNTS = [3, 5, 10];
const TIMES = [60, 120, 180];
const DEFAULTS = { tracks: ['all'], count: 5, seconds: 120, autoRead: true };

const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
        active ? 'border-accent bg-accent/15 text-accent-text' : 'border-line hover:border-line-strong hover:bg-card-2'
      }`}
    >
      {children}
    </button>
  );
}

function Setup({ settings, setSettings, onStart, support }) {
  const { t, pick } = useApp();
  const toggle = (id) =>
    setSettings((s) => ({
      ...s,
      tracks: s.tracks.includes(id) ? s.tracks.filter((x) => x !== id) : [...s.tracks, id],
    }));

  return (
    <div className="grid gap-6">
      {!support.recognition && (
        <p className="flex gap-3 rounded-2xl border border-bad/40 bg-bad/10 p-4 text-sm">
          <Icon name="alert" className="mt-0.5 size-5 text-bad" />
          {t('mock.noSpeech')}
        </p>
      )}
      <section className="rounded-3xl border border-line bg-card p-6 sm:p-8">
        <h2 className="text-lg font-bold">{t('mock.pickTracks')}</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {tracks.map((tr) => (
            <Chip key={tr.id} active={settings.tracks.includes(tr.id)} onClick={() => toggle(tr.id)}>
              {pick(tr.name)}
            </Chip>
          ))}
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-muted">{t('mock.count')}</h3>
            <div className="mt-2 flex gap-2">
              {COUNTS.map((n) => (
                <Chip key={n} active={settings.count === n} onClick={() => setSettings((s) => ({ ...s, count: n }))}>
                  {n}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted">{t('mock.time')}</h3>
            <div className="mt-2 flex gap-2">
              {TIMES.map((n) => (
                <Chip key={n} active={settings.seconds === n} onClick={() => setSettings((s) => ({ ...s, seconds: n }))}>
                  {t('mock.minutes', { n: n / 60 })}
                </Chip>
              ))}
            </div>
          </div>
        </div>

        {support.synthesis && (
          <label className="mt-6 flex cursor-pointer items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={settings.autoRead}
              onChange={(e) => setSettings((s) => ({ ...s, autoRead: e.target.checked }))}
              className="size-4 accent-[var(--accent)]"
            />
            {t('mock.autoRead')}
          </label>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button type="button" onClick={onStart} disabled={settings.tracks.length === 0} className={btn('primary', 'lg')}>
            <Icon name="mic" className="size-5" />
            {t('mock.start')}
          </button>
          {settings.tracks.length === 0 && <span className="text-sm text-muted">{t('mock.pickOne')}</span>}
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-card-2 p-6 text-sm leading-relaxed sm:p-8">
        <h2 className="text-base font-bold">{t('mock.howTitle')}</h2>
        <ol className="mt-3 grid list-decimal gap-1.5 ps-5 text-muted">
          <li>{t('mock.how1')}</li>
          <li>{t('mock.how2')}</li>
          <li>{t('mock.how3')}</li>
          <li>{t('mock.how4')}</li>
        </ol>
      </section>
    </div>
  );
}

function Feedback({ lesson, result, transcript, audioUrl, onRate, rated, spoken }) {
  const { t } = useApp();
  const fillers = Object.entries(result.fillers);
  const wpmNote =
    result.wpm === null ? '' : result.wpm < 100 ? t('mock.wpmSlow') : result.wpm > 170 ? t('mock.wpmFast') : t('mock.wpmGood');
  const tone = result.coverage >= 60 ? 'ok' : result.coverage >= 30 ? 'accent' : 'bad';

  return (
    <div className="mt-6 grid gap-5 motion-safe:animate-fade-up">
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-line bg-card-2 p-5 sm:flex-row sm:items-start">
        <ScoreRing value={result.coverage} tone={tone} />
        <div className="min-w-0 flex-1">
          <h3 className="font-bold">{t('mock.coverage')}</h3>
          <p className="mt-1 text-sm text-muted">{t('mock.coverageHelp')}</p>
          <ul className="mt-3 flex flex-wrap gap-2" dir="ltr">
            {result.hits.map(({ term, hit }) => (
              <li
                key={term}
                className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold ${
                  hit ? 'bg-ok/15 text-ok' : 'bg-card text-muted line-through decoration-bad/60'
                }`}
              >
                {term}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={`grid gap-3 ${spoken ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        <div className="rounded-2xl border border-line p-4">
          <p className="text-xs font-semibold text-muted">{t('mock.words')}</p>
          <p className="mt-1 font-display text-2xl font-bold">{result.wordCount}</p>
        </div>
        {spoken && (
          <div className="rounded-2xl border border-line p-4">
            <p className="text-xs font-semibold text-muted">{t('mock.wpm')}</p>
            <p className="mt-1 font-display text-2xl font-bold">{result.wpm ?? '—'}</p>
            {wpmNote && <p className="mt-1 text-xs text-muted">{wpmNote}</p>}
          </div>
        )}
        <div className="rounded-2xl border border-line p-4">
          <p className="text-xs font-semibold text-muted">{t('mock.fillers')}</p>
          <p className="mt-1 font-display text-2xl font-bold">{fillers.reduce((n, [, c]) => n + c, 0)}</p>
          {fillers.length > 0 && (
            <p className="mt-1 text-xs text-muted" dir="ltr">
              {fillers.map(([f, c]) => `${f} ×${c}`).join(', ')}
            </p>
          )}
        </div>
      </div>

      {audioUrl && (
        <div>
          <p className="mb-2 text-sm font-semibold">{t('mock.listen')}</p>
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-line p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">{t('mock.yourAnswer')}</p>
          <p dir="ltr" lang="en" className="mt-2 text-start leading-relaxed">
            {transcript || <span className="text-muted">—</span>}
          </p>
        </div>
        <div className="rounded-2xl border border-accent/40 bg-accent/5 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-accent-text">{t('mock.modelAnswer')}</p>
          <p dir="ltr" lang="en" className="mt-2 text-start leading-relaxed">
            {modelAnswer(lesson)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-5">
        <span className="me-2 text-sm font-semibold">{t('mock.rateTitle')}</span>
        <button
          type="button"
          onClick={() => onRate(true)}
          aria-pressed={rated === true}
          className={btn(rated === true ? 'primary' : 'ghost', 'sm')}
        >
          <Icon name="check" className="size-4" />
          {t('mock.rateGood')}
        </button>
        <button
          type="button"
          onClick={() => onRate(false)}
          aria-pressed={rated === false}
          className={btn(rated === false ? 'primary' : 'ghost', 'sm')}
        >
          <Icon name="refresh" className="size-4" />
          {t('mock.rateReview')}
        </button>
      </div>
    </div>
  );
}

function QuestionStep({ entry, index, total, settings, support, onDone }) {
  const { t, pick, lang } = useApp();
  const { lesson, track } = entry;
  const speech = useSpeech();
  const [phase, setPhase] = useState('ready'); // ready | answering | review
  const [left, setLeft] = useState(settings.seconds);
  const [typed, setTyped] = useState('');
  const [rated, setRated] = useState(null);
  const startedAt = useRef(0);
  const [elapsed, setElapsed] = useState(0);
  const question = lesson.title.en;

  // Read the question aloud when it appears.
  useEffect(() => {
    if (settings.autoRead && support.synthesis) speak(question);
    return () => window.speechSynthesis?.cancel();
  }, [question, settings.autoRead, support.synthesis]);

  // Countdown while answering.
  useEffect(() => {
    if (phase !== 'answering') return undefined;
    const id = setInterval(() => {
      const secs = Math.round((Date.now() - startedAt.current) / 1000);
      setLeft(settings.seconds - secs);
    }, 250);
    return () => clearInterval(id);
  }, [phase, settings.seconds]);

  const begin = () => {
    window.speechSynthesis?.cancel();
    startedAt.current = Date.now();
    setLeft(settings.seconds);
    setPhase('answering');
    if (support.recognition) speech.start();
  };

  const finish = () => {
    setElapsed(Math.min(settings.seconds, (Date.now() - startedAt.current) / 1000));
    if (support.recognition) speech.stop();
    setPhase('review');
  };

  useEffect(() => {
    if (phase === 'answering' && left <= 0) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, phase]);

  const transcript = support.recognition ? speech.finalText : typed;
  const result = useMemo(
    () => (phase === 'review' ? scoreAnswer(lesson, transcript, elapsed) : null),
    [phase, lesson, transcript, elapsed],
  );

  const low = left <= 15;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-muted">{t('quiz.question', { n: index + 1, total })}</span>
        <span className="rounded-full border border-line bg-card-2 px-2.5 py-0.5 text-xs font-semibold">
          {pick(track.name)}
        </span>
      </div>
      <ProgressBar value={((index + (phase === 'review' ? 1 : 0)) / total) * 100} label={t('quiz.question', { n: index + 1, total })} />

      <section className="mt-6 rounded-3xl border border-line bg-card p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 dir="ltr" lang="en" className="text-start text-2xl font-bold leading-snug sm:text-3xl">
              {question}
            </h2>
            {lang === 'ar' && <p className="mt-2 text-muted">{lesson.title.ar}</p>}
          </div>
          {support.synthesis && (
            <button
              type="button"
              onClick={() => speak(question)}
              aria-label={t('mock.readAloud')}
              title={t('mock.readAloud')}
              className="grid size-11 shrink-0 place-items-center rounded-full border border-line hover:bg-card-2"
            >
              <Icon name="volume" className="size-5" />
            </button>
          )}
        </div>

        {phase === 'ready' && (
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button type="button" onClick={begin} className={btn('primary', 'lg')}>
              <Icon name="mic" className="size-5" />
              {support.recognition ? t('mock.answer') : t('mock.answerTyped')}
            </button>
            <span className="text-sm text-muted">{t('mock.timeLimit', { time: fmtTime(settings.seconds) })}</span>
          </div>
        )}

        {phase === 'answering' && (
          <div className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="flex items-center gap-2 font-semibold text-bad">
                <span className="size-3 rounded-full bg-bad motion-safe:animate-pulse" />
                {support.recognition ? t('mock.listening') : t('mock.typing')}
              </span>
              <span
                dir="ltr"
                className={`font-mono text-2xl font-bold tabular-nums ${low ? 'text-bad' : ''}`}
                role="timer"
                aria-live={low ? 'polite' : 'off'}
              >
                {fmtTime(left)}
              </span>
            </div>
            <ProgressBar value={(left / settings.seconds) * 100} label={t('mock.timeLeft')} className="mt-3" />

            {support.recognition ? (
              <div
                dir="ltr"
                lang="en"
                aria-live="polite"
                className="mt-4 min-h-28 rounded-2xl border border-line bg-bg/60 p-4 text-start leading-relaxed"
              >
                {speech.finalText}
                {speech.interim && <span className="text-muted"> {speech.interim}</span>}
                {!speech.finalText && !speech.interim && <span className="text-muted">{t('mock.speakNow')}</span>}
              </div>
            ) : (
              <textarea
                dir="ltr"
                lang="en"
                autoFocus
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                rows={6}
                aria-label={t('mock.yourAnswer')}
                placeholder={t('mock.typePh')}
                className="mt-4 w-full rounded-2xl border border-line bg-bg/60 p-4 leading-relaxed outline-none focus:border-accent/60"
              />
            )}

            {speech.error && (
              <p className="mt-3 flex gap-2 text-sm text-bad">
                <Icon name="alert" className="mt-0.5 size-4" />
                {t(`mock.err.${speech.error}`)}
              </p>
            )}

            <button type="button" onClick={finish} className={btn('primary', 'md', 'mt-4')}>
              <Icon name="stop" className="size-4" />
              {t('mock.done')}
            </button>
          </div>
        )}

        {phase === 'review' && support.recognition && (
          <details className="mt-6 text-sm">
            <summary className="cursor-pointer text-muted">{t('mock.fixTranscript')}</summary>
            <textarea
              dir="ltr"
              value={speech.finalText}
              onChange={(e) => speech.setFinalText(e.target.value)}
              rows={4}
              className="mt-2 w-full rounded-2xl border border-line bg-bg/60 p-3 outline-none focus:border-accent/60"
            />
          </details>
        )}

        {phase === 'review' && result && (
          <>
            <Feedback
              lesson={lesson}
              result={result}
              transcript={transcript}
              audioUrl={speech.audioUrl}
              rated={rated}
              onRate={setRated}
              spoken={support.recognition}
            />
            <div className="mt-6 flex flex-wrap justify-between gap-3">
              <Link to={`/track/${track.id}?lesson=${lesson.id}`} className={btn('subtle', 'sm')}>
                <Icon name="book" className="size-4" />
                {t('review.openLesson')}
              </Link>
              <button
                type="button"
                onClick={() => onDone({ coverage: result.coverage, wpm: result.wpm, good: rated })}
                className={btn('primary')}
              >
                {index === total - 1 ? t('mock.finish') : t('quiz.next')}
                <Icon name="arrowRight" className="size-4" />
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function Summary({ items, results, onRestart }) {
  const { t, pick } = useApp();
  const avg = Math.round(results.reduce((n, r) => n + r.coverage, 0) / Math.max(1, results.length));
  const toReview = results.filter((r) => r.good === false).length;
  const tone = avg >= 60 ? 'ok' : avg >= 30 ? 'accent' : 'bad';

  return (
    <div className="grid gap-6">
      <section className="flex flex-col items-center gap-6 rounded-3xl border border-line bg-card p-8 text-center sm:flex-row sm:text-start">
        <ScoreRing value={avg} tone={tone} />
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{t('mock.summaryTitle')}</h2>
          <p className="mt-2 text-muted">{t('mock.summaryBody', { avg })}</p>
          {toReview > 0 && <p className="mt-2 text-sm font-medium text-accent-text">{t('mock.addedToReview', { n: toReview })}</p>}
          <div className="mt-5 flex flex-wrap justify-center gap-3 sm:justify-start">
            <button type="button" onClick={onRestart} className={btn('primary')}>
              <Icon name="refresh" className="size-4" />
              {t('mock.again')}
            </button>
            {toReview > 0 && (
              <Link to="/review" className={btn('ghost')}>
                {t('nav.review')}
              </Link>
            )}
          </div>
        </div>
      </section>
      <ol className="grid gap-3">
        {items.map((entry, i) => (
          <li key={entry.lesson.id} className="flex items-center gap-4 rounded-2xl border border-line bg-card p-4">
            <span className="w-12 shrink-0 text-center font-display text-xl font-bold">{results[i]?.coverage ?? 0}%</span>
            <span className="min-w-0 flex-1">
              <span dir="ltr" lang="en" className="block truncate text-start font-medium">
                {entry.lesson.title.en}
              </span>
              <span className="text-xs text-muted">{pick(entry.track.name)}</span>
            </span>
            <Link to={`/track/${entry.track.id}?lesson=${entry.lesson.id}`} className={btn('subtle', 'sm')}>
              <Icon name="book" className="size-4" />
              <span className="sr-only sm:not-sr-only">{t('review.openLesson')}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function MockInterview() {
  const { t, recordReview } = useApp();
  const support = useMemo(speechSupport, []);
  const [settings, setSettings] = useLocalStorage('ip.mock', DEFAULTS);
  const [session, setSession] = useState(null); // { items, index, results }

  const start = () => {
    const items = pickQuestions(settings.tracks, settings.count);
    if (items.length) setSession({ items, index: 0, results: [] });
    window.scrollTo(0, 0);
  };

  const onDone = (res) => {
    const entry = session.items[session.index];
    if (res.good === false) {
      recordReview(lessonKey(entry.lesson.id), false, { meta: { kind: 'lesson', trackId: entry.track.id } });
    }
    setSession((s) => ({ ...s, index: s.index + 1, results: [...s.results, res] }));
    window.scrollTo(0, 0);
  };

  const done = session && session.index >= session.items.length;

  return (
    <div className="mx-auto max-w-4xl px-4 pt-10 pb-20 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-medium text-accent-text">{t('mock.kicker')}</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{t('mock.title')}</h1>
        <p className="mt-2 max-w-2xl text-muted">{t('mock.sub')}</p>
      </div>

      {!session && <Setup settings={settings} setSettings={setSettings} onStart={start} support={support} />}

      {session && !done && (
        <QuestionStep
          key={session.items[session.index].lesson.id}
          entry={session.items[session.index]}
          index={session.index}
          total={session.items.length}
          settings={settings}
          support={support}
          onDone={onDone}
        />
      )}

      {done && <Summary items={session.items} results={session.results} onRestart={() => setSession(null)} />}
    </div>
  );
}
