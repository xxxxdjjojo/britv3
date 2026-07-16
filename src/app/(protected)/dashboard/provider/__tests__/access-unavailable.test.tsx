import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: "provider-1",
            email_confirmed_at: "2026-07-01T00:00:00Z",
          },
        },
      }),
    },
  }),
}));

vi.mock("@/services/provider/provider-access-state", () => ({
  getProviderAccessState: vi.fn().mockRejectedValue(
    new Error("database unavailable"),
  ),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

import ProviderLayout from "../layout";

describe("provider layout access-state failure", () => {
  it("fails closed with a deterministic unavailable message", async () => {
    const layout = await ProviderLayout({
      children: <div>protected provider content</div>,
    });
    render(layout);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "We can’t verify your provider access right now",
    );
    expect(screen.queryByText("protected provider content")).not.toBeInTheDocument();
  });
});
