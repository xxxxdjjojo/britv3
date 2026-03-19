/**
 * Inngest cron: JWT Auth Hook Error Monitor (hourly)
 *
 * Checks jwt_claims_errors table for recent errors.
 * Sends admin alert if errors found.
 */

import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";

export const jwtHookMonitor = inngest.createFunction(
  {
    id: "jwt-hook-monitor",
    name: "Monitor JWT auth hook errors",
  },
  { cron: "0 * * * *" },
  async ({ step }) => {
    const supabase = createAdminClient();

    const errorCount = await step.run("check-errors", async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const { count, error } = await supabase
        .from("jwt_claims_errors")
        .select("id", { count: "exact", head: true })
        .gte("created_at", oneHourAgo);

      if (error) {
        console.error("[jwt-hook-monitor] Failed to query errors:", error);
        return -1;
      }

      return count ?? 0;
    });

    if (errorCount === 0) {
      return { status: "healthy", errors: 0 };
    }

    if (errorCount > 0) {
      await step.run("send-alert", async () => {
        console.error(
          `[jwt-hook-monitor] ALERT: ${errorCount} JWT hook errors in the last hour`,
        );

        const adminEmail = process.env.ADMIN_ALERT_EMAIL ?? "admin@britestate.co.uk";

        try {
          const { Resend } = await import("resend");
          const resend = new Resend(process.env.RESEND_API_KEY);

          await resend.emails.send({
            from: "alerts@britestate.co.uk",
            to: adminEmail,
            subject: `[WARNING] ${errorCount} JWT auth hook errors in last hour`,
            text: [
              `The Supabase auth hook (custom_access_token_hook) has errored ${errorCount} times in the last hour.`,
              "",
              "Impact: Affected users received tokens WITHOUT custom claims (role, plan, is_admin).",
              "Mitigation: The middleware feature flag falls back to DB calls when claims are missing.",
              "",
              "Action: Check the jwt_claims_errors table and Supabase logs.",
              "Query: SELECT * FROM jwt_claims_errors WHERE created_at > now() - interval '1 hour' ORDER BY created_at DESC;",
            ].join("\n"),
          });
        } catch (emailErr) {
          console.error("[jwt-hook-monitor] Failed to send alert:", emailErr);
        }
      });

      await step.run("cleanup-old-errors", async () => {
        const sevenDaysAgo = new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000,
        ).toISOString();

        await supabase
          .from("jwt_claims_errors")
          .delete()
          .lt("created_at", sevenDaysAgo);
      });
    }

    return { status: errorCount > 0 ? "alert_sent" : "query_failed", errors: errorCount };
  },
);
