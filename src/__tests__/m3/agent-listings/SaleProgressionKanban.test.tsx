import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { SaleProgressionKanban } from "@/components/dashboard/agent/sales/SaleProgressionKanban";
import { SALE_STAGES } from "@/types/agent";
import { PROGRESSIONS_BY_STAGE, makeProgression } from "./fixtures";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

// FINDING: SaleProgressionKanban is built on @dnd-kit, whose PointerSensor
// drag lifecycle cannot be driven under happy-dom (no pointer capture / layout
// measurement). The drag-to-restage LOGIC (handleDragEnd → optimistic update →
// PATCH /api/agent/sales → revert on failure) is therefore not exercisable here
// and is marked it.todo below. Stage GROUPING, column counts, card rendering
// and the detail dialog are covered.

describe("SaleProgressionKanban — stage grouping + tabs", () => {
  it("lists the active-tab sales with their stage labels and a tab bar", () => {
    render(<SaleProgressionKanban initialProgressions={PROGRESSIONS_BY_STAGE} />);
    // The redesign is a two-pane layout: a left sale list grouped under two
    // tabs (Listing Active / Under Offer) and a right detail pane — not a
    // column per stage. The default "Listing Active" tab holds the
    // offer_accepted + searches stages, so their labels appear on the list
    // cards (once per sale).
    expect(screen.getByText("Listing Active")).toBeInTheDocument();
    expect(screen.getByText("Under Offer")).toBeInTheDocument();
    expect(screen.getAllByText("Offer Accepted")).toHaveLength(2);
    expect(screen.getAllByText("Searches")).toHaveLength(1);
    // "Completion" belongs to the Under Offer tab, so it is not rendered until
    // that tab is selected.
    expect(screen.queryByText("Completion")).not.toBeInTheDocument();
    // 8 stages total.
    expect(SALE_STAGES).toHaveLength(8);
  });

  it("shows the per-tab sale count badge", () => {
    render(<SaleProgressionKanban initialProgressions={PROGRESSIONS_BY_STAGE} />);
    // Listing Active = offer_accepted (2) + searches (1) = 3; Under Offer = 0.
    const listingTab = screen.getByText("Listing Active").closest("button");
    const underOfferTab = screen.getByText("Under Offer").closest("button");
    expect(within(listingTab as HTMLElement).getByText("3")).toBeInTheDocument();
    expect(within(underOfferTab as HTMLElement).getByText("0")).toBeInTheDocument();
  });

  it("shows the empty-view placeholder when the active tab has no sales", () => {
    render(<SaleProgressionKanban initialProgressions={PROGRESSIONS_BY_STAGE} />);
    // Listing Active has 3 sales, so its pane is populated. Switching to the
    // empty Under Offer tab reveals the single empty-view placeholder.
    fireEvent.click(screen.getByText("Under Offer"));
    expect(screen.getByText("No sales in this view")).toBeInTheDocument();
  });

  it("shows the empty-view placeholder when no progressions are given", () => {
    render(<SaleProgressionKanban initialProgressions={{}} />);
    // One empty-view placeholder for the (default) active tab's empty list.
    expect(screen.getByText("No sales in this view")).toBeInTheDocument();
  });
});

describe("SaleProgressionKanban — cards", () => {
  it("renders a card showing the truncated property id and days-in-stage", () => {
    render(
      <SaleProgressionKanban
        initialProgressions={{
          offer_accepted: [
            makeProgression({
              id: "p1",
              property_id: "abcdef12-3456-7890-0000-000000000000",
              updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            }),
          ],
        }}
      />,
    );
    // property_id.substring(0,8) = "abcdef12"
    expect(screen.getByText(/abcdef12/)).toBeInTheDocument();
    // 3 days in stage → "3d"
    expect(screen.getByText("3d")).toBeInTheDocument();
  });

  it("shows the ETA when expected_completion_date is set", () => {
    render(
      <SaleProgressionKanban
        initialProgressions={{
          offer_accepted: [
            makeProgression({ id: "p1", expected_completion_date: "2026-09-01" }),
          ],
        }}
      />,
    );
    expect(screen.getByText(/ETA:/)).toBeInTheDocument();
  });
});

describe("SaleProgressionKanban — detail dialog", () => {
  it("opens the Sale Details dialog when a card is clicked", () => {
    render(
      <SaleProgressionKanban
        initialProgressions={{
          offer_accepted: [
            makeProgression({
              id: "p1",
              property_id: "dddddddd-1111-2222-3333-444444444444",
              offer_id: "offer-xyz",
            }),
          ],
        }}
      />,
    );
    // The card is a role=button (property substring). Click it.
    fireEvent.click(screen.getByRole("button", { name: /dddddddd/ }));
    expect(screen.getByText("Sale Details")).toBeInTheDocument();
    expect(screen.getByText("offer-xyz")).toBeInTheDocument();
  });
});

describe("SaleProgressionKanban — drag-to-restage (not testable in happy-dom)", () => {
  it.todo("moves a card to the target stage and PATCHes /api/agent/sales on drop");
  it.todo("reverts the optimistic move and toasts on a failed PATCH");
});
