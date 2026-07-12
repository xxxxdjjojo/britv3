import { createHash, randomBytes, timingSafeEqual } from "crypto";

/**
 * Single-use invitation tokens for the provider-reference (vouch) system.
 *
 * A raw token is a 256-bit random bearer secret emailed to a referee inside an
 * invite URL. Only its SHA-256 hash is persisted in
 * provider_references.invite_token_hash; the referee endpoints hash the
 * incoming raw token and look up the stored hash.
 *
 * Unlike the HMAC-signed claim tokens in this repo (invoice-pay-token,
 * newsletter-token), this token carries no authenticated payload — it is an
 * opaque, unguessable secret. Plain SHA-256 at rest is the correct primitive:
 * a keyed HMAC would add no security because the token itself is already
 * high-entropy and never trusted without a matching stored hash.
 *
 * This module is pure: it never touches the database. Expiry duration
 * (invite_expiry_days, from verification_vouch_rules, default 30) is passed in
 * by the caller.
 */

const TOKEN_BYTES = 32; // 256 bits of entropy.
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Cryptographically random, URL-safe single-use token. */
export function generateReferenceToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/** Deterministic SHA-256 hash (hex) of a raw token, for storage/lookup. */
export function hashReferenceToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Constant-time comparison of two hex hash strings. Returns false (without
 * throwing) when the inputs differ in length or are malformed hex.
 */
export function tokenHashesMatch(a: string, b: string): boolean {
  // A valid SHA-256 hex hash is exactly 64 chars. Rejecting anything else up
  // front closes an empty-buffer collision: Buffer.from("zz", "hex") decodes to
  // an empty buffer, so two garbage inputs would otherwise compare equal.
  if (a.length !== 64 || b.length !== 64) return false;
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** ISO timestamp `days` in the future from `from` (default now). */
export function computeInviteExpiry(days: number, from: Date = new Date()): string {
  return new Date(from.getTime() + days * MS_PER_DAY).toISOString();
}

/** True when the invite has no expiry or its expiry is at/before `now`. */
export function isInviteExpired(
  expiresAt: string | Date | null,
  now: Date = new Date(),
): boolean {
  if (expiresAt === null) return true;
  const expiry = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  // Fail closed: a corrupt/unparseable timestamp is treated as expired.
  if (Number.isNaN(expiry.getTime())) return true;
  return expiry.getTime() <= now.getTime();
}
