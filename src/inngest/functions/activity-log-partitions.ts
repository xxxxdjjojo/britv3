/**
 * Inngest cron: activity_log partition maintenance (BRIT-S009).
 *
 * Runs monthly and calls ensure_activity_log_partitions() so the partition
 * window always stays at least 12 months ahead of "now". Without this, inserts
 * fail once the calendar passes the last inline partition (2027-02).
 */

import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/observability/capture-exception";

export const activityLogPartitions = inngest.createFunction(
  { id: "activity-log-partitions", name: "Maintain activity_log partitions" },
  { cron: "0 3 1 * *" }, // 03:00 UTC on the 1st of each month
  async ({ step }) => {
    return step.run("ensure-partitions", async () => {
      const supabase = createAdminClient();
      const { data, error } = await supabase.rpc(
        "ensure_activity_log_partitions",
        { p_months_ahead: 12 },
      );

      if (error) {
        captureException(error, {
          module: "kernel",
          feature: "activity-log-partitions",
          operation: "ensure_activity_log_partitions",
        });
        throw error;
      }

      return { partitionsCreated: data ?? 0 };
    });
  },
);
