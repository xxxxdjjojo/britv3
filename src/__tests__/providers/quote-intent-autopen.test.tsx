import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("intent=quote"),
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

import ProviderSidebar from "@/components/providers/ProviderSidebar";

const PROVIDER = {
  id: "phantom",
  user_id: "prov-user-1",
  slug: "richards-plumbing",
  business_name: "Richards Plumbing",
  tagline: null,
  description: null,
  services: ["plumber"],
  city: null,
  service_postcodes: null,
  website_url: null,
  phone: null,
  years_experience: null,
  qualifications: null,
  insurance_verified: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  profiles: { display_name: "Richard", avatar_url: null },
  provider_rating_stats: null,
} as never;

describe("?intent=quote auto-open", () => {
  it("opens the quote modal on mount when intent=quote is present", () => {
    render(<ProviderSidebar provider={PROVIDER} />);
    expect(
      screen.getByText(/what do you need help with/i),
    ).toBeInTheDocument();
  });
});
