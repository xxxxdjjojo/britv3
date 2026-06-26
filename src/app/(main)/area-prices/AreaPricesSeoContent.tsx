/**
 * Server-rendered SEO depth for /area-prices.
 *
 * The interactive explorer is a client island that renders almost nothing in
 * the initial HTML, so crawlers see no substantive content. This server
 * component adds real, indexable copy beneath it: a methodology block, a
 * popular-areas grid linking to /areas/<city> with real headline prices, and an
 * FAQ rendered as semantic HTML (also emitted as FAQPage JSON-LD by the page).
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAllCitySlugs, getCityData } from "@/services/areas/area-data-service";

export const AREA_PRICES_FAQ = [
  {
    question: "Where do these sold prices come from?",
    answer:
      "Every figure is calculated from HM Land Registry Price Paid Data — the official register of property sales completed in England and Wales. We show the median (typical) sale, not an average, so a handful of unusually high or low sales does not distort the headline.",
  },
  {
    question: "What does the median sold price actually mean?",
    answer:
      "The median is the middle sale price once every transaction in the area is lined up from cheapest to most expensive. Half of homes sold for less and half for more. It is a more reliable guide to a 'typical' price than the average, which a few luxury sales can skew upwards.",
  },
  {
    question: "Why are flats and houses shown separately?",
    answer:
      "Flats and houses sell at very different price points, so blending them produces a misleading single number. We split them so you can compare like with like. 'Houses' combines detached, semi-detached and terraced sales.",
  },
  {
    question: "What does postcode-level data mean here?",
    answer:
      "We start at the smallest geography that has enough recent sales to be reliable — usually your neighbourhood (LSOA) — and widen to the postcode district, wider area or local authority only if there were too few sales to show a trustworthy figure. The card always tells you which level the number came from.",
  },
  {
    question: "How recent is the data?",
    answer:
      "Figures are based on sales registered with HM Land Registry over roughly the last 12 months. Because registration happens after completion, the very latest sales can take a few weeks to appear, so fast-moving markets may lag slightly.",
  },
  {
    question: "Is this a valuation of my specific property?",
    answer:
      "No. These figures describe the wider area, not any individual home. Condition, exact location, size and improvements all move a specific property away from the area median. Use it as context, not as a valuation.",
  },
] as const;

async function getPopularAreas() {
  const slugs = getAllCitySlugs();
  const entries = await Promise.all(slugs.map((slug) => getCityData(slug)));
  return entries
    .filter((city): city is NonNullable<typeof city> => city !== null)
    .map((city) => ({
      slug: city.slug,
      name: city.name,
      avgPriceFormatted: city.avgPriceFormatted,
      region: city.region,
    }));
}

const METHODOLOGY_POINTS = [
  {
    title: "HM Land Registry median",
    body: "We use the official Price Paid Data for England and Wales and report the median — the middle sale — rather than an average, so a few exceptional sales never define the headline.",
  },
  {
    title: "Flats vs houses, never blended",
    body: "Flats and houses sit at different price points, so we band them separately. Houses combine detached, semi-detached and terraced sales for a fair like-for-like comparison.",
  },
  {
    title: "The smallest reliable geography",
    body: "We start at your neighbourhood and only widen to the postcode district, surrounding area or local authority when there aren't enough recent sales to be dependable. The result always names the level used.",
  },
] as const;

export async function AreaPricesSeoContent() {
  const popularAreas = await getPopularAreas();

  return (
    <div className="border-t border-brand-primary/10 bg-white/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6 lg:gap-20 lg:py-24">
        {/* Methodology */}
        <section aria-labelledby="methodology-heading" className="flex flex-col gap-8">
          <div className="max-w-2xl">
            <h2
              id="methodology-heading"
              className="font-heading text-3xl font-bold tracking-[-0.02em] text-brand-primary-dark sm:text-4xl"
            >
              How these area prices work
            </h2>
            <p className="mt-3 font-sans text-base leading-relaxed text-brand-primary-dark/65">
              Sold prices on TrueDeed are built from official data, with honest
              labelling at every step. Here is exactly what you are looking at.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {METHODOLOGY_POINTS.map((point, i) => (
              <div
                key={point.title}
                className="rounded-2xl border border-brand-primary/10 bg-white p-6 shadow-[0_2px_4px_-1px_rgba(27,77,62,0.05),0_16px_36px_-18px_rgba(27,77,62,0.18)]"
              >
                <span className="font-heading text-sm font-bold text-brand-primary/70">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-heading text-lg font-bold text-brand-primary-dark">
                  {point.title}
                </h3>
                <p className="mt-2 font-sans text-sm leading-relaxed text-brand-primary-dark/65">
                  {point.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Popular areas */}
        <section aria-labelledby="popular-areas-heading" className="flex flex-col gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2
                id="popular-areas-heading"
                className="font-heading text-3xl font-bold tracking-[-0.02em] text-brand-primary-dark sm:text-4xl"
              >
                Popular areas
              </h2>
              <p className="mt-3 font-sans text-base leading-relaxed text-brand-primary-dark/65">
                Explore a full property guide for some of the UK&apos;s most-searched
                cities — house prices, schools, transport and local insight.
              </p>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {popularAreas.map((area) => (
              <li key={area.slug}>
                <Link
                  href={`/areas/${area.slug}`}
                  className="group flex h-full flex-col justify-between rounded-2xl border border-brand-primary/10 bg-white p-5 transition-all hover:border-brand-primary/30 hover:shadow-[0_2px_4px_-1px_rgba(27,77,62,0.06),0_20px_40px_-20px_rgba(27,77,62,0.25)]"
                >
                  <div>
                    <p className="font-heading text-lg font-bold text-brand-primary-dark">
                      {area.name}
                    </p>
                    <p className="mt-0.5 font-sans text-xs uppercase tracking-[0.1em] text-brand-primary-dark/45">
                      {area.region}
                    </p>
                  </div>
                  <p className="mt-4 flex items-center justify-between font-sans text-sm text-brand-primary-dark/70">
                    <span>
                      Avg{" "}
                      <span className="font-bold text-brand-primary-dark">
                        {area.avgPriceFormatted}
                      </span>
                    </span>
                    <ArrowRight
                      className="size-4 text-brand-primary transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-heading" className="flex flex-col gap-8">
          <div className="max-w-2xl">
            <h2
              id="faq-heading"
              className="font-heading text-3xl font-bold tracking-[-0.02em] text-brand-primary-dark sm:text-4xl"
            >
              Sold prices — your questions answered
            </h2>
            <p className="mt-3 font-sans text-base leading-relaxed text-brand-primary-dark/65">
              How to read the data, where it comes from and what it can — and
              can&apos;t — tell you.
            </p>
          </div>
          <dl className="flex flex-col divide-y divide-brand-primary/10 overflow-hidden rounded-2xl border border-brand-primary/10 bg-white">
            {AREA_PRICES_FAQ.map((item) => (
              <div key={item.question} className="p-6">
                <dt className="font-heading text-base font-bold text-brand-primary-dark">
                  {item.question}
                </dt>
                <dd className="mt-2 font-sans text-sm leading-relaxed text-brand-primary-dark/65">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
