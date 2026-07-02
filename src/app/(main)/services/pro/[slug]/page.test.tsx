import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const fetchProviderBySlug = vi.fn();
const fetchProviderReviews = vi.fn();
const fetchPortfolioItems = vi.fn();
const fetchProviderServices = vi.fn();
const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  notFound: () => notFound(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: vi.fn() } }),
}));

vi.mock("@/services/providers/public-profile-service", () => ({
  fetchProviderBySlug: (...a: unknown[]) => fetchProviderBySlug(...a),
  fetchProviderReviews: (...a: unknown[]) => fetchProviderReviews(...a),
  fetchPortfolioItems: (...a: unknown[]) => fetchPortfolioItems(...a),
  fetchProviderServices: (...a: unknown[]) => fetchProviderServices(...a),
}));

import TradespersonProfilePage from "./page";

const PROVIDER = {
  id: "prov-1",
  business_name: "Marcus Sterling Plumbing",
  description: "Master plumber and gas engineer.",
  slug: "marcus-sterling-plumbing",
  services: ["plumber"],
  city: "London",
  years_experience: 12,
  phone: "020 7946 0000",
  qualifications: ["Gas Safe"],
  insurance_verified: true,
  provider_rating_stats: {
    average_rating: 4.9,
    total_reviews: 124,
    count_5_star: 120,
    count_4_star: 4,
    count_3_star: 0,
    count_2_star: 0,
    count_1_star: 0,
    provider_id: "prov-1",
  },
  profiles: {
    id: "prov-1",
    avatar_url: null,
    full_name: "Marcus Sterling",
    provider_verification_status: "verified",
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  fetchProviderReviews.mockResolvedValue({ reviews: [], total: 0 });
  fetchPortfolioItems.mockResolvedValue([]);
  fetchProviderServices.mockResolvedValue([]);
});

describe("TradespersonProfilePage (/services/pro/[slug])", () => {
  it("renders the provider's business name as the page heading", async () => {
    fetchProviderBySlug.mockResolvedValue(PROVIDER);
    render(
      await TradespersonProfilePage({
        params: Promise.resolve({ slug: "marcus-sterling-plumbing" }),
      }),
    );
    expect(
      screen.getByRole("heading", { level: 1, name: /Marcus Sterling Plumbing/i }),
    ).toBeInTheDocument();
  });

  it("looks the provider up by the slug from the URL", async () => {
    fetchProviderBySlug.mockResolvedValue(PROVIDER);
    await TradespersonProfilePage({
      params: Promise.resolve({ slug: "marcus-sterling-plumbing" }),
    });
    expect(fetchProviderBySlug).toHaveBeenCalledWith("marcus-sterling-plumbing");
  });

  it("calls notFound() when no provider matches the slug", async () => {
    fetchProviderBySlug.mockResolvedValue(null);
    await expect(
      TradespersonProfilePage({
        params: Promise.resolve({ slug: "does-not-exist" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });
});
