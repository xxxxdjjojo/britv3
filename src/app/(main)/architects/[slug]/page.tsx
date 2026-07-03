/**
 * Architect Public Profile Page
 *
 * SSR page at /architects/[slug] that renders a full architect profile with
 * RIBA/ARB credentials, specialisms, reviews, and sidebar CTA.
 *
 * Category validation: provider must have "architect" in their services
 * array. If not, notFound() is called to prevent mismatched slug loading.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchProviderBySlug,
  fetchProviderReviews,
} from "@/services/providers/public-profile-service";
import { buildProviderJsonLd } from "@/lib/providers/jsonld";
import ProviderHero from "@/components/providers/ProviderHero";
import SpecialistSidebar from "@/components/providers/SpecialistSidebar";
import { ReviewsTab } from "@/components/providers/ReviewsTab";
import { ProfileTabs } from "@/components/profiles/ProfileTabs";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const provider = await fetchProviderBySlug(slug);
  if (!provider) {
    return { title: "Architect Not Found | TrueDeed" };
  }
  return {
    title: `${provider.business_name} | Architect | TrueDeed`,
    description:
      provider.description ??
      `View ${provider.business_name}'s architecture portfolio, credentials, and reviews on TrueDeed.`,
  };
}

export default async function ArchitectProfilePage({ params }: Params) {
  const { slug } = await params;
  const provider = await fetchProviderBySlug(slug);

  if (!provider) {
    notFound();
  }

  // Category validation: ensure this provider offers architect services
  const services = provider.services ?? [];
  if (!services.includes("architect" as never)) {
    notFound();
  }

  const [reviews] = await Promise.all([fetchProviderReviews(provider.id, 1)]);

  const jsonLd = buildProviderJsonLd(provider, "architects");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-dvh bg-surface dark:bg-slate-950">
        <ProviderHero provider={provider} category="architect" />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ProfileTabs
                tabs={[
                  {
                    id: "overview",
                    label: "Overview",
                    content: (
                      <section className="space-y-6">
                        <h2 className="text-xl font-bold text-foreground dark:text-white">
                          Professional Credentials
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {(provider.qualifications ?? []).some((q) =>
                            q.toLowerCase().startsWith("riba"),
                          ) && (
                            <div className="bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-xl">
                              <p className="text-xs font-bold text-brand-primary uppercase tracking-wide">
                                RIBA Member
                              </p>
                              <p className="text-sm font-semibold text-foreground dark:text-white mt-0.5">
                                Royal Institute of British Architects
                              </p>
                            </div>
                          )}
                          {(provider.qualifications ?? []).some((q) =>
                            q.toLowerCase().startsWith("arb"),
                          ) && (
                            <div className="bg-success/10 border border-success/20 p-4 rounded-xl">
                              <p className="text-xs font-bold text-success uppercase tracking-wide">
                                ARB Registered
                              </p>
                              <p className="text-sm font-semibold text-foreground dark:text-white mt-0.5">
                                Architects Registration Board
                              </p>
                            </div>
                          )}
                          {provider.years_experience !== null &&
                            provider.years_experience > 0 && (
                              <div className="bg-white dark:bg-slate-900 border border-border dark:border-slate-800 p-4 rounded-xl">
                                <p className="text-xs font-bold text-muted-foreground dark:text-slate-400 uppercase tracking-wide">
                                  Experience
                                </p>
                                <p className="text-2xl font-bold text-foreground dark:text-white mt-1">
                                  {provider.years_experience}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  years in practice
                                </p>
                              </div>
                            )}
                        </div>
                        {(provider.qualifications ?? []).filter(
                          (q) => !q.includes(":"),
                        ).length > 0 && (
                          <div>
                            <h3 className="text-sm font-bold text-foreground dark:text-slate-300 mb-2">
                              Specialisms
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {(provider.qualifications ?? [])
                                .filter((q) => !q.includes(":"))
                                .map((q) => (
                                  <span
                                    key={q}
                                    className="px-3 py-1 bg-muted dark:bg-slate-800 text-foreground dark:text-slate-300 text-xs font-medium rounded-full capitalize"
                                  >
                                    {q.replace(/_/g, " ")}
                                  </span>
                                ))}
                            </div>
                          </div>
                        )}
                      </section>
                    ),
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
                ctaLabel="Discuss Your Project"
                category="architect"
              />
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}
