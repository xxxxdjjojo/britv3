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

describe("SaleProgressionKanban — stage grouping + columns", () => {
  it("renders a column for every sale stage", () => {
    render(<SaleProgressionKanban initialProgressions={PROGRESSIONS_BY_STAGE} />);
    // Column headers use the stage label; "Offer Accepted" also appears on the
    // card badge, so assert each label is present at least once.
    expect(screen.getAllByText("Offer Accepted").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Searches").length).toBeGreaterThan(0);
    expect(screen.getByText("Completion")).toBeInTheDocument();
    // 8 stages total.
    expect(SALE_STAGES).toHaveLength(8);
  });

  it("shows the correct card count per populated stage column", () => {
    render(<SaleProgressionKanban initialProgressions={PROGRESSIONS_BY_STAGE} />);
    // offer_accepted column header → count "2"; searches → "1".
    // The "Offer Accepted" column header div contains a count span.
    const offerHeader = screen.getAllByText("Offer Accepted")[0];
    const offerColumn = offerHeader.closest("div")?.parentElement?.parentElement;
    expect(offerColumn).toBeTruthy();
    expect(within(offerColumn as HTMLElement).getByText("2")).toBeInTheDocument();
  });

  it("renders the 'No sales' placeholder in empty stage columns", () => {
    render(<SaleProgressionKanban initialProgressions={PROGRESSIONS_BY_STAGE} />);
    // 8 stages, 2 populated → 6 empty columns each showing "No sales".
    expect(screen.getAllByText("No sales")).toHaveLength(6);
  });

  it("renders 'No sales' in every column when no progressions are given", () => {
    render(<SaleProgressionKanban initialProgressions={{}} />);
    expect(screen.getAllByText("No sales")).toHaveLength(8);
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
