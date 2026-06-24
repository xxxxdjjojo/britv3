export const EMAIL_CONFIRMATION_NEXT_PATH = "/verify-email/confirmed";
export const PENDING_SIGNUP_EMAIL_KEY = "truedeed_pending_signup_email";

export function buildAuthCallbackUrl(
  origin: string,
  next = EMAIL_CONFIRMATION_NEXT_PATH,
): string {
  const url = new URL("/auth/callback", origin);
  url.searchParams.set("next", next);
  return url.toString();
}

export function browserAuthCallbackUrl(next = EMAIL_CONFIRMATION_NEXT_PATH): string {
  return buildAuthCallbackUrl(window.location.origin, next);
}
