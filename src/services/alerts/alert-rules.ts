import type { Diagnostic } from "@/services/admin/diagnostics-service";

/**
 * Pure alert rules (PR 5). Rules turn snapshots into findings; the engine
 * (alert-engine-service) dedupes findings against the open alert_events ledger
 * and emails ops. Everything here is pure + unit-tested.
 *
 * Findings carry ONLY counts/rates in `summary`/`details` — never row contents
 * or PII. This is a hard invariant (a rule that needs a row identity is wrong).
 */

export type AlertSeverity = "info" | "warning" | "critical";

export type AlertFinding = Readonly<{
  ruleKey: string;
  fingerprint: string;
  severity: AlertSeverity;
  summary: string;
  details: Record<string, number | string | null>;
}>;

/**
 * Reuse the diagnostics layer: any diagnostic at warn/critical becomes a
 * finding. This keeps a single source of truth for the DB-derived thresholds
 * (DLQ backlog, email failures, probe staleness, GDPR age).
 */
export function diagnosticsToFindings(diagnostics: readonly Diagnostic[]): AlertFinding[] {
  const findings: AlertFinding[] = [];
  for (const d of diagnostics) {
    if (d.level !== "warn" && d.level !== "critical") continue;
    findings.push({
      ruleKey: d.key,
      fingerprint: d.key,
      severity: d.level === "critical" ? "critical" : "warning",
      summary: `${d.label}: ${d.detail}`,
      details: { value: d.value },
    });
  }
  return findings;
}

/**
 * Uptime consecutive-failure rule over the most-recent probes (newest first).
 * Three failures in a row is a strong "site is down" signal — distinct from the
 * probe-staleness diagnostic (which catches a broken cron).
 */
export function uptimeFindings(recentProbesOkNewestFirst: readonly boolean[]): AlertFinding[] {
  const last3 = recentProbesOkNewestFirst.slice(0, 3);
  if (last3.length === 3 && last3.every((ok) => !ok)) {
    return [
      {
        ruleKey: "uptime.consecutive_failures",
        fingerprint: "uptime.consecutive_failures",
        severity: "critical",
        summary: "The last 3 uptime probes failed — the site may be down.",
        details: { consecutiveFailures: 3 },
      },
    ];
  }
  return [];
}

export type Reconciliation = Readonly<{
  toOpen: AlertFinding[];
  toResolve: string[];
  stillFiring: AlertFinding[];
}>;

/**
 * Decide, given the fingerprints currently firing in the ledger and the fresh
 * findings, what to open (new), resolve (gone), and keep (still firing). This
 * is the idempotency core: re-running with the same findings opens nothing.
 */
export function reconcile(
  openFingerprints: ReadonlySet<string>,
  findings: readonly AlertFinding[],
): Reconciliation {
  const current = new Set(findings.map((f) => f.fingerprint));
  return {
    toOpen: findings.filter((f) => !openFingerprints.has(f.fingerprint)),
    stillFiring: findings.filter((f) => openFingerprints.has(f.fingerprint)),
    toResolve: [...openFingerprints].filter((fp) => !current.has(fp)),
  };
}
