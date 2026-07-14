import type { SupabaseClient } from "@supabase/supabase-js";

import {
  redactEmail,
  redactExternalId,
  redactFreeText,
  redactName,
  redactPii,
} from "@/lib/observability/redact";
import { getDiagnostics } from "@/services/admin/diagnostics-service";
import { getTicketDetail } from "@/services/admin/support-admin-service";
import { actionsForTarget } from "@/services/admin/tier1-actions/registry";
import type { TicketCategory } from "@/services/support/ticket-service";

/**
 * Triage-packet generator (PR 9).
 *
 * Turns a support ticket + the account's operational state into a single
 * markdown packet that is safe to hand to an LLM in Recommend mode. Every
 * customer-derived value is routed through `@/lib/observability/redact` — free
 * text is stripped, PII is masked, external ids are reduced to a last-4 handle.
 * The packet carries only structural + diagnostic signal (statuses, counts,
 * event types, a Sentry search link), never raw contents.
 */

export type TriagePacketData = Readonly<{
  ticket: Readonly<{
    reference: string;
    subject: string;
    category: string;
    status: string;
    priority: string;
    createdAt: string;
    firstResponseAt: string | null;
    email: string | null;
    name: string | null;
    userId: string | null;
    correlationId: string | null;
  }>;
  messages: readonly Readonly<{
    authorType: string;
    internalNote: boolean;
    body: string;
    createdAt: string;
  }>[];
  emailLogs: readonly Readonly<{
    template: string;
    status: string;
    suppressionReason: string | null;
    errorMessage: string | null;
    recipient: string;
    createdAt: string;
  }>[];
  billingEvents: readonly Readonly<{ eventType: string; processedAt: string }>[];
  subscription: Readonly<{
    status: string;
    planName: string | null;
    priceAmount: number | null;
    currency: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    stripeCustomerId: string | null;
  }> | null;
  auditEntries: readonly Readonly<{ action: string; targetType: string; createdAt: string }>[];
  diagnostics: readonly Readonly<{
    key: string;
    label: string;
    level: string;
    value: number | null;
    detail: string;
  }>[];
  recommendedActions: readonly Readonly<{
    key: string;
    label: string;
    risk: string;
    reversible: boolean;
    requiresApproval: boolean;
  }>[];
  sentrySearchUrl: string | null;
  playbookLinks: readonly Readonly<{ label: string; path: string }>[];
}>;

export type TriagePacket = Readonly<{
  markdown: string;
  correlationId: string | null;
  userId: string | null;
}>;

/** A short, non-identifying handle for an internal user id (last 8 chars). */
function userHandle(userId: string | null): string {
  if (!userId) return "—";
  return `user …${userId.slice(-8)}`;
}

function formatAmount(pence: number | null, currency: string): string {
  if (pence == null) return "—";
  return `${(pence / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

/** Sentry issues search keyed by correlation id. Link only — no data. */
export function buildSentrySearchUrl(correlationId: string | null): string | null {
  if (!correlationId) return null;
  const org = process.env.SENTRY_ORG_SLUG;
  if (!org) return null;
  const project = process.env.SENTRY_PROJECT_SLUG;
  const query = encodeURIComponent(`correlation_id:${correlationId}`);
  const projectPart = project ? `&project=${encodeURIComponent(project)}` : "";
  return `https://${org}.sentry.io/issues/?query=${query}&statsPeriod=14d${projectPart}`;
}

const CATEGORY_PLAYBOOKS: Record<string, readonly { label: string; path: string }[]> = {
  payments: [{ label: "Payments playbooks", path: "docs/support/features/payments" }],
  account: [{ label: "Auth playbooks", path: "docs/support/features/auth" }],
  verification: [{ label: "Auth playbooks", path: "docs/support/features/auth" }],
  listings: [{ label: "Files playbooks", path: "docs/support/features/files" }],
  gdpr: [{ label: "GDPR runbook", path: "docs/runbooks/gdpr-purge-fk-blocked.md" }],
  technical: [{ label: "Infra runbooks", path: "docs/support/runbooks" }],
};

/** Deterministic mapping from ticket category to relevant playbook links. */
export function playbookLinksForCategory(
  category: string,
): readonly { label: string; path: string }[] {
  return CATEGORY_PLAYBOOKS[category] ?? [{ label: "Support runbooks", path: "docs/support/runbooks" }];
}

