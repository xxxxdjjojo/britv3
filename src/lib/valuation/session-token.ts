import { createHash, randomBytes } from "node:crypto";

/** Opaque session token stored in an httpOnly cookie; only its hash is stored in the DB. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/** SHA-256 hash of a session token, used as the DB lookup key (never store the raw token). */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const VALUATION_SESSION_COOKIE = "vmp_session";
