import { permanentRedirect } from "next/navigation";

// The former "National Market Trends" page was 100% fabricated: a national
// average price, YoY change, monthly transactions, avg-days-to-sell, an
// affordability ratio, active-listing counts, first-time-buyer price/deposit/age
// stats, and a hardcoded 1995–2026 "historical" price series — all falsely
// attributed to "Halifax, Nationwide, HMRC, Land Registry". None of it was wired
// to real data. The honest replacement is the postcode-first /area-prices tool,
// which reads genuine flat/house median sold prices from Land Registry data.
export default function NationalMarketTrendsPage() {
  permanentRedirect("/area-prices");
}
