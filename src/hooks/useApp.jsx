import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import strings from '../i18n/strings.js';
import { readStorage, useLocalStorage, writeStorage } from './useLocalStorage.js';
import { schedule, today } from '../utils/review.js';

const AppContext = createContext(null);
const THEME_KEY = 'ip.themeChoice';

const EMPTY_LIST = [];
const EMPTY_OBJ = {};

export function AppProvider({ children }) {
  const [lang, setLang] = useLocalStorage('ip.lang', 'en');
  // Light is the default. The theme is saved only when the user toggles it, so changing the
  // default later still reaches visitors who never picked one. The old 'ip.theme' key stored
  // the previous dark default for everyone, so it is ignored and cleaned up.
  const [theme, setThemeState] = useState(() => readStorage(THEME_KEY, 'light'));
  const setTheme = useCallback((update) => {
    setThemeState((prev) => {
      const next = typeof update === 'function' ? update(prev) : update;
      writeStorage(THEME_KEY, next);
      return next;
    });
  }, []);

  useEffect(() => {
    try {
      window.localStorage.removeItem('ip.theme');
    } catch {
      // Storage unavailable; nothing to clean up.
    }
  }, []);
  const [completed, setCompleted] = useLocalStorage('ip.completed', EMPTY_LIST);
  const [bestScores, setBestScores] = useLocalStorage('ip.bestScores', EMPTY_OBJ);
  const [bestExam, setBestExam] = useLocalStorage('ip.bestExam', null);
  // Spaced-repetition queue: { [key]: { box, due, misses, added, kind, trackId } }
  const [reviewQueue, setReviewQueue] = useLocalStorage('ip.review', EMPTY_OBJ);
  const [reviewStats, setReviewStats] = useLocalStorage('ip.reviewStats', { mastered: 0, streak: 0, lastDay: null });
  // Several answers can be recorded in one tick (e.g. the final exam), so updates chain through a ref.
  const queueRef = useRef(reviewQueue);
  useEffect(() => {
    queueRef.current = reviewQueue;
  }, [reviewQueue]);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0d0d10' : '#faf7f0');
  }, [theme]);

  const t = useCallback(
    (key, vars) => {
      let text = strings[lang]?.[key] ?? strings.en[key] ?? key;
      if (vars) {
        for (const [name, val] of Object.entries(vars)) {
          text = text.replaceAll(`{${name}}`, String(val));
        }
      }
      return text;
    },
    [lang],
  );

  /** Pick the current-language value from a `{ ar, en }` object. */
  const pick = useCallback((obj) => (obj ? (obj[lang] ?? obj.en) : ''), [lang]);

  const completedSet = useMemo(() => new Set(completed), [completed]);

  const toggleLesson = useCallback(
    (id) =>
      setCompleted((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])),
    [setCompleted],
  );

  /** Saves a score if it beats the previous best. Returns true when it is a new best. */
  const recordQuizScore = useCallback(
    (trackId, percent) => {
      const prev = bestScores[trackId];
      const isBest = prev === undefined || percent > prev;
      if (isBest) setBestScores((s) => ({ ...s, [trackId]: percent }));
      return isBest;
    },
    [bestScores, setBestScores],
  );

  const recordExamScore = useCallback(
    (percent) => {
      const isBest = bestExam === null || percent > bestExam;
      if (isBest) setBestExam(percent);
      return isBest;
    },
    [bestExam, setBestExam],
  );

  /**
   * Records an answer for spaced repetition. Wrong answers enter (or restart) the review queue;
   * correct answers on the review page move the item up. Returns what happened, for feedback.
   */
  const recordReview = useCallback(
    (key, ok, { inReview = false, meta } = {}) => {
      const { queue, outcome } = schedule(queueRef.current, key, ok, inReview, meta);
      if (queue !== queueRef.current) {
        queueRef.current = queue;
        setReviewQueue(queue);
      }
      if (outcome?.type === 'mastered') setReviewStats((s) => ({ ...s, mastered: (s.mastered ?? 0) + 1 }));
      return outcome;
    },
    [setReviewQueue, setReviewStats],
  );

  /** Called when a review session ends; keeps the daily streak. */
  const finishReviewDay = useCallback(() => {
    setReviewStats((s) => {
      const day = today();
      if (s.lastDay === day) return s;
      const [y, m, d] = day.split('-').map(Number);
      const yesterday = today(new Date(y, m - 1, d - 1));
      return { ...s, streak: s.lastDay === yesterday ? (s.streak ?? 0) + 1 : 1, lastDay: day };
    });
  }, [setReviewStats]);

  const resetProgress = useCallback(() => {
    setCompleted([]);
    setBestScores({});
    setBestExam(null);
    setReviewQueue({});
    setReviewStats({ mastered: 0, streak: 0, lastDay: null });
  }, [setCompleted, setBestScores, setBestExam, setReviewQueue, setReviewStats]);

  const value = useMemo(
    () => ({
      lang,
      isRtl: lang === 'ar',
      toggleLang: () => setLang((l) => (l === 'ar' ? 'en' : 'ar')),
      theme,
      toggleTheme: () => setTheme((v) => (v === 'dark' ? 'light' : 'dark')),
      t,
      pick,
      completedSet,
      toggleLesson,
      bestScores,
      recordQuizScore,
      bestExam,
      recordExamScore,
      reviewQueue,
      reviewStats,
      recordReview,
      finishReviewDay,
      resetProgress,
    }),
    [
      lang,
      setLang,
      theme,
      setTheme,
      t,
      pick,
      completedSet,
      toggleLesson,
      bestScores,
      recordQuizScore,
      bestExam,
      recordExamScore,
      reviewQueue,
      reviewStats,
      recordReview,
      finishReviewDay,
      resetProgress,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
