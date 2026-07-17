import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOpsAlertEmail } from "@/services/email/email-service";
import type { AlertFinding } from "@/services/alerts/alert-rules";
import {
  gatherFindings,
  runAlertEngine,
  supabaseAlertStore,
} from "@/services/alerts/alert-engine-service";

/**
 * Inngest job: production alert engine tick (PR 5).
 *
 * Triggers:
 *   • cron "*​/15 * * * *" — every 15 minutes.
 *   • event "alerts/engine.tick-requested" — manual run.
 *
 * Evaluates the alert rules over current DB snapshots, reconciles against the
 * alert_events ledger (dedup by fingerprint), and emails ops on the transition
 * to firing. Idempotent: re-running opens nothing new and re-mails nothing.
 *
 * NOTE: this engine runs INSIDE the app, so it shares fate with Vercel/Inngest.
 * The "site is completely down" case is covered separately by the dead-man
 * switch in .github/workflows/uptime-ping.yml (an external vantage point).
 */

function alertEmail(finding: AlertFinding): { subject: string; html: string } {
  const tag = finding.severity.toUpperCase();
  return {
    subject: `[TrueDeed ${tag}] ${finding.ruleKey}`,
    html: `<h2>${tag}: ${finding.ruleKey}</h2><p>${finding.summary}</p>`,
  };
}

export const alertEngineTick = inngest.createFunction(
  { id: "alert-engine-tick", name: "Production alert engine tick", retries: 2 },
  [{ cron: "*/15 * * * *" }, { event: "alerts/engine.tick-requested" }],
  async ({ step }) => {
    const admin = createAdminClient();

    const findings = await step.run("gather-findings", () => gatherFindings(admin));

    const result = await step.run("reconcile-and-notify", () =>
      runAlertEngine(findings, supabaseAlertStore(admin), (finding) =>
        sendOpsAlertEmail(alertEmail(finding)).then(() => undefined),
      ),
    );

    return { status: "completed", ...result };
  },
);
