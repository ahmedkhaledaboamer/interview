import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useApp } from '../hooks/useApp.jsx';
import CodeBlock from './CodeBlock.jsx';
import Icon from './Icon.jsx';
import Playground from './Playground.jsx';
import { btn } from './buttonStyles.js';

const EXT = { js: 'js', ts: 'ts', react: 'jsx', rn: 'jsx', python: 'py', php: 'php', bash: 'sh', sql: 'sql', yaml: 'yml', json: 'json', ini: 'ini', dockerfile: 'Dockerfile' };

function matches(lesson, query, lang) {
  if (!query) return true;
  const q = query.toLowerCase();
  const haystack = [
    lesson.title.en,
    lesson.title.ar,
    lesson.short?.[lang] ?? '',
    ...(lesson.points[lang] ?? []),
    lesson.code ?? '',
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

export default function StudyPanel({ track, lessonId, onLessonChange, onGoQuiz }) {
  const { t, pick, lang, completedSet, toggleLesson } = useApp();
  const [query, setQuery] = useState('');
  const [listOpen, setListOpen] = useState(false);
  const searchId = useId();
  const listId = useId();
  const articleRef = useRef(null);
  const firstRender = useRef(true);

  const lessons = track.lessons;
  const currentIndex = Math.max(
    0,
    lessons.findIndex((l) => l.id === lessonId),
  );
  const lesson = lessons[currentIndex];
  const filtered = useMemo(
    () => lessons.filter((l) => matches(l, query.trim(), lang)),
    [lessons, query, lang],
  );
  const doneCount = lessons.filter((l) => completedSet.has(l.id)).length;
  const allDone = lessons.length > 0 && doneCount === lessons.length;
  const isDone = lesson ? completedSet.has(lesson.id) : false;

  // Move focus to the lesson when it changes so keyboard and screen reader users follow along.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const el = articleRef.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    const top = el.getBoundingClientRect().top;
    if (top < 80 || top > window.innerHeight * 0.6) {
      el.scrollIntoView({ block: 'start' });
    }
  }, [lesson?.id]);

  if (!lesson) return null;

  const go = (delta) => {
    const next = lessons[currentIndex + delta];
    if (next) onLessonChange(next.id);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-8">
      {/* Lesson list (collapsible on small screens) */}
      <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <button
          type="button"
          onClick={() => setListOpen((v) => !v)}
          aria-expanded={listOpen}
          aria-controls={listId}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-3 text-start text-sm font-semibold lg:hidden"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Icon name="book" className="size-4 text-accent-text" />
            <span className="truncate">{t('study.list')}</span>
            <span className="font-mono text-xs text-muted" dir="ltr">
              {currentIndex + 1}/{lessons.length}
            </span>
          </span>
          <Icon name="chevronDown" className={`size-4 transition-transform ${listOpen ? 'rotate-180' : ''}`} />
        </button>

        <div
          id={listId}
          className={`${listOpen ? 'mt-3 block' : 'hidden'} rounded-3xl border border-line bg-card p-4 lg:mt-0 lg:block`}
        >
          <label htmlFor={searchId} className="sr-only">
            {t('study.search')}
          </label>
          <div className="relative">
            <Icon
              name="search"
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            />
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('study.searchPh')}
              className="w-full rounded-full border border-line bg-bg/60 py-2.5 ps-9 pe-4 text-sm text-fg placeholder:text-muted focus:border-accent/60 focus:outline-none focus-visible:outline-2 focus-visible:outline-accent"
            />
          </div>

          <h2 className="mt-4 mb-2 flex items-center justify-between px-2 text-xs font-semibold uppercase tracking-wider text-muted">
            <span>{t('study.list')}</span>
            <span dir="ltr">
              {doneCount}/{lessons.length}
            </span>
          </h2>

          {filtered.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted">{t('study.noResults', { q: query })}</p>
          ) : (
            <ul className="grid max-h-[40vh] gap-1 overflow-y-auto lg:max-h-[calc(100dvh-16rem)]">
              {filtered.map((l, i) => {
                const idx = lessons.indexOf(l);
                const active = l.id === lesson.id;
                const done = completedSet.has(l.id);
                const section = l.section ? pick(l.section) : '';
                const newSection = section && section !== (filtered[i - 1]?.section ? pick(filtered[i - 1].section) : '');
                return (
                  <li key={l.id}>
                    {newSection && (
                      <p className="px-3 pt-3 pb-1 text-xs font-bold text-accent-text">{section}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onLessonChange(l.id);
                        setListOpen(false);
                      }}
                      aria-current={active ? 'true' : undefined}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-start text-sm transition-colors ${
                        active ? 'bg-accent/12 text-fg ring-1 ring-accent/40' : 'text-muted hover:bg-card-2 hover:text-fg'
                      }`}
                    >
                      <span
                        className={`grid size-7 shrink-0 place-items-center rounded-lg font-mono text-xs font-bold ${
                          done ? 'bg-accent text-accent-fg' : active ? 'bg-accent/20 text-accent-text' : 'bg-card-2'
                        }`}
                      >
                        {done ? <Icon name="check" className="size-3.5" strokeWidth={3} /> : idx + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">{pick(l.title)}</span>
                      {done && <span className="sr-only">({t('study.done')})</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Lesson content */}
      <article
        ref={articleRef}
        tabIndex={-1}
        aria-labelledby={`lesson-${lesson.id}`}
        className="min-w-0 scroll-mt-28 rounded-3xl border border-line bg-card p-5 outline-none sm:p-8 lg:p-10"
      >
        <div key={lesson.id} className="motion-safe:animate-fade-up">
          <p className="text-sm font-medium text-accent-text">
            {t('study.lessonOf', { n: currentIndex + 1, total: lessons.length })}
            {lesson.section && <span className="text-muted"> · {pick(lesson.section)}</span>}
          </p>
          <h2 id={`lesson-${lesson.id}`} className="mt-2 text-3xl font-bold sm:text-4xl">
            {pick(lesson.title)}
          </h2>

          {lesson.short && (
            <div className="mt-6 rounded-2xl border border-accent/40 bg-accent/10 p-4 sm:p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-accent-text">{t('study.short')}</p>
              <p className="mt-1 text-lg font-medium leading-relaxed">{pick(lesson.short)}</p>
            </div>
          )}

          {lesson.short && (
            <p className="mt-6 text-xs font-bold uppercase tracking-wider text-muted">{t('study.detailed')}</p>
          )}
          <ul className={`${lesson.short ? 'mt-3' : 'mt-6'} grid gap-4 text-base leading-relaxed sm:text-lg`}>
            {(lesson.points[lang] ?? lesson.points.en).map((point, i) => (
              <li key={i} className="flex gap-3">
                <span aria-hidden="true" className="mt-[0.7em] h-1.5 w-4 shrink-0 rounded-full bg-accent" />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          {lesson.say && lang === 'ar' && (
            <div className="mt-8 rounded-2xl border border-line border-s-4 border-s-accent bg-card-2 p-4 sm:p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-accent-text">{t('study.say')}</p>
              <p dir="ltr" lang="en" className="mt-2 text-start font-sans text-base leading-relaxed sm:text-lg">
                {lesson.say}
              </p>
            </div>
          )}

          {lesson.code && (
            <div className="mt-8">
              <CodeBlock code={lesson.code} label={`${track.id}/${lesson.id}`} />
            </div>
          )}

          {lesson.example && (
            <Playground key={lesson.id} lessonId={lesson.id} trackId={track.id} example={lesson.example} label={`${lesson.id}.${EXT[lesson.example.lang] ?? 'txt'}`} />
          )}

          <div className="mt-8 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => toggleLesson(lesson.id)}
              aria-pressed={isDone}
              className={btn(isDone ? 'primary' : 'ghost', 'md')}
            >
              <Icon name="check" className="size-4" strokeWidth={isDone ? 3 : 2} />
              {isDone ? t('study.isUnderstood') : t('study.understood')}
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => go(-1)}
                disabled={currentIndex === 0}
                className={btn('ghost', 'md', 'flex-1 sm:flex-none')}
              >
                <Icon name="arrowLeft" className="size-4" />
                {t('study.prev')}
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                disabled={currentIndex === lessons.length - 1}
                className={btn('ghost', 'md', 'flex-1 sm:flex-none')}
              >
                {t('study.next')}
                <Icon name="arrowRight" className="size-4" />
              </button>
            </div>
          </div>

          {allDone && (
            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-medium">{t('study.allDone')}</p>
              <button type="button" onClick={onGoQuiz} className={btn('primary', 'sm')}>
                {t('study.goQuiz')}
                <Icon name="arrowRight" className="size-4" />
              </button>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
