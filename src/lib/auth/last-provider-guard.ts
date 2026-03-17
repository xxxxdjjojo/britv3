import type { UserIdentity } from "@supabase/supabase-js";

/**
 * Determines whether an OAuth identity can be safely unlinked.
 *
 * Rule: a user must always retain at least one viable login method.
 * If there is only one identity and it is NOT an email/password provider,
 * unlinking it would lock the user out — so we block it.
 *
 * Returns `{ allowed: true }` or `{ allowed: false, reason: string }`.
 */
export function canUnlinkIdentity(
  identities: UserIdentity[],
  identityIdToRemove: string,
): { allowed: true } | { allowed: false; reason: string } {
  if (identities.length === 0) {
    return {
      allowed: false,
      reason: "No identities found.",
    };
  }

  // After removal, what remains?
  const remaining = identities.filter((i) => i.identity_id !== identityIdToRemove);

  if (remaining.length === 0) {
    // This is the user's only identity — check if it's email-based
    const target = identities.find((i) => i.identity_id === identityIdToRemove);
    if (target?.provider === "email") {
      // Email provider means they have a password — but if it's their only
      // identity we still shouldn't allow removal (they'd have no login).
      return {
        allowed: false,
        reason:
          "Cannot disconnect your only login method. Set a password first.",
      };
    }

    // Check if there's an email provider among ALL identities (separate from the one being removed)
    const hasEmailProvider = identities.some(
      (i) => i.provider === "email" && i.identity_id !== identityIdToRemove,
    );

    if (!hasEmailProvider) {
      return {
        allowed: false,
        reason:
          "Cannot disconnect your only login method. Set a password first.",
      };
    }
  }

  return { allowed: true };
}
