"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useConsent } from "@/hooks/useConsent";
import type { ConsentType } from "@/types/gdpr";

const COOKIE_NAME = "brite_cookie_consent";
const COOKIE_VERSION = 1;

type ConsentPrefs = { analytics: boolean; marketing: boolean; third_party: boolean };

type CookieConsentContextValue = {
  consent: ConsentPrefs | null;
  updateConsent: (prefs: Partial<Record<ConsentType, boolean>>) => void;
  openPreferences: () => void;
  isPreferencesOpen: boolean;
  closePreferences: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

function readCookie(): ConsentPrefs | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match.split("=")[1]));
  } catch {
    return null;
  }
}

function writeCookie(prefs: ConsentPrefs) {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
    JSON.stringify({ ...prefs, version: COOKIE_VERSION })
  )}; expires=${expires.toUTCString()}; path=/; SameSite=Lax; Secure`;
}

export function CookieConsentProvider(props: Readonly<{ children: ReactNode }>) {
  // Initialise from cookie on first render (client-side only; readCookie() guards SSR).
  const [consent, setConsent] = useState<ConsentPrefs | null>(() => readCookie());
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  // useConsent is a no-op when no user is authenticated — safe to call unconditionally.
  const { updateConsent: dbUpdateConsent } = useConsent();

  const updateConsent = useCallback(
    (prefs: Partial<Record<ConsentType, boolean>>) => {
      setConsent((prev) => {
        const current: ConsentPrefs = prev ?? {
          analytics: false,
          marketing: false,
          third_party: false,
        };
        const next: ConsentPrefs = { ...current, ...prefs };
        writeCookie(next);
        // Sync to DB for authenticated users — dbUpdateConsent no-ops when not logged in.
        for (const [type, granted] of Object.entries(prefs) as [ConsentType, boolean][]) {
          void dbUpdateConsent(type, granted);
        }
        return next;
      });
    },
    [dbUpdateConsent]
  );

  const openPreferences = useCallback(() => setIsPreferencesOpen(true), []);
  const closePreferences = useCallback(() => setIsPreferencesOpen(false), []);

  const value = useMemo(
    () => ({ consent, updateConsent, openPreferences, isPreferencesOpen, closePreferences }),
    [consent, updateConsent, openPreferences, isPreferencesOpen, closePreferences]
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {props.children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error("useCookieConsent must be used within CookieConsentProvider");
  return ctx;
}
