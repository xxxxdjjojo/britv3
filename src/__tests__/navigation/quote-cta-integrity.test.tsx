/**
 * Guard: every "Get a Quote" / "Request Quote" CTA either deep-links to the
 * canonical trader profile with ?intent=quote (one click → modal opens) or
 * opens a working quote form — no circular links, no dead buttons.
 *
 * Root causes this guards against (direct-quote CTA sweep, 2026-07-02):
 *   - ProviderSearchCard "Get a Quote" only anchored to #services (no form).
 *   - Marketplace ProviderProfile "Request Quote" linked BACK to the
 *     marketplace category listing the user just came from (circular).
 *   - MessageThread rendered a "Request Quote" pill with no handler at all.
 *   - Specialist pages passed ctaHref="#quote" to a sidebar whose own CTA was
 *     the *target* of that anchor — a self-anchoring link that did nothing.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { tradespersonProfilePath } from "@/lib/providers/profile-path";

// CompareButton reads compare state from context/storage — irrelevant here.
vi.mock("@/components/providers/CompareButton", () => ({
  CompareButton: () => null,
  default: () => null,
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, loading: false }),
}));
vi.mock("@/hooks/useMessages", () => ({
  useMessages: () => ({
    data: { pages: [{ messages: [] }] },
    isLoading: false,
    error: null,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    isFetchingNextPage: false,
  }),
  useSendMessage: () => ({ mutate: vi.fn(), isPending: false }),
  useMarkAsRead: () => undefined,
}));
vi.mock("@/hooks/useInbox", () => ({
  useDraft: () => ({
    draft: "",
    saveFailed: false,
    save: vi.fn(),
    clear: vi.fn(),
  }),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => {
    const channel = {
      on: () => channel,
      subscribe: () => channel,
      send: vi.fn(),
    };
    return { channel: () => channel, removeChannel: vi.fn() };
  },
}));

import { ProviderSearchCard } from "@/components/providers/ProviderSearchCard";
import { ProviderProfile } from "@/app/(main)/marketplace/[slug]/ProviderProfile";
import { FeaturedExpertCard } from "@/components/placements/FeaturedExpertCard";
import MessageThread from "@/components/messaging/MessageThread";
import type { FeaturedExpert } from "@/types/sponsored-placements";
import type { ServiceProviderPublicProfile } from "@/types/providers";

const SRC = path.join(process.cwd(), "src");

// Fixture shape mirrors src/__tests__/providers/quote-intent-autopen.test.tsx
const SEARCH_PROVIDER = {
  id: "phantom",
  user_id: "prov-user-1",
  slug: "richards-plumbing",
  business_name: "Richards Plumbing",
  tagline: null,
  description: null,
  services: ["plumber"],
  city: null,
  service_postcodes: ["SW1"],
  website_url: null,
  phone: null,
  years_experience: 5,
  qualifications: null,
  insurance_verified: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  profiles: {
    display_name: "Richard",
    avatar_url: null,
    provider_verification_status: "verified",
  },
  provider_rating_stats: null,
} as unknown as ServiceProviderPublicProfile;

// Fixture shape mirrors the ProviderData type in marketplace/[slug]/ProviderProfile.tsx
const MARKETPLACE_PROVIDER = {
  user_id: "prov-user-1",
  business_name: "Richards Plumbing",
  business_description: null,
  slug: "richards-plumbing",
  services: ["plumber" as const],
  service_postcodes: ["SW1"],
  service_radius: 10,
  pricing: {},
  qualifications: null,
  accreditations: null,
  website_url: null,
  years_in_business: 5,
  completed_jobs_count: 12,
  response_time_hours: 2,
  rating_stats: null,
};

// Fixture shape mirrors src/components/placements/FeaturedExpertCard.test.tsx
const EXPERT: FeaturedExpert = {
  placementId: "pl1",
  providerId: "pr1",
  slug: "ealing-plumbing",
  businessName: "Ealing Plumbing Co",
  avatarUrl: null,
  category: "plumber",
  primaryService: "Plumber",
  placementType: "category_leader",
  averageRating: 4.7,
  totalReviews: 32,
  responseTimeHours: 2,
  serviceArea: "W5",
  valueProposition: "Gas Safe registered plumbers covering West London.",
  isVerified: true,
};

describe("quote CTA integrity", () => {
  it("ProviderSearchCard 'Get a Quote' deep-links to the canonical profile with intent=quote and search_card attribution", () => {
    render(<ProviderSearchCard provider={SEARCH_PROVIDER} />);
    const cta = screen.getByRole("link", { name: /get a quote/i });
    expect(cta).toHaveAttribute(
      "href",
      tradespersonProfilePath("richards-plumbing", {
        intent: "quote",
        source: "search_card",
      }),
    );
  });

  it("marketplace ProviderProfile 'Request Quote' links to the canonical profile with intent=quote (not back to the marketplace listing)", () => {
    // Reviews fetch fires in an effect; a failed response is silently ignored.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }),
    );
    render(<ProviderProfile provider={MARKETPLACE_PROVIDER} />);
    const cta = screen.getByRole("link", { name: /request quote/i });
    const href = cta.getAttribute("href") ?? "";
    expect(href.startsWith("/services/pro/")).toBe(true);
    expect(href).toContain("intent=quote");
    expect(href).toContain("source=marketplace_profile");
    expect(href).not.toContain("/marketplace");
    vi.unstubAllGlobals();
  });

  it("FeaturedExpertCard 'Request Quote' keeps intent=quote with sponsored_placement attribution", () => {
    render(<FeaturedExpertCard expert={EXPERT} zone="property_sidebar" />);
    const cta = screen.getByRole("link", { name: /request quote/i });
    expect(cta).toHaveAttribute(
      "href",
      tradespersonProfilePath("ealing-plumbing", {
        intent: "quote",
        source: "sponsored_placement",
      }),
    );
  });

  it("MessageThread renders no dead 'Request Quote' control", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MessageThread conversationId="c1" participantName="Jane" />
      </QueryClientProvider>,
    );
    // The quick-actions bar itself still renders…
    expect(
      screen.getByRole("button", { name: /schedule viewing/i }),
    ).toBeInTheDocument();
    // …but the handler-less Request Quote pill is gone.
    expect(
      screen.queryByRole("button", { name: /request quote/i }),
    ).not.toBeInTheDocument();
  });

  it("specialist pages no longer pass a self-anchoring ctaHref and SpecialistSidebar opens a real quote form", () => {
    const specialistPages = [
      "app/(main)/conveyancers/[slug]/page.tsx",
      "app/(main)/surveyors/[slug]/page.tsx",
      "app/(main)/mortgage-brokers/[slug]/page.tsx",
      "app/(main)/architects/[slug]/page.tsx",
    ];
    for (const rel of specialistPages) {
      const source = readFileSync(path.join(SRC, rel), "utf8");
      expect(source, `${rel} still passes the dead ctaHref="#quote"`).not.toContain(
        'ctaHref="#quote"',
      );
    }
    const sidebar = readFileSync(
      path.join(SRC, "components/providers/SpecialistSidebar.tsx"),
      "utf8",
    );
    expect(sidebar).toContain("QuoteModal");
  });
});
