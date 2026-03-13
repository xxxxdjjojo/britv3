"use client";

import { useCookieConsent } from "@/contexts/CookieConsentContext";

export function CookiePreferencesInlineButton() {
  const { openPreferences } = useCookieConsent();
  return (
    <button
      type="button"
      onClick={openPreferences}
      className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
    >
      Manage Cookie Preferences
    </button>
  );
}
