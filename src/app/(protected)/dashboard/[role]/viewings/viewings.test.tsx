import { Suspense } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import type { Viewing } from "@/services/viewings/viewings-service";

const useViewingsMock = vi.fn();
const useCancelViewingMock = vi.fn();

vi.mock("@/hooks/useViewings", () => ({
  useViewings: () => useViewingsMock(),
  useCancelViewing: () => useCancelViewingMock(),
}));

import ViewingsPage from "./page";

function makeViewing(overrides: Partial<Viewing> = {}): Viewing {
  return {
    id: "v-1",
    property_address: "The Glass Pavilion, Cotswolds",
    scheduled_at: "2026-07-15T14:00:00.000Z",
    status: "confirmed",
    viewing_slot_id: "slot-1",
    listing_id: "listing-1",
    type: "in_person",
    notes: null,
    created_at: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

async function renderPage() {
  await act(async () => {
    render(
      <Suspense fallback={null}>
        <ViewingsPage params={Promise.resolve({ role: "buyer" })} />
      </Suspense>,
    );
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  useCancelViewingMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
});

describe("ViewingsPage", () => {
  it("renders the Viewings heading", async () => {
    useViewingsMock.mockReturnValue({ data: [], isLoading: false, error: null });

    await renderPage();

    expect(
      await screen.findByRole("heading", { name: /^viewings$/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it("renders the empty itinerary state when there are no upcoming viewings", async () => {
    useViewingsMock.mockReturnValue({ data: [], isLoading: false, error: null });

    await renderPage();

    expect(
      await screen.findByText(/book a viewing to get started/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/no past viewings/i)).toBeInTheDocument();
  });

  it("renders the next viewing card and itinerary row for an upcoming viewing", async () => {
    useViewingsMock.mockReturnValue({
      data: [makeViewing()],
      isLoading: false,
      error: null,
    });

    await renderPage();

    expect(await screen.findByText("Next Viewing")).toBeInTheDocument();
    expect(
      screen.getAllByText(/the glass pavilion/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: /reschedule/i }),
    ).toBeInTheDocument();
  });

  it("renders past viewings in the Past Viewings section", async () => {
    useViewingsMock.mockReturnValue({
      data: [
        makeViewing({
          id: "v-2",
          status: "completed",
          property_address: "The Rectory, Surrey",
          scheduled_at: "2026-01-10T11:00:00.000Z",
        }),
      ],
      isLoading: false,
      error: null,
    });

    await renderPage();

    expect(await screen.findByText("Past Viewings")).toBeInTheDocument();
    expect(screen.getByText(/the rectory/i)).toBeInTheDocument();
  });
});
