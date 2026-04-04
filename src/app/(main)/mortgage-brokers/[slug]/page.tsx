/**
 * Mortgage Broker Public Profile Page
 *
 * SSR page at /mortgage-brokers/[slug] that renders a full mortgage broker
 * profile with FCA regulatory badge, whole-of-market indicator, fee structure,
 * specialisms, reviews, and sidebar CTA.
 *
 * Category validation: provider must have "mortgage_broker" in their services
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
import { MortgageBrokerCredentials } from "@/components/providers/SpecialistCredentials";
import SpecialistSidebar from "@/components/providers/SpecialistSidebar";
import { ReviewsTab } from "@/components/providers/ReviewsTab";
import { ProfileTabs } from "@/components/profiles/ProfileTabs";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const provider = await fetchProviderBySlug(slug);
  if (!provider) {
    return { title: "Mortgage Broker Not Found | Britestate" };
  }
  return {
    title: `${provider.business_name} | Mortgage Broker | Britestate`,
    description:
      provider.description ??
      `View ${provider.business_name}'s mortgage broker profile, FCA credentials, fee structure, and reviews on Britestate.`,
    openGraph: {
      title: `${provider.business_name} | Mortgage Broker`,
      description: provider.description ?? undefined,
      type: "profile",
      images: provider.profiles.avatar_url ? [{ url: provider.profiles.avatar_url }] : [],
    },
  };
}

export default async function MortgageBrokerProfilePage({ params }: Params) {
  const { slug } = await params;
  const provider = await fetchProviderBySlug(slug);

  if (!provider) {
    notFound();
  }

  // Category validation: ensure this provider offers mortgage_broker services
  const services = provider.services ?? [];
  if (!services.includes("mortgage_broker" as never)) {
    notFound();
  }

  const [reviews] = await Promise.all([fetchProviderReviews(provider.id, 1)]);

  const jsonLd = buildSpecialistJsonLd(provider, "mortgage_broker", "mortgage-brokers");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-surface dark:bg-neutral-950">
        <main className="max-w-7xl mx-auto px-6 py-8">
          <SpecialistHero provider={provider} specialistType="mortgage_broker" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ProfileTabs
                tabs={[
                  {
                    id: "overview",
                    label: "Overview",
                    content: <MortgageBrokerCredentials provider={provider} />,
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
                ctaLabel="Get Free Advice"
                ctaHref="#quote"
              />
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}
