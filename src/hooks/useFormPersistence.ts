"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ---------------------------------------------------------------------------
// useFormPersistence
//
// Saves form state to localStorage so users don't lose data on session expiry.
//
// Future consumers (not yet wired):
//   - Agent listing create: formName="agent_listing_create"
//   - Landlord compliance upload: formName="landlord_compliance_upload"
//   - Onboarding wizard: formName="onboarding"
// ---------------------------------------------------------------------------

type UseFormPersistenceOptions<T> = Readonly<{
  /** Unique name for this form — used to build the storage key. */
  formName: string;
  /** Authenticated user ID. Falls back to "anon" when null/undefined. */
  userId?: string | null;
  /** Values to use when no saved state is found in localStorage. */
  initialValues: T;
  /** Milliseconds to debounce localStorage writes. Default: 300. */
  debounceMs?: number;
}>;

type UseFormPersistenceReturn<T> = {
  values: T;
  setValues: (updater: T | ((prev: T) => T)) => void;
  clearSaved: () => void;
  /** True when the form was hydrated from a localStorage draft on mount. */
  wasRecovered: boolean;
};

function buildKey(formName: string, userId?: string | null): string {
  const uid = userId ?? "anon";
  return `britestate_form_${formName}_${uid}`;
}

function safeRead<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    // Malformed JSON, private browsing restriction, or any other storage error.
    return null;
  }
}

function safeWrite(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded, private browsing, or security restriction — silently degrade.
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Private browsing or security restriction — silently degrade.
  }
}

export function useFormPersistence<T extends Record<string, unknown>>(
  options: UseFormPersistenceOptions<T>,
): UseFormPersistenceReturn<T> {
  const { formName, userId, initialValues, debounceMs = 300 } = options;

  // Build the storage key once. If userId changes (e.g. sign-in during session)
  // we re-derive on each render via the ref below.
  const key = buildKey(formName, userId);
  const keyRef = useRef(key);
  keyRef.current = key;

  // Hydrate from localStorage on first render (SSR-safe).
  const [values, setValuesState] = useState<T>(() => {
    if (typeof window === "undefined") return initialValues;
    const saved = safeRead<T>(keyRef.current);
    return saved ?? initialValues;
  });

  const [wasRecovered, setWasRecovered] = useState<boolean>(false);

  // After hydration, mark wasRecovered if we found saved state.
  const hasCheckedRef = useRef(false);
  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;
    const saved = safeRead<T>(keyRef.current);
    if (saved !== null) {
      setWasRecovered(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced persist — keeps a timer ref so we can cancel on rapid changes.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      safeWrite(keyRef.current, values);
    }, debounceMs);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [values, debounceMs]);

  const setValues = useCallback((updater: T | ((prev: T) => T)) => {
    setValuesState((prev) =>
      typeof updater === "function" ? (updater as (prev: T) => T)(prev) : updater,
    );
  }, []);

  const clearSaved = useCallback(() => {
    safeRemove(keyRef.current);
    setWasRecovered(false);
  }, []);

  return { values, setValues, clearSaved, wasRecovered };
}
