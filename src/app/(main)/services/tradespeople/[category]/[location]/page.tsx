import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { searchProviders } from "@/services/marketplace/provider-service";
import { ProviderSearchCard } from "@/components/providers/ProviderSearchCard";
import type { ServiceCategory } from "@/types/marketplace";
import type { ServiceProviderPublicProfile } from "@/types/providers";

export const revalidate = 3600; // 1 hour ISR

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toTitleCase(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const CATEGORY_SLUG_TO_ENUM: Record<string, ServiceCategory> = {
  plumbers: "plumber",
  electricians: "electrician",
  builders: "handyman",
  painters: "other",
  carpenters: "other",
  landscapers: "landscaping",
  cleaners: "cleaning",
};

function categoryToEnum(categorySlug: string): ServiceCategory | undefined {
  return CATEGORY_SLUG_TO_ENUM[categorySlug.toLowerCase()];
}

// ---------------------------------------------------------------------------
// Static params for ISR pre-generation
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  const categories = [
    "plumbers",
    "electricians",
    "builders",
    "painters",
    "carpenters",
    "landscapers",
    "cleaners",
  ];
  const locations = [
    "london",
    "manchester",
    "birmingham",
    "leeds",
    "liverpool",
    "sheffield",
    "bristol",
    "newcastle",
    "nottingham",
    "leicester",
    "coventry",
    "bradford",
    "cardiff",
    "belfast",
    "edinburgh",
    "glasgow",
    "southampton",
    "portsmouth",
    "reading",
    "oxford",
  ];
  return categories.flatMap((category) =>
    locations.map((location) => ({ category, location })),
  );
}

// ---------------------------------------------------------------------------
// Dynamic metadata
// ---------------------------------------------------------------------------

type PageParams = { category: string; location: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { category, location } = await params;
  return {
    title: `${toTitleCase(category)} in ${toTitleCase(location)} | Britestate`,
    description: `Find trusted ${toTitleCase(category).toLowerCase()} in ${toTitleCase(location)}. Compare reviews, prices and get free quotes.`,
  };
}

// ---------------------------------------------------------------------------
// FAQ section (static SEO content)
// ---------------------------------------------------------------------------

