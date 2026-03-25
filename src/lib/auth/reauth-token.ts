/**
 * HMAC-based re-authentication token utility.
 *
 * Issues short-lived (5-minute) tokens after a user proves they know their
 * current password. Subsequent security-critical endpoints (password change,
 * email change, 2FA disable, account deletion) verify this token before
 * performing the action.
 *
 * NOTE: Tokens are replayable within the 5-minute TTL. This is an accepted
 * tradeoff — the window is short and each token is scoped to a single userId.
 * A per-token revocation store (Redis set) could be added later if needed.
 */

import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const TTL_MS = 5 * 60 * 1000; // 5 minutes

function getSecret(): string {
  const secret = process.env.REAUTH_HMAC_SECRET;
  if (!secret) {
    throw new Error(
      "REAUTH_HMAC_SECRET environment variable is required — do not use SUPABASE_SERVICE_ROLE_KEY as fallback",
    );
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

/**
 * Issue a re-authentication token for the given user.
 *
 * Format: `base64url(userId.timestamp.nonce).hmacSig`
 */
export function issueReauthToken(userId: string): string {
  const timestamp = Date.now().toString();
  const nonce = randomBytes(16).toString("base64url");
  const payload = `${userId}.${timestamp}.${nonce}`;
  const encodedPayload = Buffer.from(payload).toString("base64url");
  const signature = sign(payload);
  return `${encodedPayload}.${signature}`;
}

/**
 * Verify a re-authentication token.
 *
 * Checks:
 * 1. HMAC signature is valid (timing-safe comparison)
 * 2. userId in the token matches the expected user
 * 3. Token has not expired (5-minute TTL)
 */
export function verifyReauthToken(
  token: string,
  expectedUserId: string,
): boolean {
  try {
    const dotIndex = token.lastIndexOf(".");
    if (dotIndex === -1) return false;

    const encodedPayload = token.slice(0, dotIndex);
    const providedSig = token.slice(dotIndex + 1);

    // Decode payload
    const payload = Buffer.from(encodedPayload, "base64url").toString("utf-8");
    const parts = payload.split(".");
    if (parts.length !== 3) return false;

    const [userId, timestampStr] = parts;

    // Timing-safe HMAC verification
    const expectedSig = sign(payload);
    const sigA = Buffer.from(providedSig, "utf-8");
    const sigB = Buffer.from(expectedSig, "utf-8");
    if (sigA.length !== sigB.length) return false;
    if (!timingSafeEqual(sigA, sigB)) return false;

    // userId must match the authenticated caller
    if (userId !== expectedUserId) return false;

    // TTL check
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;
    if (Date.now() - timestamp > TTL_MS) return false;

    return true;
  } catch {
    return false;
  }
}
