import type { Tier1Action } from "./types";
import { resendVerificationEmail } from "./resend-verification-email";
import { regenerateResetLink } from "./regenerate-reset-link";
import { replayDlqWebhook } from "./replay-dlq-webhook";
import { restoreEntitlementFromStripe } from "./restore-entitlement-from-stripe";

/**
 * The Tier-1 audited action registry (production-support PR 8).
 *
 * Single source of truth for the low-blast-radius remediations an admin (or an
 * AI agent in Recommend mode, PR 9) can run. Adding an action here automatically
 * makes it dispatchable via /api/admin/tier1-actions and referenceable from
 * playbooks (the PR 10 grounding guard asserts every playbook `tier1_actions`
 * key exists in this map).
 */

const ACTIONS: readonly Tier1Action[] = [
  resendVerificationEmail,
  regenerateResetLink,
  replayDlqWebhook,
  restoreEntitlementFromStripe,
];

export const TIER1_ACTIONS: Readonly<Record<string, Tier1Action>> = Object.freeze(
  Object.fromEntries(ACTIONS.map((a) => [a.key, a])),
);

export function getTier1Action(key: string): Tier1Action | undefined {
  return TIER1_ACTIONS[key];
}

/** Actions available for a given target type (drives the per-surface UI). */
export function actionsForTarget(
  targetType: Tier1Action["targetType"],
): readonly Tier1Action[] {
  return ACTIONS.filter((a) => a.targetType === targetType);
}

export type { Tier1Action } from "./types";
