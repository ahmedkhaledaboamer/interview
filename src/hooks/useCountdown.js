import { useEffect, useRef, useState } from 'react';

/**
 * Counts down to an absolute deadline (ms timestamp), so the timer stays accurate
 * even if the tab is throttled. Calls `onExpire` once when time runs out.
 */
export function useCountdown(deadline, onExpire) {
  const [remaining, setRemaining] = useState(() =>
    deadline ? Math.max(0, deadline - Date.now()) : 0,
  );
  const expireRef = useRef(onExpire);

  useEffect(() => {
    expireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!deadline) return undefined;
    let fired = false;
    const tick = () => {
      const left = Math.max(0, deadline - Date.now());
      setRemaining(left);
      if (left === 0 && !fired) {
        fired = true;
        clearInterval(id);
        expireRef.current?.();
      }
    };
    const id = setInterval(tick, 250);
    tick();
    return () => clearInterval(id);
  }, [deadline]);

  return remaining;
}

export function formatTime(ms) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
