"use client";

/**
 * ProfileTabs — Client Component (island)
 *
 * URL hash-persistent tab switcher for the tradesperson public profile page.
 * Wraps the shared ProfileTabs component with the tradesperson-specific tab layout.
 */

import { ProfileTabs as SharedProfileTabs } from "@/components/profiles/ProfileTabs";

type ProfileTabsProps = Readonly<{
  about: React.ReactNode;
  services: React.ReactNode;
  portfolio: React.ReactNode;
  reviews: React.ReactNode;
}>;

export function ProfileTabs(props: ProfileTabsProps) {
  return (
    <SharedProfileTabs
      tabs={[
        { id: "about", label: "About", content: props.about },
        { id: "services", label: "Services & Pricing", content: props.services },
        { id: "portfolio", label: "Portfolio", content: props.portfolio },
        { id: "reviews", label: "Reviews", content: props.reviews },
      ]}
    />
  );
}
