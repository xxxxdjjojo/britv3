"use client";

/**
 * ProfileTabs — Client Component (island)
 *
 * URL hash-persistent tab switcher for the tradesperson public profile page.
 * Manages which tab panel is visible via CSS display toggling.
 * Active tab is stored in URL hash for bookmarking / deep-linking.
 */

import { useEffect, useState } from "react";

const TABS = ["about", "services", "portfolio", "reviews"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  about: "About",
  services: "Services & Pricing",
  portfolio: "Portfolio",
  reviews: "Reviews",
};

type ProfileTabsProps = Readonly<{
  about: React.ReactNode;
  services: React.ReactNode;
  portfolio: React.ReactNode;
  reviews: React.ReactNode;
}>;

export function ProfileTabs(props: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("about");

  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as Tab;
    if (TABS.includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  function handleTabChange(value: string) {
    setActiveTab(value as Tab);
    history.replaceState(null, "", "#" + value);
  }

  return (
    <div>
      {/* Sticky tab strip */}
      <div className="sticky top-16 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto">
        <div className="flex gap-8 whitespace-nowrap">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab)}
              className={`py-4 border-b-2 font-semibold text-sm transition-all ${
                activeTab === tab
                  ? "border-[#2563EB] text-[#2563EB]"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      </div>

      {/* Tab panels */}
      <div className={activeTab === "about" ? "block" : "hidden"}>
        {props.about}
      </div>
      <div className={activeTab === "services" ? "block" : "hidden"}>
        {props.services}
      </div>
      <div className={activeTab === "portfolio" ? "block" : "hidden"}>
        {props.portfolio}
      </div>
      <div className={activeTab === "reviews" ? "block" : "hidden"}>
        {props.reviews}
      </div>
    </div>
  );
}
