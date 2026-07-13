import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Deep diagnostics for /admin/system-health (PR 4). These are the DB-derived
 * signals that speed up incident triage — things the shallow health pings can't
 * see: a stale uptime cron, a Stripe DLQ backlog (money), an email-failure
 * spike (deliverability), and GDPR requests nearing the statutory deadline.
 *
 * Privileged: exposed only through /api/admin/diagnostics behind the
 * `view_system_health` permission. The classifiers are pure and unit-tested;
 * getDiagnostics is defensive — a query error yields `unknown`, never a crash,
 * and no row contents (only counts/ages) are returned.
 */

export type DiagnosticLevel = "ok" | "warn" | "critical" | "unknown";

export type Diagnostic = Readonly<{
  key: string;
  label: string;
  level: DiagnosticLevel;
  value: number | null;
  detail: string;
}>;

// ---- Pure classifiers (unit-tested) ---------------------------------------

/** Uptime cron should fire every 15 min; >45 min stale means the cron broke. */
export function classifyProbeStaleness(ageMinutes: number | null): DiagnosticLevel {
  if (ageMinutes === null) return "unknown";
  if (ageMinutes > 45) return "critical";
  if (ageMinutes > 20) return "warn";
  return "ok";
}

/** Any failed Stripe webhook in the DLQ is money-critical. */
export function classifyDlqBacklog(failedCount: number | null): DiagnosticLevel {
  if (failedCount === null) return "unknown";
  return failedCount > 0 ? "critical" : "ok";
}

/** Email failures/bounces in the trailing window — deliverability risk. */
export function classifyEmailFailures(count: number | null): DiagnosticLevel {
  if (count === null) return "unknown";
  if (count >= 20) return "critical";
  if (count >= 5) return "warn";
  return "ok";
}

/** GDPR statutory deadline is 30 days; warn at 20, critical at 25. Null = none open. */
export function classifyGdprAge(oldestOpenDays: number | null): DiagnosticLevel {
  if (oldestOpenDays === null) return "ok";
  if (oldestOpenDays >= 25) return "critical";
  if (oldestOpenDays >= 20) return "warn";
  return "ok";
}

// ---- Data access ----------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;

async function safeCount(
  run: () => Promise<{ count: number | null; error: unknown }>,
): Promise<number | null> {
  try {
    const { count, error } = await run();
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

async function probeStaleness(supabase: SupabaseClient): Promise<Diagnostic> {
  try {
    const { data, error } = await supabase
      .from("uptime_checks")
      .select("checked_at")
      .order("checked_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    const ageMinutes = data?.checked_at
      ? Math.round((Date.now() - new Date(data.checked_at as string).getTime()) / 60000)
      : null;
    return {
      key: "uptime_probe_staleness",
      label: "Uptime probe freshness",
      level: classifyProbeStaleness(ageMinutes),
      value: ageMinutes,
      detail:
        ageMinutes === null
          ? "No uptime probes recorded yet."
          : `Last external probe ${ageMinutes} min ago (cron runs every 15 min).`,
    };
  } catch {
    return unknownDiagnostic("uptime_probe_staleness", "Uptime probe freshness");
  }
}

async function dlqBacklog(supabase: SupabaseClient): Promise<Diagnostic> {
  const failed = await safeCount(async () =>
    supabase
      .from("billing_events")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed"),
  );
  return {
    key: "stripe_dlq_backlog",
    label: "Stripe webhook DLQ",
    level: classifyDlqBacklog(failed),
    value: failed,
    detail:
      failed === null
        ? "Could not read billing_events."
        : `${failed} failed webhook event(s) awaiting attention.`,
  };
}

async function emailFailures(supabase: SupabaseClient): Promise<Diagnostic> {
  const since = new Date(Date.now() - DAY_MS).toISOString();
  const count = await safeCount(async () =>
    supabase
      .from("email_logs")
      .select("id", { count: "exact", head: true })
      .in("status", ["failed", "bounced"])
      .gte("created_at", since),
  );
  return {
    key: "email_failures_24h",
    label: "Email failures (24h)",
    level: classifyEmailFailures(count),
    value: count,
    detail:
      count === null
        ? "Could not read email_logs."
        : `${count} failed/bounced email(s) in the last 24h.`,
  };
}

async function gdprDeadline(supabase: SupabaseClient): Promise<Diagnostic> {
  try {
    const { data, error } = await supabase
      .from("gdpr_requests")
      .select("created_at")
      .in("status", ["pending", "in_progress"])
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    const days = data?.created_at
      ? Math.floor((Date.now() - new Date(data.created_at as string).getTime()) / DAY_MS)
      : null;
    return {
      key: "gdpr_deadline_risk",
      label: "GDPR request age",
      level: classifyGdprAge(days),
      value: days,
      detail:
        days === null
          ? "No open GDPR requests."
          : `Oldest open request is ${days} day(s) old (30-day statutory deadline).`,
    };
  } catch {
    return unknownDiagnostic("gdpr_deadline_risk", "GDPR request age");
  }
}

function unknownDiagnostic(key: string, label: string): Diagnostic {
  return { key, label, level: "unknown", value: null, detail: "Could not evaluate." };
}

/** Run every DB-derived diagnostic. Order is stable for a predictable panel. */
export async function getDiagnostics(supabase: SupabaseClient): Promise<Diagnostic[]> {
  return Promise.all([
    probeStaleness(supabase),
    dlqBacklog(supabase),
    emailFailures(supabase),
    gdprDeadline(supabase),
  ]);
}
