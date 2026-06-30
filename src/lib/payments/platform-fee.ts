/**
 * platform-fee.ts
 *
 * The single configurable lever for platform commission on trader job payments.
 *
 * Commercial rule (2026): TrueDeed takes ZERO commission on trader jobs.
 * Monetisation for traders is the monthly subscription only. The default rate
 * is therefore 0%. To introduce a fee later, set the PLATFORM_FEE_RATE env var
 * to a fraction in [0, 1) — no code change required.
 *
 * Client-safe (no "server-only"): components may import it to render fee copy.
 */

/** Resolve the configured rate from the environment, fail-safe to 0. */
function resolveRate(): number {
  const raw = process.env.PLATFORM_FEE_RATE;
  if (raw == null || raw === "") return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n >= 1) return 0;
  return n;
}

/** Current platform commission rate on trader job payments. 0 = no commission. */
export const PLATFORM_FEE_RATE = resolveRate();

/**
 * Compute the platform application fee (in pence) for a charge.
 * Returns 0 for the default 0% rate, for non-positive amounts, or for an
 * out-of-range rate. Result is always a non-negative integer number of pence.
 */
export function platformFeePence(
  amountPence: number,
  rate: number = PLATFORM_FEE_RATE,
): number {
  if (!Number.isFinite(amountPence) || amountPence <= 0) return 0;
  if (!Number.isFinite(rate) || rate <= 0 || rate >= 1) return 0;
  return Math.round(amountPence * rate);
}
