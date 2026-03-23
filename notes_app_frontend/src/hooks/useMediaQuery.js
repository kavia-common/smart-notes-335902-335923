import { useEffect, useState } from "react";

/**
 * PUBLIC_INTERFACE
 * useMediaQuery
 *
 * Contract:
 * - Input: mediaQuery (string), e.g. "(max-width: 900px)"
 * - Output: boolean (true if query matches)
 * - Errors: none; falls back to false in non-browser contexts
 */
export function useMediaQuery(mediaQuery) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    return window.matchMedia(mediaQuery).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mq = window.matchMedia(mediaQuery);
    const handler = () => setMatches(mq.matches);

    handler();

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }

    // Safari < 14 fallback
    mq.addListener(handler);
    return () => mq.removeListener(handler);
  }, [mediaQuery]);

  return matches;
}
