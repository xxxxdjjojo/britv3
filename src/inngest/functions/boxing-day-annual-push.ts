/**
 * Inngest job: Boxing Day annual push (Influence Strategy Phase 3, 3.6).
 *
 * Fires once a year on 26 December at 06:00 UTC — intentionally after
 * Christmas so nobody is deploying or on call.
 *
 * What it does:
 *   1. Fires `truedeed/report-snapshots.refresh-requested` for the current
 *      calendar year, triggering truedeed-report-snapshots to recompute the
 *      annual edition of the Reality Gap and Time-to-Sell reports.
 *   2. Calls revalidatePath on both report pages so the Next.js ISR cache is
 *      purged on the next request. The report pages use ISR / full-route
 *      caching — revalidatePath marks the cache as stale; the CDN will
 *      regenerate on first hit after the snapshot RPCs complete (which
 *      typically takes < 30s). This is sufficient: the Inngest step runs the
 *      event send first, giving the snapshot job a head-start before any real
 *      visitor triggers regeneration.
 */

import { revalidatePath } from "next/cache";

import { inngest } from "@/inngest/client";

export const boxingDayAnnualPush = inngest.createFunction(
  {
    id: "boxing-day-annual-push",
    name: "Boxing Day annual report push",
    retries: 2,
  },
  { cron: "0 6 26 12 *" },
  async ({ step }) => {
    const year = new Date().getFullYear().toString();

    await step.run("send-snapshot-refresh", async () => {
      await inngest.send({
        name: "truedeed/report-snapshots.refresh-requested",
        data: { period: year },
      });
    });

    await step.run("revalidate-report-pages", async () => {
      // Purge ISR cache so the next visitor gets fresh data rather than a
      // stale page from the previous year's snapshot.
      revalidatePath("/reports/reality-gap");
      revalidatePath("/reports/time-to-sell");
    });

    return { status: "dispatched", year };
  },
);
