import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import strings from '../i18n/strings.js';
import { readStorage, useLocalStorage, writeStorage } from './useLocalStorage.js';

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

  const resetProgress = useCallback(() => {
    setCompleted([]);
    setBestScores({});
    setBestExam(null);
  }, [setCompleted, setBestScores, setBestExam]);

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
