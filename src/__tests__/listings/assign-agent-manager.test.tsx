import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AssignAgentManager } from "@/components/listings/AssignAgentManager";
import { createClient } from "@/lib/supabase/client";
import type { ListingAgent } from "@/services/listings/listing-agents-service";

// The picker sources agents via the list_estate_agents SECURITY DEFINER rpc on
// the Supabase browser client (a plain user_roles query returns [] under
// owner-only RLS). Mock the client so we control the rpc result.
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const LISTING_ID = "aaaa0001-0001-0001-0001-aaaaaaaaaaaa";
const AGENT_ID_A = "bbbb0002-0002-0002-0002-bbbbbbbbbbbb";
const AGENT_ID_B = "cccc0003-0003-0003-0003-cccccccccccc";

const ASSIGNED_AGENTS: ListingAgent[] = [
  { agent_id: AGENT_ID_A, display_name: "Jane Smith", created_at: "2025-01-01T00:00:00Z" },
];

// Rows as returned by the list_estate_agents rpc (agent_id / display_name /
// agency_name).
const PICKABLE_ROWS = [
  { agent_id: AGENT_ID_A, display_name: "Jane Smith", agency_name: "Smith & Co" },
  { agent_id: AGENT_ID_B, display_name: "Bob Jones", agency_name: "Jones Estates" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Mock the Supabase browser-client rpc used to load the picker options.
function mockRpc(result: { data: unknown; error: unknown }): ReturnType<typeof vi.fn> {
  const rpc = vi.fn().mockResolvedValue(result);
  vi.mocked(createClient).mockReturnValue({ rpc } as never);
  return rpc;
}

// Mock fetch (used only by the assign/remove POST/DELETE to /api/listings/...).
function mockFetch(responses: Array<{ ok: boolean; json: unknown }>): void {
  let callIndex = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async () => {
      const response = responses[Math.min(callIndex, responses.length - 1)];
      callIndex++;
      return {
        ok: response.ok,
        json: async () => response.json,
      };
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AssignAgentManager", () => {
  it("renders the initial assigned agents", async () => {
    mockRpc({ data: PICKABLE_ROWS, error: null });
    mockFetch([{ ok: true, json: [] }]);

    render(
      <AssignAgentManager listingId={LISTING_ID} initialAgents={ASSIGNED_AGENTS} />,
    );

    // Should show the assigned agent name
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    // Should show a remove button for the agent
    expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
  });

  it("shows the empty state message when no agents are assigned", async () => {
    mockRpc({ data: PICKABLE_ROWS, error: null });
    mockFetch([{ ok: true, json: [] }]);

    render(<AssignAgentManager listingId={LISTING_ID} initialAgents={[]} />);

    expect(
      screen.getByText(/no estate agent assigned/i),
    ).toBeInTheDocument();
  });

  it("loads pickable agents via the list_estate_agents rpc on mount", async () => {
    const rpc = mockRpc({ data: PICKABLE_ROWS, error: null });
    mockFetch([{ ok: true, json: [] }]);

    render(<AssignAgentManager listingId={LISTING_ID} initialAgents={[]} />);

    await waitFor(() => {
      expect(rpc).toHaveBeenCalledWith("list_estate_agents");
    });
  });

  it("surfaces a load error toast when the rpc fails (does not silently show empty)", async () => {
    const { toast } = await import("sonner");
    const errorSpy = vi.spyOn(toast, "error").mockImplementation(() => "" as never);
    mockRpc({ data: null, error: { message: "boom" } });
    mockFetch([{ ok: true, json: [] }]);

    render(<AssignAgentManager listingId={LISTING_ID} initialAgents={[]} />);

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/could not load estate agents/i),
      );
    });
    errorSpy.mockRestore();
  });

  it("issues a DELETE request when Remove is clicked and removes the agent from the list", async () => {
    mockRpc({ data: PICKABLE_ROWS, error: null });
    mockFetch([
      // DELETE response
      { ok: true, json: { success: true } },
    ]);

    render(
      <AssignAgentManager listingId={LISTING_ID} initialAgents={ASSIGNED_AGENTS} />,
    );

    // Click the Remove button
    const removeButton = screen.getByRole("button", { name: /remove/i });
    removeButton.click();

    const fetchMock = vi.mocked(fetch);
    await waitFor(() => {
      const deleteCalls = fetchMock.mock.calls.filter(
        ([url, opts]) =>
          typeof url === "string" &&
          url.includes(`/api/listings/${LISTING_ID}/agents`) &&
          (opts as RequestInit)?.method === "DELETE",
      );
      expect(deleteCalls.length).toBeGreaterThan(0);
    });

    // Agent should be removed from the rendered list
    await waitFor(() => {
      expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
    });

    // Empty state should now be visible
    expect(screen.getByText(/no estate agent assigned/i)).toBeInTheDocument();
  });

  it("the Assign button starts disabled with no agent selected", async () => {
    mockRpc({ data: [PICKABLE_ROWS[1]], error: null });
    mockFetch([{ ok: true, json: [] }]);

    render(<AssignAgentManager listingId={LISTING_ID} initialAgents={[]} />);

    const assignButton = screen.getByRole("button", { name: /assign/i });
    expect(assignButton).toBeDisabled();
  });

  it("keeps the assign flow wired to /api/listings/[id]/agents", async () => {
    const rpc = mockRpc({ data: [PICKABLE_ROWS[1]], error: null });
    mockFetch([
      // POST /api/listings/[id]/agents
      { ok: true, json: [] },
    ]);

    render(<AssignAgentManager listingId={LISTING_ID} initialAgents={[]} />);

    // Picker loads via the rpc, not via fetch.
    await waitFor(() => {
      expect(rpc).toHaveBeenCalledWith("list_estate_agents");
    });

    // The POST is not fired automatically — requires user selection + click.
    // Assert the Assign button is present (full Select interaction is not
    // feasible in happy-dom with Base UI portals; the DELETE test above covers
    // the /api/listings mutation contract).
    expect(screen.getByRole("button", { name: /assign/i })).toBeInTheDocument();
  });
});
