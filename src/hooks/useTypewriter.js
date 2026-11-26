import { useEffect, useState } from 'react';
import { useReducedMotion } from './useReducedMotion.js';

/**
 * Types each phrase, pauses, deletes it, then moves to the next one.
 * With reduced motion it simply shows the first phrase.
 */
export function useTypewriter(phrases, { typeMs = 70, deleteMs = 35, holdMs = 1800 } = {}) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [length, setLength] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const phrase = phrases[index % phrases.length] ?? '';

  useEffect(() => {
    if (reduced) return undefined;
    let delay = deleting ? deleteMs : typeMs;
    if (!deleting && length === phrase.length) delay = holdMs;
    if (deleting && length === 0) delay = 300;

    const id = setTimeout(() => {
      if (!deleting && length === phrase.length) setDeleting(true);
      else if (deleting && length === 0) {
        setDeleting(false);
        setIndex((i) => (i + 1) % phrases.length);
      } else setLength((l) => l + (deleting ? -1 : 1));
    }, delay);
    return () => clearTimeout(id);
  }, [reduced, deleting, length, phrase, phrases.length, typeMs, deleteMs, holdMs]);

  return reduced ? phrases[0] ?? '' : phrase.slice(0, length);
}
