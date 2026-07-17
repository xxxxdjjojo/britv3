import type { SupabaseClient } from "@supabase/supabase-js";

import { getDiagnostics } from "@/services/admin/diagnostics-service";

import {
  type AlertFinding,
  diagnosticsToFindings,
  reconcile,
  uptimeFindings,
} from "./alert-rules";

/**
 * Alert engine (PR 5). Orchestration only — the rules live in alert-rules.ts.
 * The store + email sender are injected so runAlertEngine is pure-ish and
 * unit-testable; the Inngest tick wires the real Supabase-backed store and the
 * Resend-backed sender.
 *
 * Email fires ONLY on the transition to firing (toOpen), so re-running the tick
 * never re-mails an already-open alert — no mail storms.
 */

export type AlertStore = {
  listOpenFingerprints: () => Promise<Set<string>>;
  openAlert: (finding: AlertFinding) => Promise<void>;
  resolveAlert: (fingerprint: string) => Promise<void>;
  touchAlert: (fingerprint: string) => Promise<void>;
};

export type AlertEngineResult = Readonly<{ opened: number; resolved: number; firing: number }>;

export async function runAlertEngine(
  findings: readonly AlertFinding[],
  store: AlertStore,
  sendAlertEmail: (finding: AlertFinding) => Promise<void>,
): Promise<AlertEngineResult> {
  const open = await store.listOpenFingerprints();
  const { toOpen, toResolve, stillFiring } = reconcile(open, findings);

  for (const finding of toOpen) {
    await store.openAlert(finding);
    await sendAlertEmail(finding);
  }
  for (const fingerprint of toResolve) {
    await store.resolveAlert(fingerprint);
  }
  for (const finding of stillFiring) {
    await store.touchAlert(finding.fingerprint);
  }

  return { opened: toOpen.length, resolved: toResolve.length, firing: stillFiring.length };
}

/** Gather findings from every rule over the current DB snapshots. */
export async function gatherFindings(client: SupabaseClient): Promise<AlertFinding[]> {
  const diagnostics = await getDiagnostics(client);
  const findings: AlertFinding[] = [...diagnosticsToFindings(diagnostics)];

  try {
    const { data } = await client
      .from("uptime_checks")
      .select("ok")
      .order("checked_at", { ascending: false })
      .limit(3);
    if (data) findings.push(...uptimeFindings((data as { ok: boolean }[]).map((r) => r.ok)));
  } catch {
    // uptime signal unavailable — the other findings still stand.
  }

  return findings;
}

/** Supabase-backed alert ledger (alert_events). Service-role client. */
export function supabaseAlertStore(client: SupabaseClient): AlertStore {
  return {
    async listOpenFingerprints() {
      const { data } = await client
        .from("alert_events")
        .select("fingerprint")
        .eq("status", "firing");
      return new Set((data ?? []).map((r) => (r as { fingerprint: string }).fingerprint));
    },
    async openAlert(finding) {
      const nowIso = new Date().toISOString();
      await client.from("alert_events").insert({
        rule_key: finding.ruleKey,
        fingerprint: finding.fingerprint,
        severity: finding.severity,
        status: "firing",
        summary: finding.summary,
        details: finding.details,
        first_seen_at: nowIso,
        last_seen_at: nowIso,
        notified_at: nowIso,
      });
    },
    async resolveAlert(fingerprint) {
      await client
        .from("alert_events")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("fingerprint", fingerprint)
        .eq("status", "firing");
    },
    async touchAlert(fingerprint) {
      await client
        .from("alert_events")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("fingerprint", fingerprint)
        .eq("status", "firing");
    },
  };
}
