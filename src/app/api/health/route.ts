/**
 * GET /api/health — public availability probe for the Open Metrics uptime
 * tracker (.github/workflows/uptime-ping.yml inserts each probe result into
 * public.uptime_checks; /metrics computes trailing-30d availability from it).
 *
 * No auth (the proxy already exempts /api/health). Cheap by design: one
 * Supabase REST ping with a 5s timeout (inside pingSupabase). 200 when the
 * database answers, 503 otherwise.
 */

import { pingSupabase } from "@/services/admin/health-service";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
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
