import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn(() => ({ data: { user: null } })) },
  })),
}));

vi.mock("@/components/marketplace/RFQCreateForm", () => ({
  RFQCreateForm: () => <div data-testid="rfq-form" />,
}));

describe("Post-a-Job page (unauthenticated)", () => {
  it("shows form field labels as a preview when not signed in", async () => {
    const { default: PostAJobPage } = await import("./page");
    const element = await PostAJobPage();
    render(element);

    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Postcode")).toBeInTheDocument();
  });

  it("shows the sign-in CTA overlaid on the preview", async () => {
    const { default: PostAJobPage } = await import("./page");
    const element = await PostAJobPage();
    render(element);

    expect(screen.getByText(/sign in to post a job/i)).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Create Account")).toBeInTheDocument();
  });
});
