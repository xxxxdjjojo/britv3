/**
 * Colocated render test for AgencyBrandingForm (design-parity build).
 *
 * Scope: verifies the component mounts, key sections render, and the
 * two-column layout elements are present. No API calls, no real uploads.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { AgencyBrandingForm } from "@/components/dashboard/agent/AgencyBrandingForm";
import type { AgentAgencyProfile } from "@/types/agent";

// ── Stubs ──────────────────────────────────────────────────────────────────

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://example.com/logo.png" } }),
      }),
    },
  }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("browser-image-compression", () => ({
  default: vi.fn().mockResolvedValue(new File([""], "logo.png")),
}));

// ── Fixtures ────────────────────────────────────────────────────────────────

const minimalProfile: AgentAgencyProfile = {
  id: "prof-1",
  agent_id: "agent-1",
  agency_name: "Apex Property Group",
  logo_url: null,
  brand_primary_colour: "#1a56db",
  brand_secondary_colour: "#7e3af2",
  social_facebook: null,
  social_twitter: null,
  social_instagram: null,
  social_linkedin: null,
  website_url: null,
  description: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
} as AgentAgencyProfile;

// ── Tests ───────────────────────────────────────────────────────────────────

describe("AgencyBrandingForm", () => {
  it("renders the Visual Identity section heading", () => {
    render(<AgencyBrandingForm profile={minimalProfile} />);
    expect(screen.getByText("Visual Identity")).toBeInTheDocument();
  });

  it("renders the Brand Preview section", () => {
    render(<AgencyBrandingForm profile={minimalProfile} />);
    expect(screen.getByText("Brand Preview")).toBeInTheDocument();
  });

  it("renders the agency name in the preview", () => {
    render(<AgencyBrandingForm profile={minimalProfile} />);
    // agency name appears in the live preview
    expect(screen.getByText("Apex Property Group")).toBeInTheDocument();
  });

  it("renders logo upload button", () => {
    render(<AgencyBrandingForm profile={null} />);
    expect(
      screen.getByRole("button", { name: /upload logo/i }),
    ).toBeInTheDocument();
  });

  it("renders colour pickers for primary and secondary brand colours", () => {
    render(<AgencyBrandingForm profile={minimalProfile} />);
    expect(screen.getByLabelText("Primary colour")).toBeInTheDocument();
    expect(screen.getByLabelText("Secondary colour")).toBeInTheDocument();
  });

  it("renders Agency Description textarea", () => {
    render(<AgencyBrandingForm profile={minimalProfile} />);
    expect(screen.getByText("Agency Description")).toBeInTheDocument();
  });

  it("renders Social & Web Links section", () => {
    render(<AgencyBrandingForm profile={minimalProfile} />);
    expect(screen.getByText(/Social.*Web Links/i)).toBeInTheDocument();
  });

  it("renders the Save branding submit button", () => {
    render(<AgencyBrandingForm profile={minimalProfile} />);
    expect(
      screen.getByRole("button", { name: /save branding/i }),
    ).toBeInTheDocument();
  });

  it("renders the Discard Changes button", () => {
    render(<AgencyBrandingForm profile={minimalProfile} />);
    expect(
      screen.getByRole("button", { name: /discard changes/i }),
    ).toBeInTheDocument();
  });
});
