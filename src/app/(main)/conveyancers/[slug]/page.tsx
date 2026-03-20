/**
 * Conveyancer / Solicitor Public Profile Page
 *
 * SSR page at /conveyancers/[slug] that renders a full conveyancer or
 * solicitor profile with SRA/CLC regulatory badge, fee table (purchase/sale/
 * remortgage), turnaround time, no-sale-no-fee badge, reviews, and sidebar CTA.
 *
 * Category validation: provider must have "conveyancing" in their services
 * array. If not, notFound() is called to prevent mismatched slug loading.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchProviderBySlug,
  fetchProviderReviews,
} from "@/services/providers/public-profile-service";
import { buildSpecialistJsonLd } from "@/lib/providers/jsonld";
import SpecialistHero from "@/components/providers/SpecialistHero";
import { ConveyancerCredentials } from "@/components/providers/SpecialistCredentials";
import SpecialistSidebar from "@/components/providers/SpecialistSidebar";
import { ReviewsTab } from "@/components/providers/ReviewsTab";
import { ProfileTabs } from "@/components/profiles/ProfileTabs";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const provider = await fetchProviderBySlug(slug);
  if (!provider) {
    return { title: "Conveyancer Not Found" };
  }
  return {
    title: `${provider.business_name} | Conveyancer`,
    description:
      provider.description ??
      `View ${provider.business_name}'s conveyancer profile, SRA/CLC credentials, fees, and reviews on Britestate.`,
    openGraph: {
      title: `${provider.business_name} | Conveyancer`,
      description: provider.description ?? undefined,
      type: "profile",
      images: provider.profiles.avatar_url ? [{ url: provider.profiles.avatar_url }] : [],
    },
  };
}

export default async function ConveyancerProfilePage({ params }: Params) {
  const { slug } = await params;
  const provider = await fetchProviderBySlug(slug);

  if (!provider) {
    notFound();
  }

  // Category validation: ensure this provider offers conveyancing services
  const services = provider.services ?? [];
  if (!services.includes("conveyancing" as never)) {
    notFound();
  }

  const [reviews] = await Promise.all([fetchProviderReviews(provider.id, 1)]);

  const jsonLd = buildSpecialistJsonLd(provider, "conveyancer", "conveyancers");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <main className="max-w-7xl mx-auto px-6 py-8">
          <SpecialistHero provider={provider} specialistType="conveyancer" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ProfileTabs
                tabs={[
                  {
                    id: "overview",
                    label: "Overview",
                    content: <ConveyancerCredentials provider={provider} />,
                  },
                  {
                    id: "reviews",
                    label: "Reviews",
                    content: (
                      <ReviewsTab
                        reviews={reviews.reviews}
                        total={reviews.total}
                        providerName={provider.business_name}
                        providerId={provider.id}
                      />
                    ),
                  },
                ]}
              />
            </div>
            <aside>
              <SpecialistSidebar
                provider={provider}
                ctaLabel="Get a Quote"
                ctaHref="#quote"
              />
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}
