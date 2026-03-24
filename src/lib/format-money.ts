/**
 * Shared money formatting utilities.
 * All monetary values in this codebase are stored as pence (integer).
 */

export function fmtGbp(pence: number): string {
  return (pence / 100).toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
  });
}

export function penceToPounds(pence: number): number {
  return pence / 100;
}

export function poundsToPence(pounds: number): number {
  return Math.round(pounds * 100);
}
