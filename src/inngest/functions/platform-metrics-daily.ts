/**
 * Inngest job: nightly Open Metrics snapshot (/metrics — Influence Strategy
 * Phase 2, Campaign 44).
 *
 * Triggers:
 *   • cron "30 2 * * *" — 02:30 UTC daily.
 *   • event "metrics/daily.refresh-requested" — manual refresh.
 *
 * DAY CHOICE: rows are written for the CURRENT UTC date at run time. Every
 * metric is a point-in-time snapshot (or a trailing-30d count), not a per-day
 * delta, so "state as of 02:30 UTC on day D, filed under D" is the honest
 * label. The (metric, day) primary key + upsert make re-runs and manual
 * refreshes idempotent: a later run the same day simply refreshes that day's
 * snapshot.
 *
 * Metrics whose queries fail are omitted by computeDailyMetrics (rendered as
 * gaps on the page) — never fabricated as 0.
 */

import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  computeDailyMetrics,
  upsertDailyMetrics,
  utcDay,
} from "@/services/metrics/platform-metrics-service";

export const platformMetricsDaily = inngest.createFunction(
  {
    id: "platform-metrics-daily",
    name: "Nightly Open Metrics snapshot (/metrics)",
    retries: 3,
  },
  [{ cron: "30 2 * * *" }, { event: "metrics/daily.refresh-requested" }],
  async ({ step }) => {
    const admin = createAdminClient();

    const rows = await step.run("compute-daily-metrics", () => computeDailyMetrics(admin));

    const day = utcDay();
    await step.run("upsert-daily-metrics", async () => {
      await upsertDailyMetrics(admin, day, rows);
      return { day, upserted: rows.length };
    });

    return {
      status: "completed",
      day,
      metrics: rows.map((r) => r.metric),
    };
  },
);
