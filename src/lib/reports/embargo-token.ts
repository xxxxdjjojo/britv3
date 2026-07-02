import { createHmac, timingSafeEqual } from "crypto";

/**
 * Embargoed-preview links for data reports.
 *
 * A token is `<b64url(reportKey)>.<b64url(edition)>.<hmac>` where the HMAC is
 * taken over a domain-separated payload so it cannot be confused with any
 * other signed artifact (e.g. invoice pay-tokens or quote signatures). The
 * token lets journalists open an unpublished report edition without an
 * account; the server re-verifies the token against the exact report + edition
 * before rendering anything.
 *
 * There is deliberately no TTL: an embargo link dies naturally when the
 * edition publishes (the gate stops consulting the token once
 * `published === true`, and the public URL takes over).
 */

const DOMAIN = "report-embargo";

function encodePart(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodePart(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function computeSignature(
  keyPart: string,
  editionPart: string,
  secret: string,
): string {
  return createHmac("sha256", secret)
    .update(`${DOMAIN}:${keyPart}.${editionPart}`)
    .digest("hex");
}

/** Produce a signed embargo-preview token for the given report edition. */
export function signEmbargoToken(
  reportKey: string,
  edition: string,
  secret: string,
): string {
  const keyPart = encodePart(reportKey);
  const editionPart = encodePart(edition);
  return `${keyPart}.${editionPart}.${computeSignature(keyPart, editionPart, secret)}`;
}

/**
 * Verify an embargo token and return its report key + edition, or null on any
 * failure (missing, malformed, tampered, wrong secret/domain). Uses a
 * constant-time comparison to avoid signature timing leaks.
 */
export function verifyEmbargoToken(
  token: string,
  secret: string,
): { reportKey: string; edition: string } | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [keyPart, editionPart, providedSig] = parts;
  if (!keyPart || !editionPart || !providedSig) return null;

  const expectedSig = computeSignature(keyPart, editionPart, secret);
  try {
    const ok = timingSafeEqual(
      Buffer.from(providedSig, "hex"),
      Buffer.from(expectedSig, "hex"),
    );
    if (!ok) return null;
  } catch {
    // Buffer.from throws / length mismatch on malformed hex.
    return null;
  }

  return { reportKey: decodePart(keyPart), edition: decodePart(editionPart) };
}

/** Server-side signing secret (shared with the quote/invoice HMAC family). */
export function embargoSecret(): string {
  const secret = process.env.QUOTE_SIGNING_SECRET;
  if (!secret) {
    throw new Error("QUOTE_SIGNING_SECRET is not configured");
  }
  return secret;
}
