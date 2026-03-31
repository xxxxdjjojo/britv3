"use client";

/**
 * ProfileTabs — Reusable client component for hash-based tab navigation.
 *
 * "Invisible Estate" design: brand-primary (#1B4D3E) active indicator,
 * surface/80 sticky background, no 1px border lines replaced with
 * background colour shift.
 *
 * Reads window.location.hash on mount to set the initial active tab.
 * Updates the hash on tab click for deep-linking / bookmarking.
 * All tab panels are rendered but hidden via CSS display toggling
 * so that Server Component children are not unmounted.
 *
 * Accessibility: role="tablist", role="tab", aria-selected, role="tabpanel".
 */

import { useEffect, useState, useId, useRef } from "react";

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
  // Initialise from URL hash — read once on mount, no reactive loop
  const initialised = useRef(false);
  const [activeTab, setActiveTab] = useState(() => tabs[0]?.id ?? "");

  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    const hash = window.location.hash.replace("#", "");
    if (hash && tabs.some((t) => t.id === hash)) {
      setActiveTab(hash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTabChange(tabId: string) {
    setActiveTab(tabId);
    history.replaceState(null, "", "#" + tabId);
  }

  return (
    <div>
      {/* Sticky tab strip — background-shift surface, no border */}
      <div
        className="sticky top-16 z-40 bg-[#faf9f8]/95 dark:bg-[#0f1a17]/95 backdrop-blur-md mb-8 overflow-x-auto"
        role="tablist"
        aria-label="Profile sections"
      >
        {/* Subtle bottom separator via background shift */}
        <div className="flex gap-1 whitespace-nowrap pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`${instanceId}-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${instanceId}-panel-${tab.id}`}
              onClick={() => handleTabChange(tab.id)}
              className={`relative py-4 px-4 font-semibold text-sm transition-all min-h-[44px] ${
                activeTab === tab.id
                  ? "text-[#1B4D3E] dark:text-[#4ade80]"
                  : "text-[#9ca3af] hover:text-[#374151] dark:hover:text-[#d1d5db]"
              }`}
            >
              {tab.label}
              {/* Brand-primary bottom indicator */}
              {activeTab === tab.id && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1B4D3E] dark:bg-[#4ade80] rounded-t-full"
                  aria-hidden="true"
                />
              )}
            </button>
          ))}
        </div>
        {/* Full-width separator line */}
        <div className="h-px bg-[#e8e6e3] dark:bg-[#1a2822]" aria-hidden="true" />
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
