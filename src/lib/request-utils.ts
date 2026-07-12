/**
 * Shared HTTP request helpers.
 */

/**
 * Best-effort client IP extraction for rate-limit keys.
 *
 * Order matches src/lib/audited-admin-action.ts extractIp: Cloudflare's
 * `cf-connecting-ip` first (behind Cloudflare, `x-forwarded-for` would be the
 * CDN edge IP, defeating per-client limiting), then the first `x-forwarded-for`
 * hop, then `x-real-ip`. Falls back to "unknown" so a missing header degrades to
 * a shared bucket rather than throwing.
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
