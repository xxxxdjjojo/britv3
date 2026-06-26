import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import LandlordGuidePage, {
  metadata,
} from "@/app/(main)/guides/landlord-guide/page";

// The download form is a client component that fetches on submit; the page
// test only needs it to render, so stub fetch to a no-op.
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ ok: true }),
}) as unknown as typeof fetch;

describe("Landlord guide landing page", () => {
  it("exposes SEO metadata (title, description, canonical, OG)", () => {
    expect(metadata.title).toMatch(/landlord/i);
    expect(metadata.description).toMatch(/landlord/i);
    expect(metadata.alternates?.canonical).toBe("/guides/landlord-guide");
    expect(metadata.openGraph?.title).toMatch(/landlord/i);
  });

  it("renders the hero heading", () => {
    render(<LandlordGuidePage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /landlord's essential guide/i }),
    ).toBeInTheDocument();
  });

  it("renders the 'What's inside' section with chapter topics", () => {
    render(<LandlordGuidePage />);
    expect(
      screen.getByRole("heading", { name: /every landlord essential/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/HMO licensing basics/i)).toBeInTheDocument();
    expect(screen.getByText(/Section 24 essentials/i)).toBeInTheDocument();
  });

  it("renders the email capture form (download form)", () => {
    render(<LandlordGuidePage />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send me the guide/i }),
    ).toBeInTheDocument();
  });

  it("emits Article JSON-LD structured data", () => {
    const { container } = render(<LandlordGuidePage />);
    const ld = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(ld).not.toBeNull();
    expect(ld?.textContent).toContain('"@type":"Article"');
  });
});
