import { createHmac, timingSafeEqual } from "crypto";

/**
 * Secure, account-free payment links for invoices.
 *
 * A token is `<invoiceId>.<hmac>` where the HMAC is taken over a
 * domain-separated payload so it cannot be confused with any other signed
 * artifact (e.g. quote signatures). The customer can open and pay the invoice
 * without an account; the server re-verifies the token and recomputes the
 * payable amount before charging.
 */

const DOMAIN = "invoice-pay";

function computeSignature(invoiceId: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`${DOMAIN}:${invoiceId}`)
    .digest("hex");
}

/** Produce a signed pay-token for the given invoice id. */
export function signInvoicePayToken(invoiceId: string, secret: string): string {
  return `${invoiceId}.${computeSignature(invoiceId, secret)}`;
}

/**
 * Verify a pay-token and return its invoice id, or null if missing/invalid.
 * Uses a constant-time comparison to avoid signature timing leaks.
 */
export function verifyInvoicePayToken(
  token: string | null | undefined,
  secret: string,
): string | null {
  if (!token) return null;
  const sep = token.lastIndexOf(".");
  if (sep <= 0 || sep === token.length - 1) return null;

  const invoiceId = token.slice(0, sep);
  const providedSig = token.slice(sep + 1);
  const expectedSig = computeSignature(invoiceId, secret);

  try {
    const ok = timingSafeEqual(
      Buffer.from(providedSig, "hex"),
      Buffer.from(expectedSig, "hex"),
    );
    return ok ? invoiceId : null;
  } catch {
    // Buffer.from throws / length mismatch on malformed hex.
    return null;
  }
}
