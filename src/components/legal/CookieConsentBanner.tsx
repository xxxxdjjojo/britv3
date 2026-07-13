"use client";

import { useState } from "react";
import { useCookieConsent } from "@/contexts/CookieConsentContext";
import type { ConsentType } from "@/types/gdpr";
import { X } from "lucide-react";

type Toggle = { type: ConsentType; label: string; description: string };

const TOGGLES: Toggle[] = [
  { type: "analytics", label: "Analytics", description: "Help us understand how the platform is used (PostHog, Google Analytics)." },
  { type: "marketing", label: "Marketing", description: "Enable personalised ads and conversion tracking (Facebook Pixel)." },
  { type: "third_party", label: "Third Party", description: "Third-party features such as embedded maps and payment fraud tools." },
];

export function CookieConsentBanner() {
  const { consent, updateConsent, openPreferences, isPreferencesOpen, closePreferences } =
    useCookieConsent();

  // Local state for the preferences modal toggles
  const [localPrefs, setLocalPrefs] = useState({
    analytics: consent?.analytics ?? false,
    marketing: consent?.marketing ?? false,
    third_party: consent?.third_party ?? false,
  });

  // Sync local prefs when modal opens
  function handleOpenPreferences() {
    setLocalPrefs({
      analytics: consent?.analytics ?? false,
      marketing: consent?.marketing ?? false,
      third_party: consent?.third_party ?? false,
    });
    openPreferences();
  }

  function handleAcceptAll() {
    updateConsent({ analytics: true, marketing: true, third_party: true });
  }

  function handleRejectNonEssential() {
    updateConsent({ analytics: false, marketing: false, third_party: false });
  }

  function handleSavePreferences() {
    updateConsent(localPrefs);
    closePreferences();
  }

  return (
    <>
      {/* Banner — shown only until consent is set */}
      {consent === null && (
        <div
          role="dialog"
          aria-label="Cookie consent"
          className="fixed bottom-0 inset-x-0 z-50 pb-safe border-t border-neutral-200 bg-white shadow-lg"
        >
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-sm text-neutral-600 max-w-2xl">
              We use cookies to improve your experience. Essential cookies are always active.
              You can manage preferences or{" "}
              <button
                type="button"
                onClick={handleOpenPreferences}
                className="underline text-primary hover:text-primary/80"
              >
                read our Cookie Policy
              </button>
              .
            </p>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors min-h-11"
              >
                Reject Non-Essential
              </button>
              <button
                type="button"
                onClick={handleOpenPreferences}
                className="rounded-lg border border-primary px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 transition-colors min-h-11"
              >
                Manage Preferences
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors min-h-11"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Modal — always mounted, visibility controlled by context */}
      {isPreferencesOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cookie preferences"
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
        >
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40"
            onClick={closePreferences}
            aria-hidden="true"
          />

          {/* Modal panel */}
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold font-heading text-neutral-900">
                Cookie Preferences
              </h2>
              <button
                type="button"
                onClick={closePreferences}
                className="rounded-full p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                aria-label="Close preferences"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Essential — always on, locked */}
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <div className="relative inline-flex h-5 w-9 items-center rounded-full bg-primary opacity-60 cursor-not-allowed">
                    <span className="absolute right-1 size-3 rounded-full bg-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Essential</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Required for authentication and security. Cannot be disabled.
                  </p>
                </div>
              </div>

              {/* Configurable toggles */}
              {TOGGLES.map(({ type, label, description }) => (
                <div key={type} className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={localPrefs[type]}
                      onClick={() =>
                        setLocalPrefs((prev) => ({ ...prev, [type]: !prev[type] }))
                      }
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        localPrefs[type] ? "bg-primary" : "bg-neutral-200"
                      }`}
                    >
                      <span
                        className={`absolute size-3 rounded-full bg-white shadow transition-transform ${
                          localPrefs[type] ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{label}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSavePreferences}
                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
