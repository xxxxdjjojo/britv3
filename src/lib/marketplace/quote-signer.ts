import { createHmac, timingSafeEqual } from "crypto";

/**
 * The ordered list of quote fields included in the HMAC signature.
 * Order matters — do not change without a migration to re-sign all quotes.
 */
export const QUOTE_SIGNING_FIELDS = [
  "service_request_id",
  "provider_id",
  "total_amount",
  "scope_of_work",
  "line_items",
] as const;

type SignableQuote = Record<(typeof QUOTE_SIGNING_FIELDS)[number], string>;

/**
 * Compute HMAC-SHA256 over the canonical quote fields.
 * All values are serialised as strings; numeric fields must be passed as
 * their string representations (e.g. total_amount.toString()).
 */
export function signQuote(fields: SignableQuote, secret: string): string {
  const payload = QUOTE_SIGNING_FIELDS.map((key) => fields[key]).join("|");
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Verify a stored signature against the current quote fields.
 * Uses timingSafeEqual to prevent timing attacks.
 * Returns false (not throws) for missing/null stored signatures.
 */
export function verifyQuote(
  fields: SignableQuote,
  storedSignature: string | null | undefined,
  secret: string,
): boolean {
  if (!storedSignature) return false;
  const expected = signQuote(fields, secret);
  try {
    return timingSafeEqual(
      Buffer.from(storedSignature, "hex"),
      Buffer.from(expected, "hex"),
    );
  } catch {
    // Buffer.from throws if the hex strings have different lengths
    return false;
  }
}
