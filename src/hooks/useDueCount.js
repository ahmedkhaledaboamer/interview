import { useMemo } from 'react';
import { dueKeys, resolveKey } from '../utils/review.js';
import { useApp } from './useApp.jsx';

/** Number of review items due today (only ones whose content still exists). */
export function useDueCount() {
  const { reviewQueue } = useApp();
  return useMemo(() => dueKeys(reviewQueue).filter((k) => resolveKey(k)).length, [reviewQueue]);
}
