"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePostHog } from "posthog-js/react";
import { getVariant } from "@/components/coming-soon/variants";
import { resolveComingSoonHeadline } from "@/lib/experiments";
import { ComingSoonContent } from "@/components/coming-soon/ComingSoonContent";
import { SocialProof } from "@/components/coming-soon/SocialProof";

const EXPERIMENT_FLAG = "coming_soon_headline";

type ComingSoonExperienceProps = Readonly<{
  count: number;
  referredBy?: string | null;
}>;

async function postExposure(variant: string): Promise<void> {
  try {
    await fetch("/api/experiments/exposure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flag: EXPERIMENT_FLAG, variant }),
      credentials: "include",
    });
  } catch {
    // Telemetry must never break the UI.
  }
}

export function ComingSoonExperience({
  count,
  referredBy,
}: ComingSoonExperienceProps) {
  const posthog = usePostHog();
  // Resolve from PostHog; falls back to control (B) when the flag/client is
  // unavailable, so first paint and the resolved state share B's structure.
  const variantId = useMemo(
    () => resolveComingSoonHeadline(posthog ?? null),
    [posthog],
  );
  const exposureFiredRef = useRef(false);

  useEffect(() => {
    if (exposureFiredRef.current) return;
    exposureFiredRef.current = true;
    void postExposure(variantId);
  }, [variantId]);

  return (
    <div className="flex flex-col items-center gap-12">
      <ComingSoonContent variant={getVariant(variantId)} referredBy={referredBy} />
      <SocialProof count={count} />
    </div>
  );
}
