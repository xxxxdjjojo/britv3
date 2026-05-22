// src/lib/invite-codes.ts
//
// Memo Pivot v2 — invite-only seed onboarding. The memo's Move 3 hand-picks
// the first 50 trades, 10 agents and 20 developers; the code surfaces here
// implement code generation, validation and redemption with per-audience quotas.

import { randomBytes } from "node:crypto";

export type InviteAudience = "trade" | "agent" | "developer";

export const INVITE_QUOTAS: Readonly<Record<InviteAudience, number>> = {
  trade: 50,
  agent: 10,
  developer: 20,
};

export class InviteQuotaExceededError extends Error {
  constructor(audience: InviteAudience, quota: number) {
    super(
      `Invite quota exhausted for audience "${audience}" (limit: ${quota})`,
    );
    this.name = "InviteQuotaExceededError";
  }
}

const AUDIENCE_PREFIX: Readonly<Record<InviteAudience, string>> = {
  trade: "TRADE",
  agent: "AGENT",
  developer: "DEVELOPER",
};

const CODE_REGEX = /^BRIT-(TRADE|AGENT|DEVELOPER)-[A-Z0-9]{6,}$/;

function isInviteAudience(value: string): value is InviteAudience {
  return value === "trade" || value === "agent" || value === "developer";
}

export function generateInviteCode(audience: InviteAudience): string {
  if (!INVITE_QUOTAS[audience]) {
    throw new Error(`Unknown invite audience: ${audience}`);
  }
  const prefix = AUDIENCE_PREFIX[audience];
  // 6 base32 chars = ~30 bits of entropy; collision per 1k generations is
  // ~10^-6 — fine for a seed batch capped at 80.
  const random = randomBytes(8).toString("base64").replace(/[^A-Z0-9]/gi, "").slice(0, 8).toUpperCase();
  return `BRIT-${prefix}-${random || "AAAAAA"}`;
}

interface ValidateResult {
  readonly audience: InviteAudience;
  readonly remainingQuota?: number;
}

interface RedeemResult extends ValidateResult {
  readonly userId: string;
}

interface InviteOptions {
  /**
   * Skip Supabase persistence — used in unit tests to keep the layer
   * deterministic without standing up a database.
   */
  readonly skipPersistence?: boolean;
}

// In-memory store used only when skipPersistence is true (test path).
const redeemedCodes: Set<string> = new Set();
const inMemoryAudienceCount = new Map<InviteAudience, number>();

function parseCode(code: string): InviteAudience | null {
  if (!CODE_REGEX.test(code)) return null;
  const segment = code.split("-")[1];
  if (!segment) return null;
  const audience = segment.toLowerCase();
  return isInviteAudience(audience) ? audience : null;
}

export async function validateInviteCode(
  code: string,
  options: InviteOptions = {},
): Promise<ValidateResult | null> {
  const audience = parseCode(code);
  if (!audience) return null;
  if (options.skipPersistence) {
    return redeemedCodes.has(code) ? null : { audience };
  }
  // Production path: look up in Supabase via the service-role client.
  // RLS restricts SELECT on invite_codes to admins, so the user-context
  // client would return null for anon visitors. The service-role client
  // bypasses RLS, allowing public validation by code value only.
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("invite_codes")
      .select("audience, redeemed_at")
      .eq("code", code)
      .maybeSingle();
    if (error || !data) return null;
    if (data.redeemed_at) return null;
    return { audience };
  } catch {
    return null;
  }
}

/**
 * Count redeemed codes for an audience. Used by redeemInviteCode to
 * enforce INVITE_QUOTAS at redemption time.
 */
async function countRedeemed(
  audience: InviteAudience,
  options: InviteOptions,
): Promise<number> {
  if (options.skipPersistence) {
    return inMemoryAudienceCount.get(audience) ?? 0;
  }
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();
    const { count, error } = await supabase
      .from("invite_codes")
      .select("id", { count: "exact", head: true })
      .eq("audience", audience)
      .not("redeemed_at", "is", null);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function redeemInviteCode(
  code: string,
  userId: string,
  options: InviteOptions = {},
): Promise<RedeemResult> {
  const audience = parseCode(code);
  if (!audience) {
    throw new Error("Invalid invite code");
  }
  const quota = INVITE_QUOTAS[audience];
  const alreadyRedeemed = await countRedeemed(audience, options);
  if (alreadyRedeemed >= quota) {
    throw new InviteQuotaExceededError(audience, quota);
  }

  if (options.skipPersistence) {
    if (redeemedCodes.has(code)) {
      throw new Error("Invite code already redeemed");
    }
    redeemedCodes.add(code);
    inMemoryAudienceCount.set(audience, alreadyRedeemed + 1);
    return { audience, userId };
  }
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("invite_codes")
      .update({ redeemed_at: new Date().toISOString(), redeemed_by: userId })
      .eq("code", code)
      .is("redeemed_at", null)
      .select("audience")
      .maybeSingle();
    if (error || !data) {
      throw new Error("Invite code already redeemed or invalid");
    }
    return { audience, userId };
  } catch (err: unknown) {
    if (err instanceof Error) throw err;
    throw new Error("Invite redemption failed");
  }
}

/** Test-only — wipes the in-memory redeemed-codes store. */
export function __resetInviteStoreForTests(): void {
  redeemedCodes.clear();
  inMemoryAudienceCount.clear();
}
