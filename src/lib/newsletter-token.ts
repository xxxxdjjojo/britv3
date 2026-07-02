import { createHmac, timingSafeEqual } from "crypto";

/**
 * HMAC-signed tokens for newsletter confirm/unsubscribe links.
 *
 * Same signing pattern and secret as src/lib/unsubscribe-token.ts (dedicated
 * UNSUBSCRIBE_TOKEN_SECRET, fail-closed in production, dev fallback to the
 * service role key). Payload binds email + audience + purpose so a confirm
 * token can never be replayed as an unsubscribe token (and vice versa).
 */

let _secret: string | null = null;

function getSecret(): string {
  if (_secret) return _secret;
  const dedicated = process.env.UNSUBSCRIBE_TOKEN_SECRET;
  if (dedicated) {
    _secret = dedicated;
    return _secret;
  }
  // Fail-closed in production — do not reuse the service role key
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "UNSUBSCRIBE_TOKEN_SECRET must be set in production. Generate with: openssl rand -hex 32",
    );
  }
  // Development fallback only
  const fallback = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!fallback) {
    throw new Error(
      "UNSUBSCRIBE_TOKEN_SECRET or SUPABASE_SERVICE_ROLE_KEY must be configured",
    );
  }
  _secret = fallback;
  return _secret;
}

export type NewsletterTokenPurpose = "confirm" | "unsubscribe";

const DAY_MS = 24 * 60 * 60 * 1000;
const TTL_BY_PURPOSE: Record<NewsletterTokenPurpose, number> = {
  confirm: 7 * DAY_MS,
  unsubscribe: 365 * DAY_MS,
};

function b64(s: string): string {
  return Buffer.from(s).toString("base64url");
}

function sign(
  email: string,
  audience: string,
  purpose: NewsletterTokenPurpose,
  timestamp: number,
): string {
  // JSON payload: unambiguous field boundaries even if a field value contains
  // the "." delimiter (emails routinely do).
  return createHmac("sha256", getSecret())
    .update(JSON.stringify({ email, audience, purpose, timestamp }))
    .digest("hex");
}

export function generateNewsletterToken(
  email: string,
  audience: string,
  purpose: NewsletterTokenPurpose,
): string {
  const timestamp = Date.now();
  const sig = sign(email, audience, purpose, timestamp);
  return `${b64(email)}.${b64(audience)}.${b64(String(timestamp))}.${sig}`;
}

export type NewsletterTokenResult =
  | { ok: true; email: string; audience: string }
  | { ok: false; reason: "malformed" | "expired" | "invalid_signature" };

export function verifyNewsletterToken(
  token: string,
  purpose: NewsletterTokenPurpose,
): NewsletterTokenResult {
  const parts = token.split(".");
  if (parts.length !== 4) return { ok: false, reason: "malformed" };

  const [encodedEmail, encodedAudience, encodedTimestamp, sig] = parts;

  let email: string;
  let audience: string;
  let timestamp: number;
  try {
    email = Buffer.from(encodedEmail, "base64url").toString("utf8");
    audience = Buffer.from(encodedAudience, "base64url").toString("utf8");
    timestamp = Number(
      Buffer.from(encodedTimestamp, "base64url").toString("utf8"),
    );
    if (!email || !audience || isNaN(timestamp)) {
      return { ok: false, reason: "malformed" };
    }
  } catch {
    return { ok: false, reason: "malformed" };
  }

  const expectedSig = sign(email, audience, purpose, timestamp);
  try {
    const sigBuf = Buffer.from(sig, "hex");
    const expectedBuf = Buffer.from(expectedSig, "hex");
    if (
      sigBuf.length !== expectedBuf.length ||
      !timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return { ok: false, reason: "invalid_signature" };
    }
  } catch {
    return { ok: false, reason: "invalid_signature" };
  }

  if (Date.now() - timestamp > TTL_BY_PURPOSE[purpose]) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, email, audience };
}
