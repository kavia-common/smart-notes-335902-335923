import { useEffect, useRef } from "react";

/**
 * PUBLIC_INTERFACE
 * useDebouncedEffect
 *
 * Runs the provided effect function after a debounce delay whenever dependencies change.
 *
 * Contract:
 * - Inputs:
 *   - effect: () => void | (() => void)
 *   - delayMs: number
 *   - deps: any[] (dependency array)
 * - Output: none
 * - Side effects: schedules a timer; calls effect after delay.
 */
export function useDebouncedEffect(effect, delayMs, deps) {
  const cleanupRef = useRef(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (typeof cleanupRef.current === "function") {
        cleanupRef.current();
      }
      cleanupRef.current = effect() || null;
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    return () => {
      if (typeof cleanupRef.current === "function") {
        cleanupRef.current();
      }
    };
  }, []);
}
