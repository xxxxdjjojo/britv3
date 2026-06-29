import type { Metadata } from "next";
import Link from "next/link";
import { listDevelopments } from "@/services/new-homes/developments-service";
import { parseNewHomesFilters } from "@/lib/new-homes/filters";
import { NewHomesBrowser } from "@/components/new-homes/NewHomesBrowser";

export const metadata: Metadata = {
  title: "New Homes & New Build Developments for Sale | TrueDeed",
  description:
    "Browse new-build homes from regional developers across the UK. Filter by location, price, bedrooms and scheme type. Register interest, book viewings and request brochures directly.",
  alternates: { canonical: "/new-homes" },
  openGraph: {
    title: "New Homes & New Build Developments | TrueDeed",
    description:
      "Discover new-build schemes from trusted regional developers. Help to Buy and First Homes eligible developments, with availability updated by the developer.",
    url: "/new-homes",
    type: "website",
  },
};

// Demo data is local-only; keep this dynamic so newly-published developments
// appear without a rebuild.
export const dynamic = "force-dynamic";

function HeroStat({ value, label }: Readonly<{ value: string; label: string }>) {
  return (
    <div>
      <p className="font-heading text-2xl font-bold text-white sm:text-3xl">{value}</p>
      <p className="text-sm text-white/70">{label}</p>
    </div>
  );
}

export default async function NewHomesPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const rawParams = await searchParams;
  const flat: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(rawParams)) {
    flat[key] = Array.isArray(value) ? value[0] : value;
  }
  const initialFilters = parseNewHomesFilters(flat);
  const developments = await listDevelopments();

  const cities = Array.from(new Set(developments.map((d) => d.city)));
  const totalAvailable = developments.reduce(
    (sum, d) => sum + (d.availableUnits ?? 0),
    0,
  );

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-primary-dark">
        <div className="absolute inset-0 opacity-[0.08] [background-image:repeating-linear-gradient(90deg,#fff_0,#fff_1px,transparent_1px,transparent_40px),repeating-linear-gradient(0deg,#fff_0,#fff_1px,transparent_1px,transparent_40px)]" />
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-brand-gold/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-gold">
            New homes
          </p>
          <h1 className="max-w-3xl font-heading text-4xl font-bold leading-tight text-white sm:text-5xl">
            Brand-new homes from Britain&apos;s regional developers
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">
            Explore new-build developments with live availability, incentives and
            completion dates — and enquire directly with the developer. No
            middlemen, no inflated portal fees.
          </p>

          {developments.length > 0 ? (
            <div className="mt-10 flex flex-wrap gap-10">
              <HeroStat value={`${developments.length}`} label="Developments" />
              <HeroStat value={`${totalAvailable}`} label="Homes available now" />
              <HeroStat value={`${cities.length}`} label="Towns & cities" />
            </div>
          ) : null}
        </div>
      </section>

      {/* Browser */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {developments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-muted py-20 text-center">
            <h2 className="font-heading text-xl font-semibold text-neutral-800">
              New developments are coming soon
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
              We&apos;re onboarding regional developers now. Check back shortly, or
              register your interest to be notified.
            </p>
            <Link
              href="/developers"
              className="mt-5 inline-flex h-10 items-center rounded-lg bg-brand-primary px-4 text-sm font-semibold text-white hover:bg-brand-primary-light"
            >
              Are you a developer? List your scheme
            </Link>
          </div>
        ) : (
          <NewHomesBrowser
            developments={developments}
            initialFilters={initialFilters}
          />
        )}
      </section>
    </div>
  );
}
