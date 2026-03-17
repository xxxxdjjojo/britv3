/**
 * Shared formatting utilities for billing/payment UI.
 *
 * These are intentionally kept free of "server-only" so they can be used
 * from both Server Components and Client Components.
 */

/**
 * Formats an amount in pence as a GBP (or other currency) string.
 * Example: formatGBP(2999) → "£29.99"
 */
export function formatGBP(pence: number, currency = "gbp"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(pence / 100);
}

/**
 * Formats an ISO 8601 date string for display.
 * Example: formatDate("2026-04-15T00:00:00Z") → "15 April 2026"
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Formats a Unix timestamp (seconds) as a date string.
 * Used for Stripe invoice timestamps.
 * Example: formatUnixDate(1776988800) → "15 April 2026"
 */
export function formatUnixDate(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
