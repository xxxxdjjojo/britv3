import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminPermission } from "@/lib/admin-permissions";

/**
 * Tier-1 audited action registry (production-support PR 8).
 *
 * A Tier-1 action is a known, low-blast-radius remediation an admin (or, later,
 * an AI agent in Recommend mode) can run against a target. Every action is:
 *  - permission-gated (`requiredPermission`),
 *  - previewable without side effects (`preview` — powers Recommend mode),
 *  - audited on execute (success AND failure) via the standard admin-audit path,
 *  - side-effect-scoped to a single target.
 *
 * Actions NEVER return secrets, tokens, or one-time links in `preview`/`execute`
 * results. Anything sensitive (a reset link) is delivered out-of-band (email to
 * the account address) and never surfaced to the caller or the audit log.
 */

export type Tier1TargetType = "user" | "billing_event";

export type Tier1Risk = "low" | "medium" | "high";

/** Runtime context handed to an action. `supabase` is the service-role client. */
export type Tier1ActionContext = Readonly<{
  supabase: SupabaseClient;
  /** Lazy — only billing actions construct Stripe, so non-billing envs stay green. */
  getStripe: () => Stripe;
  /** The target the action operates on (a user id or a billing event id). */
  targetId: string;
  /** The admin performing the action (for audit + system-message attribution). */
  actorId: string;
}>;

/**
 * A dry-run description of what `execute` WOULD do. Safe to show a human or an
 * AI agent. Must contain no secrets — only counts, states, and plain summaries.
 */
export type Tier1Preview = Readonly<{
  /** One-line, human-readable summary of the recommended action. */
  summary: string;
  /** Concrete effects `execute` will produce, as a plain bullet list. */
  effects: readonly string[];
  /** False if the action cannot be undone by simply re-running the inverse. */
  reversible: boolean;
  /** True when a human must approve before execute (destructive / credential). */
  requiresApproval: boolean;
  /** Optional non-sensitive blockers (e.g. "user already verified"). */
  blockers?: readonly string[];
}>;

/** Result of a successful execute. Never carries secrets/links. */
export type Tier1Result = Readonly<{
  summary: string;
}>;

export type Tier1Action = Readonly<{
  key: string;
  label: string;
  description: string;
  requiredPermission: AdminPermission;
  targetType: Tier1TargetType;
  risk: Tier1Risk;
  reversible: boolean;
  /** Dry-run: read-only, no side effects. */
  preview: (ctx: Tier1ActionContext) => Promise<Tier1Preview>;
  /** Perform the side effect. Throws on failure (audited by the caller). */
  execute: (ctx: Tier1ActionContext) => Promise<Tier1Result>;
}>;

/** Thrown by actions for an expected, user-facing failure with an HTTP status. */
export class Tier1ActionError extends Error {
  constructor(
    message: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = "Tier1ActionError";
  }
}
