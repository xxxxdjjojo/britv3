"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

// `matchMedia` returns a live MediaQueryList: every instance for a given query
// reflects the current media state, so reading `.matches` here always returns
// the up-to-date value even though `subscribe` registers its listener on its
// own instance. Mirrors React's canonical `useOnlineStatus` docs example.
function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Returns true when the user has requested reduced motion via their OS
 * accessibility settings. SSR-safe: defaults to false on the server and
 * subscribes to `window.matchMedia` changes on the client.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
