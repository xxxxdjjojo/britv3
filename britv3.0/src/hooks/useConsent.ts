"use client";

import { useCallback, useEffect, useState } from "react";
import type { ConsentType } from "@/types/gdpr";
import { createClient } from "@/lib/supabase/client";
import { CONSENT_TYPES } from "@/lib/constants";

type ConsentState = Record<ConsentType, boolean>;

const DEFAULT_CONSENTS: ConsentState = {
  marketing: false,
  analytics: false,
  third_party: false,
};

/**
 * Client-side hook for managing GDPR consent preferences.
 * Fetches consent records on mount and provides updateConsent for toggling.
 */
export function useConsent() {
  const [consents, setConsents] = useState<ConsentState>(DEFAULT_CONSENTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConsent() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("consent_records")
        .select("consent_type, granted")
        .eq("user_id", user.id);

      if (data && data.length > 0) {
        const mapped = { ...DEFAULT_CONSENTS };
        for (const record of data) {
          const ct = record.consent_type as ConsentType;
          if (CONSENT_TYPES.some((t) => t.value === ct)) {
            mapped[ct] = record.granted;
          }
        }
        setConsents(mapped);
      }

      setLoading(false);
    }

    fetchConsent();
  }, []);

  const updateConsent = useCallback(
    async (type: ConsentType, granted: boolean) => {
      // Optimistic update
      setConsents((prev) => ({ ...prev, [type]: granted }));

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase.from("consent_records").upsert(
        {
          user_id: user.id,
          consent_type: type,
          granted,
          ip_address: null,
          user_agent: navigator.userAgent,
        },
        { onConflict: "user_id,consent_type" },
      );

      if (error) {
        // Revert on error
        setConsents((prev) => ({ ...prev, [type]: !granted }));
      }
    },
    [],
  );

  return { consents, loading, updateConsent };
}
