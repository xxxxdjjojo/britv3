/**
 * Hand-rolled svix webhook verification for Resend delivery webhooks.
 *
 * The 'svix' package is intentionally NOT a dependency — the scheme is a
 * documented HMAC construction (https://docs.svix.com/receiving/verifying-payloads/how-manual):
 *
 *   signedContent = `${svix-id}.${svix-timestamp}.${rawPayload}`
 *   signature     = base64(HMAC-SHA256(base64decode(secret), signedContent))
 *
 * The secret is base64 after stripping the optional "whsec_" prefix. The
 * svix-signature header may carry multiple space-separated candidates
 * ("v1,<sig> v1,<sig>") to support secret rotation — verification succeeds
 * when ANY v1 candidate matches (timing-safe comparison).
 *
 * Timestamp skew greater than 5 minutes is rejected to bound replays.
 * Never throws — any malformed input returns false.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

const TOLERANCE_SECONDS = 5 * 60;
const SECRET_PREFIX = "whsec_";

type SvixHeaders = {
  "svix-id"?: string;
  "svix-timestamp"?: string;
  "svix-signature"?: string;
};

export function verifyResendWebhook(
  payload: string,
  headers: SvixHeaders,
  secret: string,
): boolean {
  try {
    const id = headers["svix-id"];
    const timestamp = headers["svix-timestamp"];
    const signatureHeader = headers["svix-signature"];
    if (!id || !timestamp || !signatureHeader || !secret) return false;

    // Reject stale or future timestamps (5-minute tolerance).
    const timestampSeconds = Number.parseInt(timestamp, 10);
    if (Number.isNaN(timestampSeconds)) return false;
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSeconds - timestampSeconds) > TOLERANCE_SECONDS) {
      return false;
    }

    const rawSecret = secret.startsWith(SECRET_PREFIX)
      ? secret.slice(SECRET_PREFIX.length)
      : secret;
    const key = Buffer.from(rawSecret, "base64");

    const signedContent = `${id}.${timestamp}.${payload}`;
    const expected = Buffer.from(
      createHmac("sha256", key).update(signedContent).digest("base64"),
      "utf-8",
    );

    // Multiple space-separated candidates support secret rotation.
    for (const candidate of signatureHeader.split(" ")) {
      const [version, candidateSignature] = candidate.split(",");
      if (version !== "v1" || !candidateSignature) continue;

      const provided = Buffer.from(candidateSignature, "utf-8");
      if (provided.length === expected.length && timingSafeEqual(provided, expected)) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}
