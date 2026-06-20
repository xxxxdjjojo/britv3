"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = Readonly<{
  propertyId: string;
  initialViewerCount?: number;
  initialSaveCount?: number;
}>;

// ---------------------------------------------------------------------------
// Session ID — persisted per browser session so the view dedupe works
// ---------------------------------------------------------------------------

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return crypto.randomUUID();
  const key = "brite_session_id";
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const fresh = crypto.randomUUID();
  sessionStorage.setItem(key, fresh);
  return fresh;
}

// ---------------------------------------------------------------------------
// SocialProofBadge
// ---------------------------------------------------------------------------

export function SocialProofBadge({
  propertyId,
  initialViewerCount = 0,
  initialSaveCount = 0,
}: Props) {
  const [viewerCount, setViewerCount] = useState<number>(initialViewerCount);
  const [saveCount, setSaveCount] = useState<number>(initialSaveCount);

  // Track whether either badge has become non-zero (for fade-in animation)
  const [viewerVisible, setViewerVisible] = useState<boolean>(
    initialViewerCount > 0,
  );
  const [saveVisible, setSaveVisible] = useState<boolean>(initialSaveCount > 0);

  // Throttle refs — track the last time we accepted a Realtime update
  const lastViewerUpdate = useRef<number>(0);
  const lastSaveUpdate = useRef<number>(0);
  const THROTTLE_MS = 30_000; // 30 seconds

  useEffect(() => {
    const supabase = createClient();
    const sessionId = getOrCreateSessionId();

    // -----------------------------------------------------------------------
    // 1. Fire-and-forget view record
    // -----------------------------------------------------------------------
    void fetch(`/api/properties/${propertyId}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    }).catch(() => {
      // Intentionally ignored — view tracking is best-effort
    });

    // -----------------------------------------------------------------------
    // 2. Realtime: viewer count
    // -----------------------------------------------------------------------
    const viewerChannel: RealtimeChannel = supabase
      .channel(`property_views:${propertyId}`)
      .on(
        "broadcast",
        { event: "viewer_count" },
        (payload: { payload?: { count?: number } }) => {
          const now = Date.now();
          if (now - lastViewerUpdate.current < THROTTLE_MS) return;
          lastViewerUpdate.current = now;

          const next =
            typeof payload.payload?.count === "number"
              ? payload.payload.count
              : null;
          if (next === null) return;

          setViewerCount(next);
          if (next > 0) setViewerVisible(true);
        },
      )
      .subscribe();

    // -----------------------------------------------------------------------
    // 3. Realtime: save count
    // -----------------------------------------------------------------------
    const saveChannel: RealtimeChannel = supabase
      .channel(`property_saves:${propertyId}`)
      .on(
        "broadcast",
        { event: "save_count" },
        (payload: { payload?: { count?: number } }) => {
          const now = Date.now();
          if (now - lastSaveUpdate.current < THROTTLE_MS) return;
          lastSaveUpdate.current = now;

          const next =
            typeof payload.payload?.count === "number"
              ? payload.payload.count
              : null;
          if (next === null) return;

          setSaveCount(next);
          if (next > 0) setSaveVisible(true);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(viewerChannel);
      void supabase.removeChannel(saveChannel);
    };
  }, [propertyId]);

  // Nothing to show — render nothing rather than empty space
  if (!viewerVisible && !saveVisible) return null;

  return (
    <div className="flex flex-wrap gap-2" aria-live="polite" aria-atomic="false">
      {viewerCount > 0 && (
        <span
          className={[
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
            "bg-[color:var(--brand-primary)]/10 text-[color:var(--brand-primary)]",
            "border border-[color:var(--brand-primary)]/20",
            "transition-opacity duration-500",
            viewerVisible ? "opacity-100" : "opacity-0",
          ].join(" ")}
        >
          { }
          <span aria-hidden="true">🔥</span>
          <span>
            {viewerCount} {viewerCount === 1 ? "person" : "people"} viewing now
          </span>
        </span>
      )}

      {saveCount > 0 && (
        <span
          className={[
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
            "bg-[color:var(--brand-secondary)]/10 text-amber-800",
            "border border-[color:var(--brand-secondary)]/30",
            "transition-opacity duration-500",
            saveVisible ? "opacity-100" : "opacity-0",
          ].join(" ")}
        >
          {/* Bookmark icon via inline SVG to avoid Lucide import overhead */}
          <svg
            aria-hidden="true"
            className="size-3 shrink-0"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M5 3a2 2 0 0 0-2 2v16l9-4 9 4V5a2 2 0 0 0-2-2H5Z" />
          </svg>
          <span>{saveCount} saves this week</span>
        </span>
      )}
    </div>
  );
}
