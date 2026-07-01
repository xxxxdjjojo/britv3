"use client";

import Script from "next/script";
import { useEffect } from "react";
import { useCookieConsent } from "@/contexts/CookieConsentContext";

// GA4 measurement IDs are public (they ship in the client HTML of every GA site),
// so the TrueDeed property ID is a safe default. Override per-environment with
// NEXT_PUBLIC_GA_MEASUREMENT_ID (e.g. a separate ID for previews).
const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-GCSQS7K9FR";

export function GoogleAnalytics() {
  const { consent } = useCookieConsent();

  // Mirror PostHogProvider: analytics is active unless the user explicitly declines.
  const analyticsAllowed = consent?.analytics !== false;

  // Hard-stop GA if consent is withdrawn after the tag has already loaded.
  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as unknown as Record<string, boolean>)[
      `ga-disable-${GA_MEASUREMENT_ID}`
    ] = !analyticsAllowed;
  }, [analyticsAllowed]);

  if (!GA_MEASUREMENT_ID || !analyticsAllowed) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
