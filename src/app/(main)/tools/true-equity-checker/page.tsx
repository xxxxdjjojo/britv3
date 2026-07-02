import { redirect } from "next/navigation";

// Branded True Equity Checker entry (Campaign 12) — the canonical surface is /area-prices.
export default function TrueEquityCheckerPage() {
  redirect("/area-prices");
}
