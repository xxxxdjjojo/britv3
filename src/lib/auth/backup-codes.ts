import { createHash, randomBytes, timingSafeEqual } from "crypto";

/**
 * Hash a backup code with a random 16-byte salt.
 * Storage format: `salt:hash` (both hex-encoded).
 */
export function hashBackupCode(code: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(`${salt}:${code}`).digest("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify a backup code against a stored salt:hash value.
 * Also handles legacy unsalted hashes (no colon) for backwards compatibility.
 */
export function verifyBackupCode(code: string, stored: string): boolean {
  const colonIndex = stored.indexOf(":");

  if (colonIndex === -1) {
    // Legacy unsalted hash — just SHA-256(code)
    const legacy = createHash("sha256").update(code).digest("hex");
    const a = Buffer.from(legacy, "hex");
    const b = Buffer.from(stored, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }

  const salt = stored.slice(0, colonIndex);
  const hash = stored.slice(colonIndex + 1);
  const expected = createHash("sha256").update(`${salt}:${code}`).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
