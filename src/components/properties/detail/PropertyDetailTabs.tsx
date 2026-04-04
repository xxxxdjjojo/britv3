"use client";

import { useCallback, useEffect, useState } from "react";

const TABS = [
  { id: "overview", label: "Overview", sectionId: "section-overview" },
  { id: "photos", label: "Photos", sectionId: "section-photos" },
  { id: "floor-plan", label: "Floor Plan", sectionId: "section-floor-plan" },
  { id: "map", label: "Map & Area", sectionId: "section-map" },
  { id: "insights", label: "Insights", sectionId: "section-insights" },
  { id: "financial", label: "Financial", sectionId: "section-financial" },
  { id: "roi", label: "ROI", sectionId: "section-roi" },
] as const;

type PropertyDetailTabsProps = Readonly<{
  className?: string;
}>;

export function PropertyDetailTabs({
  className = "",
}: PropertyDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<string>(TABS[0].id);

  // Scroll spy: detect which section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first intersecting entry
        const intersecting = entries.find((e) => e.isIntersecting);
        if (intersecting) {
          const sectionId = intersecting.target.id;
          const tab = TABS.find((t) => t.sectionId === sectionId);
          if (tab) {
            setActiveTab(tab.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );

    // Observe all section elements
    TABS.forEach(({ sectionId }) => {
      const el = document.getElementById(sectionId);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Handle tab click: smooth scroll to section
  const handleTabClick = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <div
      className={`sticky top-[112px] z-10 -mx-4 lg:hidden bg-background border-b border-border ${className}`}
    >
      <div className="scrollbar-hide flex overflow-x-auto px-4 gap-0">
        {TABS.map(({ id, label, sectionId }) => (
          <button
            key={id}
            onClick={() => handleTabClick(sectionId)}
            className={`flex-shrink-0 py-2.5 px-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === id
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            aria-current={activeTab === id ? "page" : undefined}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