/** Pure, side-effect-free markdown builder. Every field is pre-redacted here. */
export function buildTriagePacketMarkdown(data: TriagePacketData): string {
  const { ticket } = data;
  const lines: string[] = [];

  lines.push(`# Triage packet — ${ticket.reference}`);
  lines.push("");
  lines.push("> Recommend mode. All customer data is redacted; act only via the audited Tier-1 console.");
  lines.push("");

  lines.push("## Ticket");
  lines.push(`- Reference: ${ticket.reference}`);
  lines.push(`- Category: ${ticket.category}`);
  lines.push(`- Status: ${ticket.status} · Priority: ${ticket.priority}`);
  lines.push(`- Subject: ${redactPii(ticket.subject)}`);
  lines.push(`- Opened: ${ticket.createdAt}`);
  lines.push(`- First response: ${ticket.firstResponseAt ?? "none"}`);
  lines.push("");

  lines.push("## Account");
  if (ticket.userId) {
    lines.push(`- ${userHandle(ticket.userId)}`);
    lines.push(`- Email: ${redactEmail(ticket.email)}`);
    lines.push(`- Name: ${redactName(ticket.name)}`);
  } else {
    lines.push("- No linked account (guest submission).");
  }
  lines.push("");

  lines.push("## Thread (redacted)");
  if (data.messages.length === 0) {
    lines.push("- (no messages)");
  } else {
    for (const m of data.messages) {
      const kind = m.internalNote ? "internal note" : m.authorType;
      lines.push(`- ${m.createdAt} · ${kind}: ${redactFreeText(m.body)}`);
    }
  }
  lines.push("");

  if (ticket.userId) {
    lines.push("## Email delivery");
    if (data.emailLogs.length === 0) {
      lines.push("- (no recent email log entries)");
    } else {
      for (const e of data.emailLogs) {
        const parts = [`${e.createdAt} · ${e.template} → ${e.status}`, `to ${redactEmail(e.recipient)}`];
        if (e.suppressionReason) parts.push(`suppressed: ${redactPii(e.suppressionReason)}`);
        if (e.errorMessage) parts.push(`error: ${redactPii(e.errorMessage)}`);
        lines.push(`- ${parts.join(" · ")}`);
      }
    }
    lines.push("");

    lines.push("## Billing events");
    if (data.billingEvents.length === 0) {
      lines.push("- (no recent billing events)");
    } else {
      for (const b of data.billingEvents) {
        lines.push(`- ${b.processedAt} · ${b.eventType}`);
      }
    }
    lines.push("");

    lines.push("## Subscription");
    if (data.subscription) {
      const s = data.subscription;
      lines.push(`- Status: ${s.status}${s.cancelAtPeriodEnd ? " (cancels at period end)" : ""}`);
      lines.push(`- Plan: ${s.planName ?? "—"} · ${formatAmount(s.priceAmount, s.currency)}`);
      lines.push(`- Renews: ${s.currentPeriodEnd ?? "—"}`);
      lines.push(`- Customer: ${s.stripeCustomerId ? redactExternalId(s.stripeCustomerId) : "—"}`);
    } else {
      lines.push("- No subscription record.");
    }
    lines.push("");

    lines.push("## Recent admin actions");
    if (data.auditEntries.length === 0) {
      lines.push("- (none)");
    } else {
      for (const a of data.auditEntries) {
        lines.push(`- ${a.createdAt} · ${a.action} (${a.targetType})`);
      }
    }
    lines.push("");
  }

  lines.push("## System diagnostics");
  if (data.diagnostics.length === 0) {
    lines.push("- (unavailable)");
  } else {
    for (const d of data.diagnostics) {
      lines.push(`- [${d.level}] ${d.label}: ${d.detail}`);
    }
  }
  lines.push("");

  if (data.recommendedActions.length > 0) {
    lines.push("## Recommended Tier-1 actions");
    lines.push("_Preview and run each from the audited console — never executed from this packet._");
    for (const a of data.recommendedActions) {
      const flags = [`risk ${a.risk}`, a.reversible ? "reversible" : "irreversible"];
      if (a.requiresApproval) flags.push("needs approval");
      lines.push(`- **${a.label}** (\`${a.key}\`) — ${flags.join(", ")}`);
    }
    lines.push("");
  }

  lines.push("## References");
  lines.push(
    `- Sentry: ${data.sentrySearchUrl ?? "not configured (set SENTRY_ORG_SLUG)"}`,
  );
  for (const link of data.playbookLinks) {
    lines.push(`- ${link.label}: \`${link.path}\``);
  }

  return lines.join("\n");
}

const ACCOUNT_QUERY_LIMIT = 10;

/**
 * Gather a ticket's operational context and render the redacted packet.
 * Uses the (service-role) admin client passed by the audited route. Guest
 * tickets skip all account-scoped queries.
 */
