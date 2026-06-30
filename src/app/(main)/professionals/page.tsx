import type { Metadata } from "next";
import Link from "next/link";

import { categoryLabel, slugForCategory, townSlug } from "@/lib/placements/category-slugs";
import type { ServiceCategory } from "@/types/marketplace";

export const metadata: Metadata = {
  title: "Find Verified Local Property Professionals | TrueDeed",
  description:
    "Browse verified conveyancers, mortgage brokers, surveyors, builders, plumbers and more — trusted local experts for every stage of your property journey.",
  alternates: { canonical: "/professionals" },
};

const POPULAR_CATEGORIES: ServiceCategory[] = [
  "conveyancing",
  "mortgage_broker",
  "surveying",
  "architect",
  "builder",
  "plumber",
  "electrician",
  "moving_company",
];

const POPULAR_TOWNS = ["London", "Manchester", "Birmingham", "Leeds", "Bristol", "Ealing"];

export default function ProfessionalsIndexPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Trusted local property professionals
        </h1>
        <p className="mt-3 text-muted-foreground">
          Verified, reviewed experts for every step — buying, renting, moving and renovating. Choose a profession and
          area to find recommended local specialists.
        </p>
      </header>

      <section aria-labelledby="cats-heading" className="space-y-6">
        <h2 id="cats-heading" className="text-lg font-semibold text-foreground">
          Browse by profession
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {POPULAR_CATEGORIES.map((cat) => {
            const label = categoryLabel(cat);
            const slug = slugForCategory(cat);
            return (
              <div key={cat} className="rounded-2xl border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground">{label}</h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {POPULAR_TOWNS.map((town) => (
                    <li key={town}>
                      <Link
                        href={`/professionals/${townSlug(town)}/${slug}`}
                        className="rounded-full border border-[color:var(--color-brand-primary-lighter,#E8F5EE)] px-3 py-1 text-xs font-medium text-[color:var(--color-brand-primary,#1B4D3E)] transition-colors hover:bg-[color:var(--color-brand-primary-lighter,#E8F5EE)]"
                      >
                        {town}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <p className="mt-10 rounded-xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
        Run a local property business?{" "}
        <Link href="/dashboard/provider/boost" className="font-medium text-[color:var(--color-brand-primary,#1B4D3E)] hover:underline">
          Feature your profile to reach customers at the point of decision
        </Link>
        .
      </p>
    </main>
  );
}
