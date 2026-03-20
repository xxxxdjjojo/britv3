/**
 * Cloudflare Turnstile server-side token verification.
 * Skips verification when TURNSTILE_SECRET_KEY is not configured.
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstileToken(token: string | null | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Skip verification if Turnstile is not configured
  if (!secret) return true;

  if (!token) return false;

  const res = await fetch(VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
  });

  const data = await res.json();
  return data.success === true;
}
