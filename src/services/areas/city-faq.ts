/**
 * City-specific FAQ copy for the /areas/[city] guide.
 *
 * Built from the real headline fields on `CityData` so each answer is accurate
 * and unique per city, and so the same items can drive both the visible FAQ and
 * the FAQPage JSON-LD.
 */

import type { CityData } from "@/types/areas";
import type { FaqItem } from "@/lib/seo/faq-jsonld";

export function buildCityFaq(city: CityData): FaqItem[] {
  return [
    {
      question: `What is the average property price in ${city.name}?`,
      answer: `The average property price in ${city.name} is ${city.avgPriceFormatted}, with a median sold price of £${Math.round(
        city.medianPrice / 1000,
      ).toLocaleString("en-GB")}k. Prices have moved ${city.yoyChangeFormatted} over the past year.`,
    },
    {
      question: `Is the ${city.name} property market rising or falling?`,
      answer: `Over the last 12 months ${city.name} prices changed by ${city.yoyChangeFormatted} year on year, based on HM Land Registry data. Around ${city.transactionsLast12m.toLocaleString(
        "en-GB",
      )} sales completed in that period, so the market is actively trading.`,
    },
    {
      question: `How long does it take to sell a home in ${city.name}?`,
      answer: `Homes in ${city.name} take roughly ${city.avgDaysToSell} days to sell on average, from first listing to agreed sale. There are about ${city.activeListings.toLocaleString(
        "en-GB",
      )} properties on the market right now.`,
    },
    {
      question: `Which property types cost the most in ${city.name}?`,
      answer: `Detached homes are typically the most expensive in ${city.name} at around £${Math.round(
        city.priceByType.D / 1000,
      ).toLocaleString("en-GB")}k, while flats are the most affordable entry point at about £${Math.round(
        city.priceByType.F / 1000,
      ).toLocaleString("en-GB")}k. Terraced and semi-detached homes sit in between.`,
    },
    {
      question: `Where does TrueDeed's ${city.name} price data come from?`,
      answer: `All ${city.name} figures are derived from HM Land Registry Price Paid Data — the official record of completed sales in England and Wales — and describe the wider area rather than any single property.`,
    },
  ];
}
