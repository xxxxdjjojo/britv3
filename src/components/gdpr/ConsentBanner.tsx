"use client";

import { useCallback, useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConsentForm } from "@/components/gdpr/ConsentForm";
import { createClient } from "@/lib/supabase/client";
import { CONSENT_TYPES } from "@/lib/constants";
import type { ConsentType } from "@/types/gdpr";

const CONSENT_STORAGE_KEY = "britestate-consent-given";

/**
 * Bottom cookie consent banner. Shows on first visit if no consent recorded.
 * Provides Accept All, Reject All, and Customize options.
 */
export function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);

  useEffect(() => {
    // Check localStorage for existing consent
    const hasConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!hasConsent) {
      // Delay appearance slightly for smooth slide-up
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsents = useCallback(
    async (consents: Record<ConsentType, boolean>) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Save to database
        const records = (
          Object.entries(consents) as [ConsentType, boolean][]
        ).map(([consentType, granted]) => ({
          user_id: user.id,
          consent_type: consentType,
          granted,
          ip_address: null,
          user_agent: navigator.userAgent,
        }));

        await supabase
          .from("consent_records")
          .upsert(records, { onConflict: "user_id,consent_type" });
      }

      // Always save to localStorage
      localStorage.setItem(CONSENT_STORAGE_KEY, "true");
      setVisible(false);
    },
    [],
  );

  const handleAcceptAll = useCallback(async () => {
    const allGranted = Object.fromEntries(
      CONSENT_TYPES.map((t) => [t.value, true]),
    ) as Record<ConsentType, boolean>;
    await saveConsents(allGranted);
    toast.success("Cookie preferences saved");
  }, [saveConsents]);

  const handleRejectAll = useCallback(async () => {
    const allRejected = Object.fromEntries(
      CONSENT_TYPES.map((t) => [t.value, false]),
    ) as Record<ConsentType, boolean>;
    await saveConsents(allRejected);
    toast.success("Cookie preferences saved");
  }, [saveConsents]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 pb-safe transform transition-transform duration-500 ease-out"
      style={{ transform: visible ? "translateY(0)" : "translateY(100%)" }}
    >
      <div className="border-t border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-900 sm:p-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-start gap-3">
            <Cookie className="mt-0.5 size-5 shrink-0 text-brand-primary" />
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-heading text-base font-semibold text-neutral-900 dark:text-white">
                  Cookie Preferences
                </h3>
                <p className="font-body text-sm text-neutral-600 dark:text-neutral-400">
                  We use cookies to improve your experience. You can choose
                  which cookies you allow.
                </p>
              </div>

              {showCustomize && (
                <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
                  <ConsentForm />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleAcceptAll} size="sm">
                  Accept All
                </Button>
                <Button
                  onClick={() => setShowCustomize(!showCustomize)}
                  variant="outline"
                  size="sm"
                >
                  {showCustomize ? "Close" : "Customize"}
                </Button>
                <Button
                  onClick={handleRejectAll}
                  variant="ghost"
                  size="sm"
                >
                  Reject All
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
