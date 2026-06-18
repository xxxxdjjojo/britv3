/**
 * HMAC request authentication for the push dispatch endpoint (BRIT-S008).
 *
 * Replaces the previous single static bearer token. Each request is signed
 * per-payload with `HMAC-SHA256(timestamp + "." + rawBody)` keyed on
 * PUSH_SECRET, and the timestamp is checked for freshness so a captured
 * signature cannot be replayed indefinitely. A leaked log line is no longer
 * enough to spam every subscriber — the attacker would also need a fresh,
 * correctly-signed payload within the skew window.
 */

import { createHmac, timingSafeEqual } from "crypto";

/** Max clock skew / replay window for a signed push request. */
export const PUSH_SIGNATURE_MAX_SKEW_MS = 5 * 60 * 1000; // 5 minutes

export const PUSH_SIGNATURE_HEADER = "x-push-signature";
export const PUSH_TIMESTAMP_HEADER = "x-push-timestamp";

function getSecret(): string {
  const secret = process.env.PUSH_SECRET;
  if (!secret) {
    throw new Error("PUSH_SECRET environment variable is required");
  }
  return secret;
}

/** Sign a push payload. Used by internal callers and by tests. */
export function signPushPayload(timestamp: string, rawBody: string): string {
  return createHmac("sha256", getSecret())
    .update(`${timestamp}.${rawBody}`)
    .digest("base64url");
}

/**
 * Verify a signed push request.
 *
 * Checks: timestamp is fresh (within skew), and the HMAC matches in
 * constant time. Returns false on any malformed input rather than throwing.
 */
export function verifyPushSignature(
  timestamp: string | null,
  rawBody: string,
  providedSig: string | null,
): boolean {
  if (!timestamp || !providedSig) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Date.now() - ts) > PUSH_SIGNATURE_MAX_SKEW_MS) return false;

  const expected = signPushPayload(timestamp, rawBody);
  const a = Buffer.from(providedSig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
