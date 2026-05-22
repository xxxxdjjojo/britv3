// src/app/api/experiments/exposure/route.ts
//
// Memo Pivot v2 — server-side experiment exposure endpoint.
//
// The pricing page POSTs `{ flag, variant }` here once per session per
// experiment. We mirror the call to PostHog server-side so the SSR-rendered
// price experience cannot drift from the captured exposure.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const ExposureSchema = z.object({
  flag: z.string().min(1).max(120),
  variant: z.string().min(1).max(120),
});

interface PostHogServer {
  capture?: (event: { event: string; properties?: Record<string, unknown>; distinctId?: string }) => void;
}

function getPostHogServer(): PostHogServer | null {
  // Lazy-load: the analytics module only exists at runtime in production.
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@/lib/analytics/posthog-server") as {
      posthogServer?: PostHogServer;
    };
    return mod.posthogServer ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = ExposureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { flag, variant } = parsed.data;

  const ph = getPostHogServer();
  if (ph?.capture) {
    try {
      ph.capture({
        event: "$feature_flag_called",
        properties: {
          $feature_flag: flag,
          $feature_flag_response: variant,
        },
      });
    } catch {
      // Telemetry must never break the response.
    }
  }
  return NextResponse.json({ ok: true });
}
