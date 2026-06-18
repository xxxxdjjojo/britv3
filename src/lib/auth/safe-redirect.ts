/**
 * Open-redirect guard for the OAuth callback `next` param (BRIT-S004).
 *
 * The login/proxy flow sets `next` to the internal pathname a user was bounced
 * from (proxy.ts redirects unauthenticated users with `?next=<pathname>`), so
 * an allow-list of fixed sections would break deep-link-after-login for any
 * route not on the list. Instead we accept any *same-origin relative path* and
 * reject everything that can resolve to a different origin:
 *   - must start with a single "/" (path-absolute, not a scheme or //host)
 *   - no "//" (protocol-relative)
 *   - no backslash (browsers normalise "\" to "/", so "/\evil.com" -> "//evil.com")
 *   - no whitespace/control chars (used to smuggle the above past naive checks)
 *
 * Authorisation is still enforced by the proxy/RBAC layer regardless of `next`,
 * so a valid-but-privileged path (e.g. /admin) simply bounces a non-admin.
 */
export function resolveSafeNext(rawNext: string | null): string {
  if (!rawNext) return "/dashboard";
  if (!rawNext.startsWith("/")) return "/dashboard"; // scheme or relative ref
  if (rawNext.startsWith("//")) return "/dashboard"; // protocol-relative
  if (new RegExp("[\\\\\\s\\u0000-\\u001F\\u007F]").test(rawNext)) return "/dashboard"; // backslash/whitespace/control
  return rawNext;
}
