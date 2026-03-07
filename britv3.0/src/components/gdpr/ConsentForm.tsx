"use client";

import { useCallback, useRef } from "react";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { CONSENT_TYPES } from "@/lib/constants";
import type { ConsentType } from "@/types/gdpr";
import { useConsent } from "@/hooks/useConsent";

/**
 * Consent toggle form for marketing, analytics, and third-party sharing.
 * Used both in registration flow and settings/privacy page.
 */
export function ConsentForm() {
  const { consents, loading, updateConsent } = useConsent();
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );

  const handleToggle = useCallback(
    (type: ConsentType, granted: boolean) => {
      // Debounce auto-save (300ms)
      if (debounceTimers.current[type]) {
        clearTimeout(debounceTimers.current[type]);
      }

      debounceTimers.current[type] = setTimeout(async () => {
        await updateConsent(type, granted);
        toast.success(
          `${granted ? "Enabled" : "Disabled"} ${CONSENT_TYPES.find((t) => t.value === type)?.label ?? type}`,
        );
      }, 300);
    },
    [updateConsent],
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg bg-neutral-100"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Essential cookies -- always on */}
      <div className="flex items-start justify-between gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 size-5 text-brand-primary" />
          <div>
            <p className="font-body text-sm font-medium text-neutral-900">
              Essential Cookies
            </p>
            <p className="font-body text-xs text-neutral-500">
              Required for the website to function. Cannot be disabled.
            </p>
          </div>
        </div>
        <Switch checked disabled aria-label="Essential cookies (always on)" />
      </div>

      {/* Optional consent types */}
      {CONSENT_TYPES.map((consentType) => (
        <div
          key={consentType.value}
          className="flex items-start justify-between gap-4 rounded-lg border border-neutral-200 p-4"
        >
          <div>
            <p className="font-body text-sm font-medium text-neutral-900">
              {consentType.label}
            </p>
            <p className="font-body text-xs text-neutral-500">
              {consentType.description}
            </p>
          </div>
          <Switch
            checked={consents[consentType.value]}
            onCheckedChange={(checked: boolean) =>
              handleToggle(consentType.value, checked)
            }
            aria-label={consentType.label}
          />
        </div>
      ))}
    </div>
  );
}
