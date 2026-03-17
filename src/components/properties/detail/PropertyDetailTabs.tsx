"use client";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type Tab = {
  id: string;
  label: string;
};

const TABS: Tab[] = [
  { id: "overview", label: "Overview" },
  { id: "photos", label: "Photos" },
  { id: "floorplan", label: "Floor Plan" },
  { id: "map", label: "Map" },
  { id: "insights", label: "Insights" },
  { id: "financial", label: "Financial" },
  { id: "roi", label: "ROI" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type PropertyDetailTabsProps = Readonly<{
  activeTab: string;
  onTabChange: (tab: string) => void;
}>;

export function PropertyDetailTabs({
  activeTab,
  onTabChange,
}: PropertyDetailTabsProps) {
  return (
    <nav
      aria-label="Property sections"
      className="lg:hidden -mx-4 px-4 border-b bg-background"
    >
      <div className="flex overflow-x-auto gap-0 pb-0 scrollbar-none">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative shrink-0 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E]/50 rounded-t-sm",
                isActive
                  ? "text-[#1B4D3E]"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.label}

              {/* Active underline */}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#1B4D3E]"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
