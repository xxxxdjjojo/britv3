import { permanentRedirect } from "next/navigation";

// The former "Market Trends" page presented fabricated figures — regional and
// national average prices, YoY changes, transaction volumes, avg-days-to-sell,
// asking-vs-sold gaps, rental yields, hot/cold "heat index", first-time-buyer
// stats, an affordability ratio, hand-drawn SVG trend lines, hardcoded MoM/YoY
// cards, and an invented "Chief Economist" commentary — all under a false
// "Real-time data from Land Registry & ONS" attribution. HM Land Registry
// supplies none of those (no asking price, beds, days-to-sell, yield, listings
// or FTB data). The honest replacement is the postcode-first /area-prices tool,
// which shows genuine flat/house median sold prices from Land Registry data.
export default function MarketTrendsPage() {
  permanentRedirect("/area-prices");
}
