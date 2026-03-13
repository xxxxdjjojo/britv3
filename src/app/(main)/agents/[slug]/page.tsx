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
    return { title: "Agency Not Found | Britestate" };
  }
  const agencyName = agency.agency?.name ?? agency.display_name;
  const logoUrl = agency.agency?.logo_url ?? null;
  return {
    title: `${agencyName} Estate Agents | Britestate`,
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
