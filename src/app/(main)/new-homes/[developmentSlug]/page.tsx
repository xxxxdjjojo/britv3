import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getDevelopmentBySlug,
  getSimilarDevelopments,
} from "@/services/new-homes/developments-service";
import {
  formatBedsRange,
  formatCompletion,
  formatPriceRange,
  schemeTypeLabel,
} from "@/lib/new-homes/format";
import { DevelopmentHeroGallery } from "@/components/new-homes/DevelopmentHeroGallery";
import { DevelopmentStatusBadge } from "@/components/new-homes/AvailabilityBadge";
import { UnitAvailability } from "@/components/new-homes/UnitAvailability";
import { DevelopmentCard } from "@/components/new-homes/DevelopmentCard";
import { DevelopmentViewTracker } from "@/components/new-homes/DevelopmentViewTracker";
import {
  EnquirySidebar,
  MobileEnquiryBar,
} from "@/components/new-homes/DevelopmentEnquiry";
import {
  CompletionTimeline,
  DeveloperProfileBlock,
  IncentivesBlock,
  LocalAreaBlock,
  MortgageCtaBlock,
  SectionCard,
  WhyBuyersBlock,
} from "@/components/new-homes/DevelopmentSections";

export const dynamic = "force-dynamic";

type PageProps = Readonly<{ params: Promise<{ developmentSlug: string }> }>;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { developmentSlug } = await params;
  const development = await getDevelopmentBySlug(developmentSlug);
  if (!development) {
    return { title: "Development not found | TrueDeed" };
  }
  const priceLabel = formatPriceRange(development.priceMin, development.priceMax);
  const title = `${development.name}, ${development.city} — New Homes | TrueDeed`;
  const description =
    development.summary ??
    `New homes at ${development.name} in ${development.city} by ${development.developer.name}. ${priceLabel}.`;
  return {
    title,
    description,
    alternates: { canonical: `/new-homes/${development.slug}` },
    openGraph: { title, description, url: `/new-homes/${development.slug}`, type: "website" },
  };
}

export default async function DevelopmentDetailPage({ params }: PageProps) {
  const { developmentSlug } = await params;
  const development = await getDevelopmentBySlug(developmentSlug);
  if (!development) notFound();

  const similar = await getSimilarDevelopments(development.city, development.id, 3);

  return (
    <div className="bg-neutral-50 pb-24 lg:pb-12">
      <DevelopmentViewTracker developmentId={development.id} />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 lg:px-8">
        <nav className="text-sm text-neutral-500" aria-label="Breadcrumb">
          <Link href="/new-homes" className="hover:text-brand-primary">
            New homes
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-neutral-700">{development.name}</span>
        </nav>
      </div>

      {/* Hero */}
      <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
        <DevelopmentHeroGallery
          media={development.media}
          heroImageUrl={development.heroImageUrl}
          brandColour={development.developer.brandColour}
          name={development.name}
        />
      </div>

      {/* Body */}
      <div className="mx-auto mt-6 grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="space-y-6 lg:col-span-2">
          {/* Header */}
          <header>
            <div className="flex flex-wrap items-center gap-2">
              <DevelopmentStatusBadge status={development.status} />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-neutral-600 ring-1 ring-inset ring-neutral-200">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: development.developer.brandColour ?? "#1B4D3E" }}
                />
                {development.developer.name}
              </span>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-neutral-600 ring-1 ring-inset ring-neutral-200">
                {schemeTypeLabel(development.schemeType)}
              </span>
            </div>
            <h1 className="mt-3 font-heading text-3xl font-bold text-neutral-900 sm:text-4xl">
              {development.name}
            </h1>
            <p className="mt-1 text-neutral-500">
              {development.addressLine ? `${development.addressLine}, ` : ""}
              {development.city}
              {development.postcode ? `, ${development.postcode}` : ""}
            </p>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-1">
              <span className="font-heading text-2xl font-bold text-brand-primary">
                {formatPriceRange(development.priceMin, development.priceMax)}
              </span>
              <span className="text-neutral-600">
                {formatBedsRange(development.bedsMin, development.bedsMax)}
              </span>
              {formatCompletion(development.completionDate) ? (
                <span className="text-neutral-600">
                  {formatCompletion(development.completionDate)}
                </span>
              ) : null}
            </div>
          </header>

          {development.description ? (
            <SectionCard title="About this development">
              <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-600">
                {development.description}
              </p>
            </SectionCard>
          ) : null}

          <WhyBuyersBlock highlights={development.highlights} />

          <SectionCard
            id="availability"
            title="Availability & site plan"
            eyebrow="Live availability"
          >
            <UnitAvailability
              developmentId={development.id}
              developmentName={development.name}
              units={development.units}
            />
          </SectionCard>

          <IncentivesBlock incentives={development.incentives} />
          <CompletionTimeline completionDate={development.completionDate} />
          <LocalAreaBlock
            transport={development.transport}
            schools={development.schools}
            amenities={development.amenities}
          />
          <MortgageCtaBlock />
          <DeveloperProfileBlock developer={development.developer} />
        </div>

        {/* Right rail */}
        <aside className="lg:col-span-1">
          <EnquirySidebar development={development} />
        </aside>
      </div>

      {/* Similar developments */}
      {similar.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="mb-5 font-heading text-xl font-semibold text-neutral-900">
            Similar developments nearby
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((dev) => (
              <DevelopmentCard key={dev.id} development={dev} />
            ))}
          </div>
        </section>
      ) : null}

      <MobileEnquiryBar development={development} />
    </div>
  );
}
