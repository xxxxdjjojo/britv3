import { createHmac, timingSafeEqual } from "crypto";

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

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function b64(s: string): string {
  return Buffer.from(s).toString("base64url");
}

function sign(userId: string, timestamp: number): string {
  return createHmac("sha256", getSecret())
    .update(`${userId}.${timestamp}`)
    .digest("hex");
}

export function generateUnsubscribeToken(userId: string): string {
  const timestamp = Date.now();
  const sig = sign(userId, timestamp);
  return `${b64(userId)}.${b64(String(timestamp))}.${sig}`;
}

export type VerifyResult =
  | { valid: true; userId: string }
  | { valid: false; reason: "malformed" | "expired" | "invalid_signature" };

export function verifyUnsubscribeToken(token: string): VerifyResult {
  const parts = token.split(".");
  if (parts.length !== 3) return { valid: false, reason: "malformed" };

  const [encodedUserId, encodedTimestamp, sig] = parts;

  let userId: string;
  let timestamp: number;
  try {
    userId = Buffer.from(encodedUserId, "base64url").toString("utf8");
    timestamp = Number(
      Buffer.from(encodedTimestamp, "base64url").toString("utf8"),
    );
    if (!userId || isNaN(timestamp)) return { valid: false, reason: "malformed" };
  } catch {
    return { valid: false, reason: "malformed" };
  }

  const expectedSig = sign(userId, timestamp);
  try {
    const sigBuf = Buffer.from(sig, "hex");
    const expectedBuf = Buffer.from(expectedSig, "hex");
    if (
      sigBuf.length !== expectedBuf.length ||
      !timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return { valid: false, reason: "invalid_signature" };
    }
  } catch {
    return { valid: false, reason: "invalid_signature" };
  }

  if (Date.now() - timestamp > TOKEN_TTL_MS) {
    return { valid: false, reason: "expired" };
  }

  return { valid: true, userId };
}
