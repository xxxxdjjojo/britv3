"use client";

import { useEffect } from "react";

// Fires a development_viewed analytics beacon once per mount. Server-side the
// event lands in development_events and feeds the developer's funnel metrics.
export function DevelopmentViewTracker({
  developmentId,
}: Readonly<{ developmentId: string }>) {
  useEffect(() => {
    let sessionId: string | null = null;
    try {
      sessionId = window.sessionStorage.getItem("nh_sid");
      if (!sessionId) {
        sessionId =
          (window.crypto?.randomUUID?.() ?? `s_${Date.now().toString(36)}`);
        window.sessionStorage.setItem("nh_sid", sessionId);
      }
    } catch {
      // private mode / storage disabled — proceed without a session id
    }

    const controller = new AbortController();
    void fetch("/api/new-homes/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "development_viewed",
        developmentId,
        sessionId,
      }),
      signal: controller.signal,
      keepalive: true,
    }).catch(() => undefined);

    return () => controller.abort();
  }, [developmentId]);

  return null;
}
