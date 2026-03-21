import type { Metadata } from "next";
import Link from "next/link";
import {
  Droplets,
  Zap,
  ClipboardCheck,
  Hammer,
  Home,
  Trees,
  Paintbrush,
  Thermometer,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  fetchTopRatedProviders,
  fetchCategoryCounts,
  FALLBACK_PROVIDERS,
  FALLBACK_COUNTS,
} from "@/services/marketplace/services-hub-data";
import { ServiceSearchBar } from "@/components/services/ServiceSearchBar";
import TopRatedCarousel from "@/components/services/TopRatedCarousel";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Find Trusted Professionals | Britestate Services",
  description:
    "Browse verified tradespeople, agents, brokers and specialists. Connect with over 5,000+ professionals through our rigorous 3+3 verification process.",
};

const POPULAR_CATEGORIES = [
  { key: "plumber", label: "Plumbers", icon: Droplets, href: "/services/tradespeople?category=plumber" },
  { key: "electrician", label: "Electricians", icon: Zap, href: "/services/tradespeople?category=electrician" },
  { key: "surveying", label: "Surveyors", icon: ClipboardCheck, href: "/services/surveyors" },
  { key: "carpenter", label: "Carpenters", icon: Hammer, href: "/services/tradespeople?category=carpenter" },
  { key: "builder", label: "Roofers", icon: Home, href: "/services/tradespeople?category=builder" },
  { key: "landscaping", label: "Landscapers", icon: Trees, href: "/services/tradespeople?category=landscaping" },
  { key: "painter", label: "Painters", icon: Paintbrush, href: "/services/tradespeople?category=painter" },
  { key: "handyman", label: "HVAC", icon: Thermometer, href: "/services/tradespeople?category=handyman" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Search",
    description:
      "Describe your project and location to see a list of matched, verified professionals.",
  },
  {
    step: "02",
    title: "Compare",
    description:
      "Review profiles, portfolios, and real-time client ratings to find your perfect fit.",
  },
  {
    step: "03",
    title: "Book with AI",
    description:
      "Our AI assistant handles scheduling and escrow payments for complete safety.",
    highlighted: true,
  },
];

export default async function ServicesPage() {
  const supabase = await createClient();

  const [topProviders, categoryCounts] = await Promise.all([
    fetchTopRatedProviders(supabase).catch(() => null),
    fetchCategoryCounts(supabase).catch(() => null),
  ]);

  const providers = topProviders ?? FALLBACK_PROVIDERS;
  const counts = categoryCounts ?? FALLBACK_COUNTS;

  return (
    <div className="min-h-screen bg-white">
      {/* ── Section 1: Hero + Search Bar ── */}
      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-primary/5 via-white to-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-secondary/20 bg-brand-secondary/10 px-4 py-1.5 text-sm font-semibold text-brand-secondary">
            World-Class Trade Marketplace
          </span>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-brand-primary sm:text-5xl lg:text-6xl">
            Find Trusted{" "}
            <span className="italic text-brand-secondary">Tradespeople</span>{" "}
            Near You
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-primary/60">
            Connect with over 5,000+ verified professionals across every trade.
            All vetted through our rigorous 3+3 verification process.
          </p>
          <div className="mt-10">
            <ServiceSearchBar />
          </div>
        </div>
      </section>

      {/* ── Section 2: Popular Categories Grid ── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="font-heading text-3xl font-bold text-brand-primary sm:text-4xl">
                Popular Categories
              </h2>
              <p className="mt-2 text-brand-primary/60">
                Browse the most in-demand professionals on Britestate.
              </p>
            </div>
            <Link
              href="/services/tradespeople"
              className="hidden items-center gap-1.5 text-sm font-semibold text-brand-secondary hover:underline sm:flex"
            >
              View All Categories
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {POPULAR_CATEGORIES.map((category) => {
              const Icon = category.icon;
              const count = counts[category.key] ?? 0;
              return (
                <Link
                  key={category.key}
                  href={category.href}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-brand-primary/5 bg-white p-6 text-center transition-all hover:-translate-y-1 hover:border-brand-primary/15 hover:shadow-lg hover:shadow-brand-primary/5"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/5 transition-colors group-hover:bg-brand-primary/10">
                    <Icon className="h-7 w-7 text-brand-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-semibold text-brand-primary">
                      {category.label}
                    </h3>
                    <p className="mt-0.5 text-sm text-brand-primary/50">
                      {count} verified pros
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 text-center sm:hidden">
            <Link
              href="/services/tradespeople"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-secondary hover:underline"
            >
              View All Categories
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Section 3: Top-Rated Pros Carousel ── */}
      <TopRatedCarousel providers={providers} />

      {/* ── Section 4: How It Works ── */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="font-heading text-3xl font-bold text-brand-primary sm:text-4xl">
              Simple, Seamless, Secure
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-brand-primary/60">
              Getting the right professional has never been easier.
            </p>
          </div>

          <div className="relative flex flex-col items-center gap-12 md:flex-row md:items-start md:justify-between md:gap-0">
            {/* Connecting line on desktop */}
            <div className="absolute left-[16.67%] right-[16.67%] top-8 hidden h-px bg-brand-primary/10 md:block" />

            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                className="relative flex flex-1 flex-col items-center text-center"
              >
                <div
                  className={`relative z-10 mb-6 flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold ${
                    item.highlighted
                      ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/30"
                      : "border-2 border-brand-primary/20 bg-white text-brand-primary"
                  }`}
                >
                  {item.highlighted ? (
                    <Search className="h-6 w-6" />
                  ) : (
                    item.step
                  )}
                </div>
                <h3 className="font-heading text-xl font-semibold text-brand-primary">
                  {item.title}
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-brand-primary/60">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: Trust / 3+3 Verification ── */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Left column: content */}
            <div>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary/10">
                <ShieldCheck className="h-7 w-7 text-brand-primary" />
              </div>
              <h2 className="font-heading text-3xl font-bold text-brand-primary sm:text-4xl">
                The Britestate 3+3 Verification Standard
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-brand-primary/60">
                Every professional on our platform goes through a rigorous
                six-point verification process — three identity checks and three
                competency checks — so you can hire with absolute confidence.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  "Satisfaction Guarantee",
                  "Public Liability Insurance",
                  "Criminal record checks",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                    <span className="font-medium text-brand-primary">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/services/tradespeople"
                className="mt-10 inline-flex items-center gap-2 rounded-xl bg-brand-primary px-8 py-3.5 font-semibold text-white transition-colors hover:bg-brand-primary/90"
              >
                Browse Verified Pros
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Right column: decorative placeholder */}
            <div className="relative flex items-center justify-center rounded-3xl bg-gradient-to-br from-brand-primary/10 to-brand-primary/5 p-16 lg:p-24">
              <ShieldCheck className="h-32 w-32 text-brand-primary/20" />
              <div className="absolute inset-0 rounded-3xl border border-brand-primary/5" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 6: Bottom CTA ── */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-7xl rounded-3xl bg-gradient-to-r from-brand-primary to-brand-primary/80 p-12 text-center sm:p-16">
          <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
            Post a Job — Get Free Quotes
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
            Describe your project once and receive quotes from verified
            professionals near you.
          </p>
          <Link
            href="/post-a-job"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-10 py-4 font-bold text-brand-primary transition-colors hover:bg-gray-100"
          >
            Post a Job Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
