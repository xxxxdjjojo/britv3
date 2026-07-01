import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ServiceProviderPublicProfile } from "@/types/providers";
import TopRatedCarousel from "./TopRatedCarousel";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [k: string]: unknown }) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

function makeMockProvider(overrides?: Partial<ServiceProviderPublicProfile>): ServiceProviderPublicProfile {
  return {
    id: "prov-1",
    user_id: "user-1",
    slug: "acme-plumbing",
    business_name: "Acme Plumbing",
    tagline: "We fix pipes",
    description: "Top plumbing service",
    services: ["plumber"],
    city: "Manchester",
    service_postcodes: ["M1", "M2"],
    website_url: null,
    phone: null,
    years_experience: 10,
    qualifications: null,
    insurance_verified: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    profiles: {
      id: "user-1",
      avatar_url: null,
      full_name: "John Smith",
      provider_verification_status: "verified",
      email: "john@acme.com",
    },
    provider_rating_stats: {
      provider_id: "prov-1",
      average_rating: 4.8,
      total_reviews: 42,
      count_5_star: 30,
      count_4_star: 10,
      count_3_star: 2,
      count_2_star: 0,
      count_1_star: 0,
    },
    ...overrides,
  };
}

describe("TopRatedCarousel", () => {
  it("returns null when providers is empty", () => {
    const { container } = render(<TopRatedCarousel providers={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders heading 'Meet Our Top-Rated Pros'", () => {
    render(<TopRatedCarousel providers={[makeMockProvider()]} />);
    expect(screen.getByText("Meet Our Top-Rated Pros")).toBeInTheDocument();
  });

  it("renders provider business names", () => {
    const providers = [
      makeMockProvider({ id: "p1", business_name: "Alpha Services" }),
      makeMockProvider({ id: "p2", slug: "beta-co", business_name: "Beta Co" }),
    ];
    render(<TopRatedCarousel providers={providers} />);
    expect(screen.getByText("Alpha Services")).toBeInTheDocument();
    expect(screen.getByText("Beta Co")).toBeInTheDocument();
  });

  it("shows rating from provider_rating_stats", () => {
    const provider = makeMockProvider({
      provider_rating_stats: {
        provider_id: "prov-1",
        average_rating: 4.5,
        total_reviews: 20,
        count_5_star: 10,
        count_4_star: 5,
        count_3_star: 3,
        count_2_star: 1,
        count_1_star: 1,
      },
    });
    render(<TopRatedCarousel providers={[provider]} />);
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("(20)")).toBeInTheDocument();
  });

  it("shows city location", () => {
    render(<TopRatedCarousel providers={[makeMockProvider({ city: "London" })]} />);
    expect(screen.getByText("London")).toBeInTheDocument();
  });

  it("links Get Quote to the canonical tradesperson profile", () => {
    const provider = makeMockProvider({ slug: "acme-plumbing", services: ["plumber"] });
    render(<TopRatedCarousel providers={[provider]} />);
    const link = screen.getByRole("link", { name: /get quote/i });
    expect(link).toHaveAttribute("href", "/services/pro/acme-plumbing#quote");
  });

  it("renders prev/next arrow buttons", () => {
    render(<TopRatedCarousel providers={[makeMockProvider()]} />);
    expect(screen.getByLabelText("Scroll left")).toBeInTheDocument();
    expect(screen.getByLabelText("Scroll right")).toBeInTheDocument();
  });
});
