/**
 * Colocated render test for PrivacySettingsPage.
 * Verifies the page mounts without crashing and key headings/controls render.
 * Data/logic is not exercised — mocks prevent real network/auth calls.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// ── Next.js stubs ──────────────────────────────────────────────────────────
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// ── Supabase client stub ───────────────────────────────────────────────────
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut: vi.fn().mockResolvedValue({}) },
  }),
}));

// ── Sonner stub ────────────────────────────────────────────────────────────
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// ── GDPR component stubs ───────────────────────────────────────────────────
vi.mock("@/components/gdpr/ConsentForm", () => ({
  ConsentForm: () => <div data-testid="consent-form" />,
}));
vi.mock("@/components/gdpr/DataExportButton", () => ({
  DataExportButton: () => <button type="button">Download My Data</button>,
}));

// ── ReauthDialog stub ──────────────────────────────────────────────────────
vi.mock("@/components/settings/ReauthDialog", () => ({
  ReauthDialog: () => null,
}));

// ── Fetch stub — returns default settings so loading=false quickly ─────────
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }),
  );
});

// ── Import page AFTER mocks are set up ────────────────────────────────────
import PrivacySettingsPage from "./page";

describe("PrivacySettingsPage", () => {
  it("renders the editorial page heading", async () => {
    render(<PrivacySettingsPage />);
    // Page initially shows loading skeleton then resolves — wait for heading
    const heading = await screen.findByRole("heading", { name: /Privacy & Data/i });
    expect(heading).toBeDefined();
  });

  it("renders all three visibility mode cards", async () => {
    render(<PrivacySettingsPage />);
    expect(await screen.findByRole("button", { name: /Public/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Members Only/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Ghost/i })).toBeDefined();
  });

  it("renders Search Engine Indexing toggle", async () => {
    render(<PrivacySettingsPage />);
    await screen.findByRole("heading", { name: /Profile Visibility/i });
    expect(screen.getByRole("switch", { name: /Search engine indexing/i })).toBeDefined();
  });

  it("renders Consent Preferences section and ConsentForm", async () => {
    render(<PrivacySettingsPage />);
    await screen.findByRole("heading", { name: /Consent Preferences/i });
    expect(screen.getByTestId("consent-form")).toBeDefined();
  });

  it("renders Your Data download button", async () => {
    render(<PrivacySettingsPage />);
    await screen.findByRole("heading", { name: /Your Data/i });
    expect(screen.getByRole("button", { name: /Download My Data/i })).toBeDefined();
  });

  it("renders Delete Account section with destructive trigger", async () => {
    render(<PrivacySettingsPage />);
    await screen.findByRole("heading", { name: /Delete Account/i });
    expect(screen.getByRole("button", { name: /Delete My Account/i })).toBeDefined();
  });
});
