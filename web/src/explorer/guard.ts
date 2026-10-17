import { useEffect, useRef, useState } from 'react';

const reported = new Set<string>();

/**
 * Run an engine update and keep the explorer alive if it throws: one bad frame (a renderer error,
 * a browser limit) is logged once per kind instead of unmounting the app.
 */
export function guard<T>(what: string, fn: () => T): T | undefined {
  try {
    return fn();
  } catch (err) {
    if (!reported.has(what)) {
      reported.add(what);
      console.error(`connect-the-dot explorer: ${what} failed`, err);
    }
    return undefined;
  }
}

/** `value`, updated at most once per `ms` while it keeps changing, and always to its final value. */
export function useThrottledValue<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  const last = useRef(0);
  useEffect(() => {
    if (Object.is(value, settled)) return;
    const wait = Math.max(0, last.current + ms - performance.now());
    const id = window.setTimeout(() => {
      last.current = performance.now();
      setSettled(value);
    }, wait);
    return () => clearTimeout(id);
  }, [value, settled, ms]);
  return settled;
}
