import type { RegionalTrendData, NationalTrendData, MarketTrendKPI } from "@/types/areas";

export const REGIONAL_TRENDS: RegionalTrendData[] = [
  { region: "London", slug: "london", avgPrice: 725000, avgPriceFormatted: "£725,000", yoyChange: 2.1, yoyChangeFormatted: "+2.1%", transactionsLast12m: 89400, avgDaysToSell: 34, askingVsSoldGap: -3.2, askingVsSoldGapFormatted: "-3.2%", avgYield: 3.8, stockLevels: 52000 },
  { region: "South East", slug: "south-east", avgPrice: 425000, avgPriceFormatted: "£425,000", yoyChange: 3.4, yoyChangeFormatted: "+3.4%", transactionsLast12m: 112000, avgDaysToSell: 29, askingVsSoldGap: -2.1, askingVsSoldGapFormatted: "-2.1%", avgYield: 4.1, stockLevels: 68000 },
  { region: "South West", slug: "south-west", avgPrice: 365000, avgPriceFormatted: "£365,000", yoyChange: 4.2, yoyChangeFormatted: "+4.2%", transactionsLast12m: 72000, avgDaysToSell: 31, askingVsSoldGap: -1.8, askingVsSoldGapFormatted: "-1.8%", avgYield: 4.3, stockLevels: 41000 },
  { region: "East of England", slug: "east-of-england", avgPrice: 380000, avgPriceFormatted: "£380,000", yoyChange: 3.1, yoyChangeFormatted: "+3.1%", transactionsLast12m: 68000, avgDaysToSell: 28, askingVsSoldGap: -1.9, askingVsSoldGapFormatted: "-1.9%", avgYield: 4.0, stockLevels: 38000 },
  { region: "East Midlands", slug: "east-midlands", avgPrice: 248000, avgPriceFormatted: "£248,000", yoyChange: 4.8, yoyChangeFormatted: "+4.8%", transactionsLast12m: 54000, avgDaysToSell: 26, askingVsSoldGap: -1.4, askingVsSoldGapFormatted: "-1.4%", avgYield: 5.2, stockLevels: 28000 },
  { region: "West Midlands", slug: "west-midlands", avgPrice: 262000, avgPriceFormatted: "£262,000", yoyChange: 4.5, yoyChangeFormatted: "+4.5%", transactionsLast12m: 61000, avgDaysToSell: 27, askingVsSoldGap: -1.6, askingVsSoldGapFormatted: "-1.6%", avgYield: 5.0, stockLevels: 32000 },
  { region: "Yorkshire and the Humber", slug: "yorkshire-and-the-humber", avgPrice: 225000, avgPriceFormatted: "£225,000", yoyChange: 5.1, yoyChangeFormatted: "+5.1%", transactionsLast12m: 67000, avgDaysToSell: 25, askingVsSoldGap: -1.2, askingVsSoldGapFormatted: "-1.2%", avgYield: 5.5, stockLevels: 34000 },
  { region: "North West", slug: "north-west", avgPrice: 235000, avgPriceFormatted: "£235,000", yoyChange: 5.4, yoyChangeFormatted: "+5.4%", transactionsLast12m: 82000, avgDaysToSell: 24, askingVsSoldGap: -1.1, askingVsSoldGapFormatted: "-1.1%", avgYield: 5.6, stockLevels: 42000 },
  { region: "North East", slug: "north-east", avgPrice: 168000, avgPriceFormatted: "£168,000", yoyChange: 6.2, yoyChangeFormatted: "+6.2%", transactionsLast12m: 28000, avgDaysToSell: 30, askingVsSoldGap: -2.4, askingVsSoldGapFormatted: "-2.4%", avgYield: 6.1, stockLevels: 16000 },
  { region: "Wales", slug: "wales", avgPrice: 218000, avgPriceFormatted: "£218,000", yoyChange: 4.9, yoyChangeFormatted: "+4.9%", transactionsLast12m: 31000, avgDaysToSell: 32, askingVsSoldGap: -2.0, askingVsSoldGapFormatted: "-2.0%", avgYield: 5.3, stockLevels: 18000 },
  { region: "Scotland", slug: "scotland", avgPrice: 205000, avgPriceFormatted: "£205,000", yoyChange: 3.8, yoyChangeFormatted: "+3.8%", transactionsLast12m: 48000, avgDaysToSell: 27, askingVsSoldGap: -1.5, askingVsSoldGapFormatted: "-1.5%", avgYield: 5.4, stockLevels: 26000 },
  { region: "Northern Ireland", slug: "northern-ireland", avgPrice: 185000, avgPriceFormatted: "£185,000", yoyChange: 7.1, yoyChangeFormatted: "+7.1%", transactionsLast12m: 14000, avgDaysToSell: 35, askingVsSoldGap: -2.8, askingVsSoldGapFormatted: "-2.8%", avgYield: 5.8, stockLevels: 9000 },
];

