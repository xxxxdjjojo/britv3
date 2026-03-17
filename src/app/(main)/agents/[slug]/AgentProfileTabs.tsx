"use client";

/**
 * AgentProfileTabs — Client Component (island)
 *
 * URL hash-persistent tab switcher for the estate agent public profile page.
 * Uses the shared ProfileTabs component for consistent hash deep-linking
 * and accessible tab navigation across all profile pages.
 *
 * Tabs: Overview, Active Listings, Sold/Let, Team Members, Reviews, Request Valuation.
 */

import type React from "react";
import { ProfileTabs } from "@/components/profiles/ProfileTabs";

type AgentProfileTabsProps = Readonly<{
  activeListingsCount: number;
  soldLetCount: number;
  overview: React.ReactNode;
  listings: React.ReactNode;
  soldLet: React.ReactNode;
  reviews: React.ReactNode;
  team: React.ReactNode;
  requestValuation: React.ReactNode;
}>;

export default function AgentProfileTabs({
  activeListingsCount,
  soldLetCount,
  overview,
  listings,
  soldLet,
  reviews,
  team,
  requestValuation,
}: AgentProfileTabsProps) {
  return (
    <ProfileTabs
      tabs={[
        { id: "overview", label: "Overview", content: overview },
        {
          id: "listings",
          label: `Active Listings (${activeListingsCount})`,
          content: listings,
        },
        {
          id: "sold_let",
          label: `Sold/Let (${soldLetCount})`,
          content: soldLet,
        },
        { id: "team", label: "Team Members", content: team },
        { id: "reviews", label: "Reviews", content: reviews },
        {
          id: "valuation",
          label: "Request Valuation",
          content: requestValuation,
        },
      ]}
    />
  );
}
