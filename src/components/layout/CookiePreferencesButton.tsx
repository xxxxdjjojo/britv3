"use client";

import { useCookieConsent } from "@/contexts/CookieConsentContext";
import { footerLinkClasses } from "@/config/navigation";

export function CookiePreferencesButton() {
  const { openPreferences } = useCookieConsent();

  return (
    <button
      type="button"
      onClick={openPreferences}
      className={footerLinkClasses()}
    >
      Cookie Preferences
    </button>
  );
}
