import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin, ShieldCheck, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "Property Service Reviews",
  description:
    "Browse verified reviews for estate agents, mortgage brokers, conveyancers, surveyors, and tradespeople on TrueDeed.",
};

const REVIEW_AREAS = [
  { name: "London", href: "/reviews/london", count: "1,240+" },
  { name: "Manchester", href: "/reviews/manchester", count: "420+" },
  { name: "Birmingham", href: "/reviews/birmingham", count: "380+" },
  { name: "Bristol", href: "/reviews/bristol", count: "260+" },
] as const;

const REVIEW_CATEGORIES = [
  { name: "Estate agents", href: "/agents" },
  { name: "Mortgage brokers", href: "/mortgage-brokers" },
  { name: "Conveyancers", href: "/conveyancers" },
  { name: "Surveyors", href: "/surveyors" },
  { name: "Tradespeople", href: "/marketplace" },
] as const;

export default function ReviewsLandingPage() {
  return (
    <div className="bg-white">
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-brand-primary-lighter px-3 py-1 text-sm font-semibold text-brand-primary">
            <ShieldCheck className="size-4" />
            Verified reviews
          </div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-neutral-950 sm:text-5xl">
            Reviews for trusted property professionals
          </h1>
          <p className="mt-5 text-lg leading-8 text-neutral-600">
            Compare ratings, recent feedback, and verified service quality before
            choosing the people who support your property journey.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_380px]">
          <section>
            <h2 className="font-heading text-2xl font-bold text-neutral-950">
              Browse by area
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {REVIEW_AREAS.map((area) => (
                <Link
                  key={area.href}
                  href={area.href}
                  className="group flex items-center justify-between rounded-lg border border-neutral-200 p-5 transition hover:border-brand-primary hover:shadow-sm"
                >
                  <span>
                    <span className="flex items-center gap-2 font-semibold text-neutral-950">
                      <MapPin className="size-4 text-brand-primary" />
                      {area.name}
                    </span>
                    <span className="mt-1 block text-sm text-neutral-500">
                      {area.count} local reviews
                    </span>
                  </span>
                  <ArrowRight className="size-4 text-neutral-400 transition group-hover:translate-x-1 group-hover:text-brand-primary" />
                </Link>
              ))}
            </div>
          </section>

          <aside className="rounded-lg bg-neutral-950 p-6 text-white">
            <div className="flex items-center gap-2">
              <Star className="size-5 fill-brand-secondary text-brand-secondary" />
              <h2 className="font-heading text-xl font-bold">
                Compare specialists
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Start with a professional category, then narrow by area, rating,
              verification status, and recent review activity.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              {REVIEW_CATEGORIES.map((category) => (
                <Link
                  key={category.href}
                  href={category.href}
                  className="flex items-center justify-between rounded-md bg-white/10 px-3 py-2 text-sm font-medium transition hover:bg-white/15"
                >
                  {category.name}
                  <ArrowRight className="size-4" />
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
