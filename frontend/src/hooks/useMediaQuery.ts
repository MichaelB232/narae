import { useCallback, useSyncExternalStore } from "react";

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (notify: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", notify);
      return () => mq.removeEventListener("change", notify);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}

// Harus sama dengan --breakpoint-split dan lg (64rem) di index.css / bawaan Tailwind.
export const SPLIT_QUERY = "(min-width: 56rem)";
export const COMFORT_QUERY = "(min-width: 64rem)";