export async function generateTriagePacket(
  supabase: SupabaseClient,
  ticketId: string,
): Promise<TriagePacket> {
  const ticket = await getTicketDetail(supabase, ticketId);
  if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

  const userId = ticket.userId;
  const [emailLogs, billingEvents, subscription, auditEntries] = userId
    ? await Promise.all([
        fetchEmailLogs(supabase, userId),
        fetchBillingEvents(supabase, userId),
        fetchSubscription(supabase, userId),
        fetchAuditEntries(supabase, userId),
      ])
    : [[], [], null, []];

  const diagnostics = await getDiagnostics(supabase);

  const recommendedActions = userId
    ? actionsForTarget("user").map((a) => ({
        key: a.key,
        label: a.label,
        risk: a.risk,
        reversible: a.reversible,
        requiresApproval: a.risk === "high",
      }))
    : [];

  const data: TriagePacketData = {
    ticket: {
      reference: ticket.reference,
      subject: ticket.subject,
      category: ticket.category,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.createdAt,
      firstResponseAt: ticket.firstResponseAt,
      email: ticket.email,
      name: ticket.name,
      userId: ticket.userId,
      correlationId: ticket.correlationId,
    },
    messages: ticket.messages.map((m) => ({
      authorType: m.authorType,
      internalNote: m.internalNote,
      body: m.body,
      createdAt: m.createdAt,
    })),
    emailLogs,
    billingEvents,
    subscription,
    auditEntries,
    diagnostics: diagnostics.map((d) => ({
      key: d.key,
      label: d.label,
      level: d.level,
      value: d.value,
      detail: d.detail,
    })),
    recommendedActions,
    sentrySearchUrl: buildSentrySearchUrl(ticket.correlationId),
    playbookLinks: playbookLinksForCategory(ticket.category),
  };

  return {
    markdown: buildTriagePacketMarkdown(data),
    correlationId: ticket.correlationId,
    userId: ticket.userId,
  };
}

async function fetchEmailLogs(
  supabase: SupabaseClient,
  userId: string,
): Promise<TriagePacketData["emailLogs"]> {
  const { data } = await supabase
    .from("email_logs")
    .select("template, status, suppression_reason, error_message, recipient, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(ACCOUNT_QUERY_LIMIT);
  return (data ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    return {
      template: (row.template as string) ?? "",
      status: (row.status as string) ?? "",
      suppressionReason: (row.suppression_reason as string) ?? null,
      errorMessage: (row.error_message as string) ?? null,
      recipient: (row.recipient as string) ?? "",
      createdAt: (row.created_at as string) ?? "",
    };
  });
}

async function fetchBillingEvents(
  supabase: SupabaseClient,
  userId: string,
): Promise<TriagePacketData["billingEvents"]> {
  const { data } = await supabase
    .from("billing_events")
    .select("event_type, processed_at")
    .eq("user_id", userId)
    .order("processed_at", { ascending: false })
    .limit(ACCOUNT_QUERY_LIMIT);
  return (data ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    return {
      eventType: (row.event_type as string) ?? "",
      processedAt: (row.processed_at as string) ?? "",
    };
  });
}

async function fetchSubscription(
  supabase: SupabaseClient,
  userId: string,
): Promise<TriagePacketData["subscription"]> {
  const { data } = await supabase
    .from("subscriptions")
    .select(
      "status, plan_name, price_amount, currency, current_period_end, cancel_at_period_end, stripe_customer_id",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  const row = data as Record<string, unknown>;
  return {
    status: (row.status as string) ?? "inactive",
    planName: (row.plan_name as string) ?? null,
    priceAmount: (row.price_amount as number) ?? null,
    currency: (row.currency as string) ?? "gbp",
    currentPeriodEnd: (row.current_period_end as string) ?? null,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    stripeCustomerId: (row.stripe_customer_id as string) ?? null,
  };
}

async function fetchAuditEntries(
  supabase: SupabaseClient,
  userId: string,
): Promise<TriagePacketData["auditEntries"]> {
  const { data } = await supabase
    .from("admin_audit_log")
    .select("action, target_type, created_at")
    .eq("target_id", userId)
    .order("created_at", { ascending: false })
    .limit(ACCOUNT_QUERY_LIMIT);
  return (data ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    return {
      action: (row.action as string) ?? "",
      targetType: (row.target_type as string) ?? "",
      createdAt: (row.created_at as string) ?? "",
    };
  });
}

// Re-export for callers that map ticket categories to playbooks.
export type { TicketCategory };
