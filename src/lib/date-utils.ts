/**
 * Shared date utilities for expiry/deadline calculations.
 * Used by compliance, rent, action items, and key dates features.
 *
 * Previously duplicated in:
 * - compliance/page.tsx (getDaysUntil)
 * - document-service.ts (getExpiryStatus)
 * - compliance-reminder-logic.ts (inline in processDocument)
 */

export type ExpiryStatus = "valid" | "expiring" | "expired" | "none";

/**
 * Calculate days between today and a target date.
 * Positive = future, negative = past, 0 = today.
 */
export function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Determine expiry status from a date string.
 * green = valid (>30 days), amber = expiring (<=30 days), red = expired, none = no date.
 */
export function getExpiryStatus(expiryDate: string | null): ExpiryStatus {
  if (!expiryDate) return "none";
  const days = getDaysUntil(expiryDate);
  if (days <= 0) return "expired";
  if (days <= 30) return "expiring";
  return "valid";
}
