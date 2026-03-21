"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { initPostHog } from "@/lib/posthog";
import { useCookieConsent } from "@/contexts/CookieConsentContext";
import { createClient } from "@/lib/supabase/client";

export function PostHogProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const initialized = useRef(false);
  const identified = useRef(false);
  const { consent } = useCookieConsent();

  // Init PostHog only when analytics consent is granted
  useEffect(() => {
    if (!initialized.current && consent?.analytics !== false) {
      initPostHog();
      initialized.current = true;
    }
    if (initialized.current && consent?.analytics === false) {
      posthog.opt_out_capturing();
    }
    if (initialized.current && consent?.analytics === true) {
      posthog.opt_in_capturing();
    }
  }, [consent?.analytics]);

  // Identify user on auth state change
  useEffect(() => {
    if (!initialized.current) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && !identified.current) {
        posthog.identify(user.id, { email: user.email });
        identified.current = true;
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        posthog.identify(session.user.id, { email: session.user.email });
        identified.current = true;
      }
      if (event === "SIGNED_OUT") {
        posthog.reset();
        identified.current = false;
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Track pageviews
  useEffect(() => {
    if (initialized.current) {
      posthog.capture("$pageview");
    }
  }, [pathname]);

  return <>{children}</>;
}
