/**
 * Estate Agent Public Profile Page
 *
 * SSR page at /agents/[slug] that renders the full agency profile:
 * hero with stat bar, tab navigation island (Active Listings, Sold/Let,
 * Reviews, Our Team), and sidebar CTA + office info.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchAgentBySlug,
  fetchAgentStats,
  fetchAgentListings,
  fetchAgentTeam,
  fetchProviderReviews,
} from "@/services/providers/public-profile-service";
import { buildAgentJsonLd } from "@/lib/providers/jsonld";
import AgencyHero from "@/components/agents/AgencyHero";
import AgentSidebar from "@/components/agents/AgentSidebar";
import ListingsTab from "@/components/agents/ListingsTab";
import SoldLetTab from "@/components/agents/SoldLetTab";
import { AgentReviewsTab } from "@/components/agents/AgentReviewsTab";
import { TeamMembersTab } from "@/components/agents/TeamMembersTab";
import AgentProfileTabs from "./AgentProfileTabs";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const agency = await fetchAgentBySlug(slug);
  if (!agency) {
    return { title: "Agency Not Found" };
  }
  const agencyName = agency.agency?.name ?? agency.display_name;
  const logoUrl = agency.agency?.logo_url ?? null;
  return {
    title: `${agencyName} Estate Agents`,
    description:
      agency.bio ??
      `View ${agencyName}'s listings, sold properties, team and reviews on Britestate.`,
    openGraph: {
      title: agencyName,
      type: "profile",
      images: logoUrl ? [{ url: logoUrl }] : [],
    },
  };
}

export default async function AgentProfilePage({ params }: Params) {
  const { slug } = await params;
  const agency = await fetchAgentBySlug(slug);
  if (!agency) {
    notFound();
  }

  const agencyId = agency.agency?.id ?? agency.id;

  const [stats, activeListings, soldLetListings, agentReviews, team] =
    await Promise.all([
      fetchAgentStats(slug),
      fetchAgentListings(agency.user_id, "active", 1),
      fetchAgentListings(agency.user_id, "sold_let", 1),
      fetchProviderReviews(agency.user_id, 1),
      fetchAgentTeam(agencyId),
    ]);

  const jsonLd = buildAgentJsonLd(agency, stats);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AgencyHero agency={agency} stats={stats} />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <AgentProfileTabs
                activeListingsCount={stats.active_listings_count}
                soldLetCount={stats.sold_count}
                overview={
                  <div className="space-y-6">
                    <section>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                        About {agency.agency?.name ?? agency.display_name}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {agency.bio ?? `${agency.agency?.name ?? agency.display_name} is a trusted estate agency on Britestate.`}
                      </p>
                    </section>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-[#2563EB]">{stats.active_listings_count}</p>
                        <p className="text-xs text-slate-500">Active Listings</p>
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-[#2563EB]">{stats.sold_count}</p>
                        <p className="text-xs text-slate-500">Sold / Let</p>
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-[#2563EB]">{stats.total_reviews}</p>
                        <p className="text-xs text-slate-500">Reviews</p>
                      </div>
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-[#2563EB]">{team.length}</p>
                        <p className="text-xs text-slate-500">Team Members</p>
                      </div>
                    </div>
                  </div>
                }
                listings={
                  <ListingsTab
                    listings={activeListings.listings}
                    total={activeListings.total}
                  />
                }
                soldLet={
                  <SoldLetTab
                    listings={soldLetListings.listings}
                    total={soldLetListings.total}
                  />
                }
                reviews={
                  <AgentReviewsTab
                    reviews={agentReviews.reviews}
                    total={agentReviews.total}
                    agencyName={agency.agency?.name ?? agency.display_name}
                  />
                }
                team={<TeamMembersTab members={team} />}
                requestValuation={
                  <div className="max-w-lg space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Request a Free Valuation
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Fill in your details and {agency.agency?.name ?? agency.display_name} will get back to you with a valuation.
                    </p>
                    <form className="space-y-4" action="#" method="POST">
                      <div>
                        <label htmlFor="val-address" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Property Address
                        </label>
                        <input
                          id="val-address"
                          name="address"
                          type="text"
                          required
                          placeholder="123 High Street, London"
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        />
                      </div>
                      <div>
                        <label htmlFor="val-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Your Name
                        </label>
                        <input
                          id="val-name"
                          name="name"
                          type="text"
                          required
                          placeholder="John Smith"
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        />
                      </div>
                      <div>
                        <label htmlFor="val-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Email
                        </label>
                        <input
                          id="val-email"
                          name="email"
                          type="email"
                          required
                          placeholder="john@example.com"
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        />
                      </div>
                      <div>
                        <label htmlFor="val-phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Phone
                        </label>
                        <input
                          id="val-phone"
                          name="phone"
                          type="tel"
                          placeholder="07700 900000"
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
                      >
                        Request Valuation
                      </button>
                    </form>
                  </div>
                }
              />
            </div>
            <div className="lg:col-span-4">
              <AgentSidebar agency={agency} previewMembers={team.slice(0, 2)} />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
