import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const { mockCreateAdminClient, mockResolve, formPropsSpy } = vi.hoisted(() => ({
  mockCreateAdminClient: vi.fn(() => ({ __admin: true })),
  mockResolve: vi.fn(),
  formPropsSpy: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mockCreateAdminClient }));
vi.mock("@/services/provider/reference-submission-service", () => ({
  resolveInvitationByToken: mockResolve,
}));

// Stub the client components so the server component's branching is what's tested.
vi.mock("@/components/reference/ReferenceSubmissionForm", () => ({
  ReferenceSubmissionForm: (props: Record<string, unknown>) => {
    formPropsSpy(props);
    return (
      <div data-testid="submission-form">
        form:{String(props.providerName)}:{String(props.referenceType)}
      </div>
    );
  },
}));
vi.mock("@/components/reference/ReferenceTokenState", () => ({
  ReferenceTokenState: (props: { variant: string }) => (
    <div data-testid="token-state">state:{props.variant}</div>
  ),
}));

import ReferencePage from "./page";

async function renderPage(token = "raw-token") {
  const ui = await ReferencePage({ params: Promise.resolve({ token }) });
  render(ui);
}

beforeEach(() => {
  mockResolve.mockReset();
  formPropsSpy.mockReset();
});

describe("ReferencePage", () => {
  it("resolves server-side with the service-role admin client", async () => {
    mockResolve.mockResolvedValue({ state: "invalid" });
    await renderPage("abc");
    expect(mockCreateAdminClient).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith({ __admin: true }, "abc");
  });

  it("renders the submission form when the token is valid", async () => {
    mockResolve.mockResolvedValue({
      state: "valid",
      reference: {
        id: "ref-1",
        reference_type: "client",
        referee_name: "Jane",
        relationship: "Customer",
        requires_work_date: true,
      },
      provider: { displayName: "Ace Plumbing", trade: "Plumber" },
    });
    await renderPage();
    expect(screen.getByTestId("submission-form").textContent).toContain("Ace Plumbing");
    expect(screen.getByTestId("submission-form").textContent).toContain("client");
    expect(screen.queryByTestId("token-state")).toBeNull();

    // Security invariant: the referee surface must NOT receive server-only ids
    // or PII. Guard the exact props passed to the client form.
    const passedProps = formPropsSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(passedProps).not.toHaveProperty("provider_id");
    expect(passedProps).not.toHaveProperty("id");
    expect(passedProps).not.toHaveProperty("referee_email");
  });

  it.each(["expired", "used", "declined", "invalid"] as const)(
    "renders the terminal state card for '%s'",
    async (state) => {
      mockResolve.mockResolvedValue({ state, provider: { displayName: "Ace Plumbing" } });
      await renderPage();
      expect(screen.getByTestId("token-state").textContent).toBe(`state:${state}`);
      expect(screen.queryByTestId("submission-form")).toBeNull();
    },
  );
});
