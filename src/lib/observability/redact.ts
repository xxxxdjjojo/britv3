/**
 * Redaction choke-point (PR 9).
 *
 * The single guarantee that no PII or secret material reaches an LLM context.
 * The triage-packet builder composes its output exclusively from these
 * primitives, so anything customer-derived is scrubbed here before it can be
 * serialised into an AI prompt.
 *
 * Policy:
 *  - Emails, UK phone numbers, UK postcodes, names → replaced with a class
 *    placeholder (no partial reveal — a partial can still identify a person).
 *  - Stripe / GoCardless object ids → prefix + last 4 chars only. The last 4 are
 *    retained deliberately: they let an engineer correlate against the Stripe /
 *    GoCardless dashboard without exposing the full id.
 *  - Free-text bodies → stripped entirely to a length-only placeholder. Regex
 *    cannot catch free-form PII (names in prose, addresses), so free text is
 *    never passed through; only its shape (length) survives.
 */

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Stripe object ids: `<prefix>_<base62>` (cus_, sub_, pi_, in_, evt_, …).
const STRIPE_ID_RE =
  /\b(?:cus|sub|pi|in|ch|evt|price|prod|seti|si|re|txn|il|acct|py|cs|iv|inv)_[A-Za-z0-9]{6,}\b/g;

// GoCardless ids are uppercase, prefix + alphanumerics (MD…, PM…, CU…, PY…).
const GC_ID_RE = /\b(?:CU|MD|PM|CR|PY|BRT|MRT|RE|IN)[0-9A-Z]{6,}\b/g;

// UK postcode (outward + inward), tolerant of missing/variable spacing and case.
const UK_POSTCODE_RE = /\b[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}\b/g;

// UK phone: optional +44 / leading 0 (optionally parenthesised) then a run of
// digits/spaces/parens ending on a digit. Deliberately greedy — over-masking a
// number is safe, leaking one is not.
const UK_PHONE_RE = /\(?(?:\+44|0)\)?[\d\s)(]{8,}\d/g;

/** Stripe/GoCardless id → prefix (if any) + `…` + last 4 chars. Never the full id. */
export function redactExternalId(value: string): string {
  const underscore = value.indexOf("_");
  const last4 = value.slice(-4);
  if (underscore > 0) {
    return `${value.slice(0, underscore + 1)}…${last4}`;
  }
  return `…${last4}`;
}

/**
 * Scrub every PII/secret class from arbitrary text. Emails first (so digits
 * inside them cannot be re-read as phone numbers), then external ids, then
 * postcodes, then phone numbers.
 */
export function redactPii(input: string): string {
  return input
    .replace(EMAIL_RE, "[email]")
    .replace(STRIPE_ID_RE, (match) => redactExternalId(match))
    .replace(GC_ID_RE, (match) => redactExternalId(match))
    .replace(UK_POSTCODE_RE, "[postcode]")
    .replace(UK_PHONE_RE, "[phone]");
}

/** Free-text body → length-only placeholder. The content never survives. */
export function redactFreeText(value: string | null | undefined): string {
  if (!value) return "[empty]";
  return `[free text redacted · ${value.length} chars]`;
}

/** A known name field → placeholder (`[none]` when absent). */
export function redactName(value: string | null | undefined): string {
  return value ? "[name]" : "[none]";
}

/** A known email field → placeholder (`[none]` when absent). */
export function redactEmail(value: string | null | undefined): string {
  return value ? "[email]" : "[none]";
}
