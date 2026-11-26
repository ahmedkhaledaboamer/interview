import { useCallback, useEffect, useState } from 'react';

export function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be full or blocked (private mode); the app keeps working in memory.
  }
}

export function useLocalStorage(key, fallback) {
  const [value, setValue] = useState(() => readStorage(key, fallback));

  useEffect(() => {
    writeStorage(key, value);
  }, [key, value]);

  const reset = useCallback(() => setValue(fallback), [fallback]);

  return [value, setValue, reset];
}
