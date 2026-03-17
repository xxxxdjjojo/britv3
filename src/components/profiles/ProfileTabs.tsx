"use client";

/**
 * ProfileTabs — Reusable client component for hash-based tab navigation.
 *
 * Reads window.location.hash on mount to set the initial active tab.
 * Updates the hash on tab click for deep-linking / bookmarking.
 * All tab panels are rendered but hidden via CSS display toggling
 * so that Server Component children are not unmounted.
 *
 * Accessibility: role="tablist", role="tab", aria-selected, role="tabpanel".
 */

import { useEffect, useState, useId } from "react";

export type ProfileTab = {
  id: string;
  label: string;
  content: React.ReactNode;
};

type ProfileTabsProps = Readonly<{
  tabs: ProfileTab[];
}>;

export function ProfileTabs({ tabs }: ProfileTabsProps) {
  const instanceId = useId();
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "");

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (tabs.some((t) => t.id === hash)) {
      setActiveTab(hash);
    }
  }, [tabs]);

  function handleTabChange(tabId: string) {
    setActiveTab(tabId);
    history.replaceState(null, "", "#" + tabId);
  }

  return (
    <div>
      {/* Tab strip */}
      <div
        className="sticky top-16 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto"
        role="tablist"
        aria-label="Profile sections"
      >
        <div className="flex gap-8 whitespace-nowrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`${instanceId}-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${instanceId}-panel-${tab.id}`}
              onClick={() => handleTabChange(tab.id)}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all ${
                activeTab === tab.id
                  ? "border-[#2563EB] text-[#2563EB]"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab panels */}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`${instanceId}-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`${instanceId}-tab-${tab.id}`}
          className={activeTab === tab.id ? "block" : "hidden"}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
