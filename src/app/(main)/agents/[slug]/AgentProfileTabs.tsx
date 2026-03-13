"use client";

/**
 * AgentProfileTabs — Client Component (island)
 *
 * URL hash-persistent tab switcher for the estate agent public profile page.
 * Manages which tab panel is visible via CSS display toggling.
 * Active tab is stored in URL hash for bookmarking / deep-linking.
 * Tabs: Active Listings, Sold/Let, Reviews, Our Team.
 */

import { useEffect, useState } from "react";
import type React from "react";

const TABS = ["listings", "sold_let", "reviews", "team"] as const;
type Tab = (typeof TABS)[number];

type AgentProfileTabsProps = Readonly<{
  activeListingsCount: number;
  soldLetCount: number;
  listings: React.ReactNode;
  soldLet: React.ReactNode;
  reviews: React.ReactNode;
  team: React.ReactNode;
}>;

export default function AgentProfileTabs({
  activeListingsCount,
  soldLetCount,
  listings,
  soldLet,
  reviews,
  team,
}: AgentProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("listings");

  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as Tab;
    if (TABS.includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    history.replaceState(null, "", "#" + tab);
  }

  const tabLabels: Record<Tab, string> = {
    listings: `Active Listings (${activeListingsCount})`,
    sold_let: `Sold/Let (${soldLetCount})`,
    reviews: "Reviews",
    team: "Our Team",
  };

  return (
    <div>
      {/* Tab strip */}
      <div className="sticky top-16 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto">
        <div className="flex gap-8 whitespace-nowrap">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab)}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all ${
                activeTab === tab
                  ? "border-[#2563EB] text-[#2563EB]"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>
      </div>

      {/* Tab panels */}
      <div className={activeTab === "listings" ? "block mt-8" : "hidden"}>
        {listings}
      </div>
      <div className={activeTab === "sold_let" ? "block mt-8" : "hidden"}>
        {soldLet}
      </div>
      <div className={activeTab === "reviews" ? "block mt-8" : "hidden"}>
        {reviews}
      </div>
      <div className={activeTab === "team" ? "block mt-8" : "hidden"}>
        {team}
      </div>
    </div>
  );
}
