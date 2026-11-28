// Spaced repetition (Leitner boxes).
// A wrong answer puts an item in box 0, due today. Each correct review moves it up one box
// and pushes the next review further out; after the last box the item is "mastered" and leaves the queue.
import { tracks } from './quiz.js';

export const INTERVALS = [1, 3, 7, 14, 30]; // days until the next review, by box
export const SESSION_SIZE = 10;

export function today(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(day, n) {
  const [y, m, d] = day.split('-').map(Number);
  return today(new Date(y, m - 1, d + n));
}

export function daysBetween(from, to) {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  return Math.round((new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1)) / 86400000);
}

/**
 * Returns the next queue state after an answer, plus what happened.
 * `inReview` is true when the answer was given on the review page.
 */
export function schedule(queue, key, ok, inReview, meta = {}) {
  const now = today();
  const prev = queue[key];
  if (!ok) {
    const entry = {
      ...meta,
      ...(prev ?? {}),
      box: 0,
      // Missed during review: try again tomorrow. Missed anywhere else: review it today.
      due: inReview ? addDays(now, 1) : now,
      misses: (prev?.misses ?? 0) + 1,
      added: prev?.added ?? now,
    };
    return { queue: { ...queue, [key]: entry }, outcome: { type: 'reset', inDays: inReview ? 1 : 0 } };
  }
  // Correct answers only matter for items that are in the queue and reviewed on the review page.
  if (!prev || !inReview) return { queue, outcome: null };
  const box = prev.box + 1;
  if (box > INTERVALS.length) {
    const { [key]: _removed, ...rest } = queue;
    return { queue: rest, outcome: { type: 'mastered' } };
  }
  const inDays = INTERVALS[box - 1];
  return {
    queue: { ...queue, [key]: { ...prev, box, due: addDays(now, inDays) } },
    outcome: { type: 'up', inDays },
  };
}

export function dueKeys(queue, day = today()) {
  return Object.entries(queue)
    .filter(([, e]) => e.due <= day)
    .sort(([, a], [, b]) => (a.due === b.due ? a.box - b.box : a.due < b.due ? -1 : 1))
    .map(([k]) => k);
}

export function upcoming(queue, day = today()) {
  let tomorrow = 0;
  let week = 0;
  for (const e of Object.values(queue)) {
    const d = daysBetween(day, e.due);
    if (d === 1) tomorrow++;
    if (d >= 1 && d <= 7) week++;
  }
  return { tomorrow, week, total: Object.keys(queue).length };
}

// --- Resolving queue keys to content -----------------------------------------------------

let index = null;
function buildIndex() {
  const quiz = new Map();
  const lessons = new Map();
  for (const tr of tracks) {
    for (const q of tr.quiz) if (!quiz.has(q.id)) quiz.set(q.id, { item: q, track: tr });
    for (const l of tr.lessons) if (!lessons.has(l.id)) lessons.set(l.id, { lesson: l, track: tr });
  }
  return { quiz, lessons };
}

export const quizKey = (id) => `q:${id}`;
export const predictKey = (lessonId) => `p:${lessonId}`;
export const lessonKey = (lessonId) => `l:${lessonId}`;

/** Turns a queue key into something the review page can show, or null if the content is gone. */
export function resolveKey(key) {
  index ??= buildIndex();
  const [kind, id] = [key.slice(0, 1), key.slice(2)];
  if (kind === 'q') {
    const hit = index.quiz.get(id);
    return hit ? { key, kind: 'quiz', track: hit.track, item: hit.item } : null;
  }
  if (kind === 'l') {
    const hit = index.lessons.get(id);
    return hit ? { key, kind: 'lesson', track: hit.track, lesson: hit.lesson } : null;
  }
  if (kind === 'p') {
    const hit = index.lessons.get(id);
    return hit?.lesson.example ? { key, kind: 'predict', track: hit.track, lesson: hit.lesson } : null;
  }
  return null;
}