export const NATIONAL_TRENDS: NationalTrendData = {
  avgPrice: 298000,
  avgPriceFormatted: "£298,000",
  yoyChange: 3.8,
  yoyChangeFormatted: "+3.8%",
  monthlyTransactions: 92400,
  avgDaysToSell: 28,
  affordabilityRatio: 8.3,
  ftbAvgPrice: 228000,
  ftbAvgDeposit: 43000,
  ftbAvgAge: 33,
  activeListings: 520000,
  historicalPrices: [
    { year: 1995, price: 50930 }, { year: 1996, price: 54095 }, { year: 1997, price: 58205 },
    { year: 1998, price: 63560 }, { year: 1999, price: 72740 }, { year: 2000, price: 81628 },
    { year: 2001, price: 89785 }, { year: 2002, price: 110400 }, { year: 2003, price: 132760 },
    { year: 2004, price: 154550 }, { year: 2005, price: 160300 }, { year: 2006, price: 167600 },
    { year: 2007, price: 184100 }, { year: 2008, price: 163800 }, { year: 2009, price: 154900 },
    { year: 2010, price: 166700 }, { year: 2011, price: 162500 }, { year: 2012, price: 163200 },
    { year: 2013, price: 170000 }, { year: 2014, price: 188900 }, { year: 2015, price: 196400 },
    { year: 2016, price: 210200 }, { year: 2017, price: 218900 }, { year: 2018, price: 226300 },
    { year: 2019, price: 228400 }, { year: 2020, price: 239200 }, { year: 2021, price: 264900 },
    { year: 2022, price: 281000 }, { year: 2023, price: 278800 }, { year: 2024, price: 285600 },
    { year: 2025, price: 291400 }, { year: 2026, price: 298000 },
  ],
  monthlyVolumes: [
    { month: "Apr 2024", volume: 78200 }, { month: "May 2024", volume: 86400 },
    { month: "Jun 2024", volume: 92100 }, { month: "Jul 2024", volume: 88700 },
    { month: "Aug 2024", volume: 79300 }, { month: "Sep 2024", volume: 84600 },
    { month: "Oct 2024", volume: 91200 }, { month: "Nov 2024", volume: 82400 },
    { month: "Dec 2024", volume: 64300 }, { month: "Jan 2025", volume: 71800 },
    { month: "Feb 2025", volume: 78500 }, { month: "Mar 2025", volume: 89700 },
    { month: "Apr 2025", volume: 82400 }, { month: "May 2025", volume: 91300 },
    { month: "Jun 2025", volume: 96800 }, { month: "Jul 2025", volume: 93200 },
    { month: "Aug 2025", volume: 84100 }, { month: "Sep 2025", volume: 88900 },
    { month: "Oct 2025", volume: 95400 }, { month: "Nov 2025", volume: 86700 },
    { month: "Dec 2025", volume: 68200 }, { month: "Jan 2026", volume: 76400 },
    { month: "Feb 2026", volume: 83100 }, { month: "Mar 2026", volume: 92400 },
  ],
};

export const MARKET_KPIS: MarketTrendKPI[] = [
  { label: "Avg. House Price", value: "£298,000", change: "+3.8% YoY", trend: "up" },
  { label: "Monthly Transactions", value: "92,400", change: "+12% YoY", trend: "up" },
  { label: "Avg. Days to Sell", value: "28", change: "-3 days", trend: "down" },
  { label: "Asking vs Sold Gap", value: "-2.1%", change: "Stable", trend: "neutral" },
];

export const HOT_MARKETS: Array<{ city: string; change: string }> = [
  { city: "Manchester", change: "+7.2%" },
  { city: "Birmingham", change: "+6.8%" },
  { city: "Leeds", change: "+6.4%" },
  { city: "Liverpool", change: "+6.1%" },
  { city: "Nottingham", change: "+5.9%" },
];

export const COLD_MARKETS: Array<{ city: string; change: string }> = [
  { city: "Aberdeen", change: "-1.2%" },
  { city: "Guildford", change: "+0.8%" },
  { city: "Cambridge", change: "+1.1%" },
  { city: "London (Prime Central)", change: "+1.3%" },
  { city: "Bath", change: "+1.5%" },
];

export const YIELD_RANKINGS: Array<{ rank: string; area: string; detail: string; yield: number }> = [
  { rank: "1", area: "Sunderland", detail: "SR1 — City Centre", yield: 8.9 },
  { rank: "2", area: "Burnley", detail: "BB11 — Central", yield: 8.4 },
  { rank: "3", area: "Bradford", detail: "BD1 — City Centre", yield: 7.8 },
  { rank: "4", area: "Middlesbrough", detail: "TS1 — Central", yield: 7.6 },
  { rank: "5", area: "Liverpool", detail: "L1 — Baltic Triangle", yield: 7.3 },
  { rank: "6", area: "Stoke-on-Trent", detail: "ST1 — Hanley", yield: 7.1 },
  { rank: "7", area: "Glasgow", detail: "G1 — Merchant City", yield: 6.9 },
  { rank: "8", area: "Nottingham", detail: "NG1 — City Centre", yield: 6.7 },
  { rank: "9", area: "Sheffield", detail: "S1 — Kelham Island", yield: 6.5 },
  { rank: "10", area: "Leeds", detail: "LS1 — City Centre", yield: 6.3 },
];

export function getRegionalTrend(regionSlug: string): RegionalTrendData | null {
  return REGIONAL_TRENDS.find(r => r.slug === regionSlug) ?? null;
}
