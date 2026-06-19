import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Minimal fetch stub so the component doesn't throw during render
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
  );
});

import { ProfileEditForm } from "./ProfileEditForm";
import type { ServiceProviderDetails } from "@/services/provider/provider-profile-service";

const MOCK_PROFILE: ServiceProviderDetails = {
  id: "provider-1",
  user_id: "user-1",
  business_name: "Acme Plumbing",
  phone: "+44 7700 900000",
  website: "https://acme.example.com",
  description: "We fix pipes.",
  services: ["plumber"],
  hourly_rate: 65,
  avatar_url: null,
  address: "12 High Street",
  city: "Manchester",
  postcode: "M1 1AA",
  years_experience: 8,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

describe("ProfileEditForm", () => {
  it("renders the Business Identity section heading", () => {
    render(<ProfileEditForm profile={MOCK_PROFILE} userId="user-1" />);
    expect(screen.getByText("Business Identity")).toBeInTheDocument();
  });

  it("renders the Credentials & Insurance section heading", () => {
    render(<ProfileEditForm profile={MOCK_PROFILE} userId="user-1" />);
    // The JSX uses &amp; entity; React renders the decoded text
    expect(
      screen.getByText(/credentials.*insurance/i),
    ).toBeInTheDocument();
  });

  it("renders the Service Categories section heading", () => {
    render(<ProfileEditForm profile={MOCK_PROFILE} userId="user-1" />);
    expect(screen.getByText("Service Categories")).toBeInTheDocument();
  });

  it("pre-fills the business name input from profile", () => {
    render(<ProfileEditForm profile={MOCK_PROFILE} userId="user-1" />);
    const input = screen.getByRole("textbox", { name: /business name/i });
    expect(input).toHaveValue("Acme Plumbing");
  });

  it("renders the Save Changes submit button", () => {
    render(<ProfileEditForm profile={MOCK_PROFILE} userId="user-1" />);
    expect(
      screen.getByRole("button", { name: /save changes/i }),
    ).toBeInTheDocument();
  });

  it("renders the Discard button", () => {
    render(<ProfileEditForm profile={MOCK_PROFILE} userId="user-1" />);
    expect(
      screen.getByRole("button", { name: /discard/i }),
    ).toBeInTheDocument();
  });

  it("renders the PRIMARY badge on the Business Identity card", () => {
    render(<ProfileEditForm profile={MOCK_PROFILE} userId="user-1" />);
    expect(screen.getByText("PRIMARY")).toBeInTheDocument();
  });

  it("renders the upload profile photo button", () => {
    render(<ProfileEditForm profile={MOCK_PROFILE} userId="user-1" />);
    expect(
      screen.getByRole("button", { name: /upload profile photo/i }),
    ).toBeInTheDocument();
  });
});
