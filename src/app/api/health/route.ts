/**
 * GET /api/health — public availability probe for the Open Metrics uptime
 * tracker (.github/workflows/uptime-ping.yml inserts each probe result into
 * public.uptime_checks; /metrics computes trailing-30d availability from it).
 *
 * No auth (the proxy already exempts /api/health). Cheap by design: one
 * Supabase REST ping with a 5s timeout (inside pingSupabase). 200 when the
 * database answers, 503 otherwise. Rate-limited per IP so the endpoint can't
 * be used to amplify traffic onto the Supabase REST layer. The response
 * deliberately exposes ONLY { ok, latencyMs, ts } — never spread the
 * ServiceStatus object (its error strings are internal).
 */

import type { NextRequest } from "next/server";

import { createRateLimiter } from "@/lib/cache/redis";
import { pingSupabase } from "@/services/admin/health-service";

export const dynamic = "force-dynamic";

// 60/min covers the 15-minute Actions cron and any human curiosity.
const healthLimiter = createRateLimiter(60, "1 m");

export async function GET(request: NextRequest): Promise<Response> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const rl = await healthLimiter.limit(`health:${ip}`);
  if (!rl.success) {
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Cache-Control": "no-store" } },
    );
  }

  const db = await pingSupabase();
  const ok = db.status === "up";

  return Response.json(
    { ok, latencyMs: db.latencyMs, ts: new Date().toISOString() },
    {
      status: ok ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
