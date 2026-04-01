import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Service Provider Reviews | Britestate",
  description:
    "Read verified reviews of tradespeople and service providers across the UK. Browse by area to find trusted professionals.",
};

const POPULAR_AREAS = [
  { code: "SW", label: "South West London" },
  { code: "SE", label: "South East London" },
  { code: "E", label: "East London" },
  { code: "N", label: "North London" },
  { code: "W", label: "West London" },
  { code: "NW", label: "North West London" },
  { code: "EC", label: "Central London" },
  { code: "M", label: "Manchester" },
  { code: "B", label: "Birmingham" },
  { code: "LS", label: "Leeds" },
  { code: "G", label: "Glasgow" },
  { code: "BS", label: "Bristol" },
];

export default async function ReviewsLandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-[#1B4D3E] to-[#2563EB] px-6 py-16 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight">
            Service Provider Reviews
          </h1>
          <p className="text-xl text-white/80">
            Read verified reviews from real customers across the UK. Find trusted
            tradespeople rated by homeowners like you.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="mb-6 text-2xl font-bold">Browse Reviews by Area</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {POPULAR_AREAS.map((area) => (
            <Link
              key={area.code}
              href={`/reviews/${area.code.toLowerCase()}`}
              className="rounded-lg border border-border p-4 transition-colors hover:border-brand-primary hover:text-brand-primary"
            >
              <p className="font-semibold">{area.label}</p>
              <p className="text-sm text-muted-foreground">{area.code}</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 rounded-lg border border-border bg-card p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold">Looking for a tradesperson?</h2>
          <p className="mb-4 text-muted-foreground">
            Post a job for free and get quotes from verified professionals.
          </p>
          <Link
            href="/post-a-job"
            className="inline-block rounded-lg bg-brand-primary px-6 py-2.5 font-semibold text-white hover:bg-[--color-brand-primary-light]"
          >
            Post a Job — Free
          </Link>
        </div>
      </main>
    </div>
  );
}