function FaqSection({
  categoryDisplay,
  locationDisplay,
}: Readonly<{
  categoryDisplay: string;
  locationDisplay: string;
}>) {
  const faqs = [
    {
      q: `How much does a ${categoryDisplay.toLowerCase()} cost in ${locationDisplay}?`,
      a: `Prices for ${categoryDisplay.toLowerCase()} in ${locationDisplay} vary depending on the scope of work, materials, and the individual tradesperson. We recommend getting at least 3 quotes to compare. Use Britestate to request free, no-obligation quotes from verified local tradespeople.`,
    },
    {
      q: `Are ${categoryDisplay.toLowerCase()}s in ${locationDisplay} insured?`,
      a: `All Britestate-verified ${categoryDisplay.toLowerCase()}s carry public liability insurance as a minimum. Look for the "Insured" badge on provider profiles to confirm their insurance status has been checked by our team.`,
    },
    {
      q: `How do I find a reliable ${categoryDisplay.toLowerCase()} in ${locationDisplay}?`,
      a: `Use Britestate to search verified ${categoryDisplay.toLowerCase()}s in ${locationDisplay}, read genuine customer reviews, check qualifications and insurance, then request quotes directly. Our verification process ensures only trusted tradespeople appear in results.`,
    },
    {
      q: `How long does it typically take to hire a ${categoryDisplay.toLowerCase()} in ${locationDisplay}?`,
      a: `Response times vary, but most verified ${categoryDisplay.toLowerCase()}s on Britestate respond within 24 hours. For urgent jobs, filter by availability or contact providers directly through their profile page.`,
    },
    {
      q: `What qualifications should a ${categoryDisplay.toLowerCase()} in ${locationDisplay} have?`,
      a: `Qualification requirements depend on the trade. Britestate verifies qualifications and accreditations for all listed professionals. Check each provider's profile for their specific certifications, trade body memberships, and verification badges.`,
    },
  ];

  return (
    <section className="mt-12 bg-[#f4f3f2] rounded-2xl p-8">
      <h2
        className="font-heading text-xl font-bold text-[#1B4D3E] mb-6"
        style={{ letterSpacing: "-0.01em" }}
      >
        Frequently Asked Questions
      </h2>
      <div className="space-y-6">
        {faqs.map((faq) => (
          <div key={faq.q}>
            <h3 className="font-semibold text-[#1B4D3E] mb-1">
              {faq.q}
            </h3>
            <p className="text-sm text-[#1B4D3E]/60 leading-relaxed">
              {faq.a}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Breadcrumb
// ---------------------------------------------------------------------------

function Breadcrumb({
  categoryDisplay,
  locationDisplay,
  categorySlug,
}: Readonly<{
  categoryDisplay: string;
  locationDisplay: string;
  categorySlug: string;
}>) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-[#1B4D3E]/50">
        <li>
          <Link
            href="/"
            className="hover:text-[#1B4D3E] transition-colors"
          >
            Home
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link
            href="/services/tradespeople"
            className="hover:text-[#1B4D3E] transition-colors"
          >
            Services
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li>
          <Link
            href={`/services/tradespeople?category=${categorySlug}`}
            className="hover:text-[#1B4D3E] transition-colors"
          >
            {categoryDisplay}
          </Link>
        </li>
        <li aria-hidden="true">/</li>
        <li
          className="text-[#1B4D3E] font-medium"
          aria-current="page"
        >
          {locationDisplay}
        </li>
      </ol>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type PageProps = Readonly<{
  params: Promise<PageParams>;
}>;

export default async function CategoryLocationPage({ params }: PageProps) {
  const { category, location } = await params;

  const categoryDisplay = toTitleCase(category);
  const locationDisplay = toTitleCase(location);
  const serviceCategory = categoryToEnum(category);

  const supabase = await createClient();

  let providers: ServiceProviderPublicProfile[] = [];

  try {
    const result = await searchProviders(supabase, {
      service_category: serviceCategory,
      search_query: location,
      radius: 25,
    });
    providers = result.data.slice(0, 12) as unknown as ServiceProviderPublicProfile[];
  } catch {
    providers = [];
  }

  return (
    <div className="min-h-screen bg-[#faf9f8]">
      {/* Page header */}
      <div className="relative overflow-hidden bg-[#1B4D3E] py-14 px-4">
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#D4A853]/10 blur-3xl" />
        <div className="relative mx-auto max-w-5xl">
          <h1
            className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl mb-2"
            style={{ letterSpacing: "-0.02em" }}
          >
            {categoryDisplay} in {locationDisplay}
          </h1>
          <p className="text-white/70 text-sm max-w-2xl">
            Find trusted, verified {categoryDisplay.toLowerCase()} in{" "}
            {locationDisplay}. Compare reviews and prices, then get free quotes.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <Breadcrumb
          categoryDisplay={categoryDisplay}
          locationDisplay={locationDisplay}
          categorySlug={category}
        />

        {/* Provider grid */}
        {providers.length === 0 ? (
          <div className="rounded-2xl bg-[#f4f3f2] py-16 text-center">
            <p className="font-semibold text-[#1B4D3E]">
              No {categoryDisplay.toLowerCase()} found in {locationDisplay}
            </p>
            <p className="text-sm mt-1 text-[#1B4D3E]/60">
              Try{" "}
              <Link
                href="/services/tradespeople"
                className="text-[#1B4D3E] font-semibold hover:underline"
              >
                searching all tradespeople
              </Link>{" "}
              or expand your search area.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-[#1B4D3E]/60 mb-4">
              <span className="font-semibold text-[#1B4D3E]">
                {providers.length}
              </span>{" "}
              {categoryDisplay.toLowerCase()}
              {providers.length !== 1 ? "s" : ""} found in {locationDisplay}
            </p>
            <div className="space-y-4">
              {providers.map((provider) => (
                <ProviderSearchCard
                  key={provider.id}
                  provider={provider}
                  category={category}
                />
              ))}
            </div>
          </>
        )}

        {/* FAQ section */}
        <FaqSection
          categoryDisplay={categoryDisplay}
          locationDisplay={locationDisplay}
        />
      </div>
    </div>
  );
}
