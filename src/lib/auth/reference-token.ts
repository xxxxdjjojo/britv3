/**
 * HMAC-based reference submission token utility.
 *
 * Issues long-lived (30-day) tokens sent to referees via email. The token
 * authenticates the referee to submit a reference without requiring a
 * Britestate account — the token IS the auth.
 *
 * Format: `base64url(referenceId.providerId.timestamp.nonce).hmacSig`
 */

import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getSecret(): string {
  const secret = process.env.REFERENCE_TOKEN_SECRET;
  if (!secret) {
    throw new Error(
      "REFERENCE_TOKEN_SECRET environment variable is required",
    );
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

/**
 * Issue a reference submission token for the given reference + provider pair.
 *
 * Format: `base64url(referenceId.providerId.timestamp.nonce).hmacSig`
 */
export function issueReferenceToken(
  referenceId: string,
  providerId: string,
): string {
  const timestamp = Date.now().toString();
  const nonce = randomBytes(16).toString("base64url");
  const payload = `${referenceId}.${providerId}.${timestamp}.${nonce}`;
  const encodedPayload = Buffer.from(payload).toString("base64url");
  const signature = sign(payload);
  return `${encodedPayload}.${signature}`;
}

/**
 * Verify a reference submission token.
 *
 * Checks:
 * 1. HMAC signature is valid (timing-safe comparison)
 * 2. Payload has exactly 4 parts (referenceId, providerId, timestamp, nonce)
 * 3. Token has not expired (30-day TTL)
 *
 * Returns decoded referenceId + providerId on success.
 */
export function verifyReferenceToken(
  token: string,
): { valid: true; referenceId: string; providerId: string } | { valid: false } {
  try {
    const dotIndex = token.lastIndexOf(".");
    if (dotIndex === -1) return { valid: false };

    const encodedPayload = token.slice(0, dotIndex);
    const providedSig = token.slice(dotIndex + 1);

    // Decode payload
    const payload = Buffer.from(encodedPayload, "base64url").toString("utf-8");
    const parts = payload.split(".");
    if (parts.length !== 4) return { valid: false };

    const [referenceId, providerId, timestampStr] = parts;

    // Timing-safe HMAC verification
    const expectedSig = sign(payload);
    const sigA = Buffer.from(providedSig, "utf-8");
    const sigB = Buffer.from(expectedSig, "utf-8");
    if (sigA.length !== sigB.length) return { valid: false };
    if (!timingSafeEqual(sigA, sigB)) return { valid: false };

    // TTL check
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return { valid: false };
    if (Date.now() - timestamp > TTL_MS) return { valid: false };

    return { valid: true, referenceId, providerId };
  } catch {
    return { valid: false };
  }
}
