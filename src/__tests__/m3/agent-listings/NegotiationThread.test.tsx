import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { NegotiationThread } from "@/components/dashboard/agent/offers/NegotiationThread";
import { makeOffer, makeHistory } from "./fixtures";

// FINDING: every AlertDialogTrigger / DialogTrigger in NegotiationThread uses
// `asChild` around a <Button>, which renders TWO nested <button> elements (the
// Radix trigger plus the child Button) — a real accessibility/markup bug
// (`<button> cannot be a descendant of <button>`). Action labels therefore
// appear twice in the DOM, so these tests query with getAllByRole and act on
// the first match rather than getByRole.
function firstButton(name: string): HTMLElement {
  return screen.getAllByRole("button", { name })[0];
}

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...a: unknown[]) => toastSuccess(...a),
    error: (...a: unknown[]) => toastError(...a),
  },
}));

beforeEach(() => {
  refresh.mockReset();
  toastSuccess.mockReset();
  toastError.mockReset();
  vi.restoreAllMocks();
});

describe("NegotiationThread — offer details", () => {
  it("renders buyer details, amount and the offer status badge", () => {
    render(
      <NegotiationThread
        offer={makeOffer({
          buyer_name: "Alice Buyer",
          buyer_email: "alice@example.com",
          buyer_phone: "07700 900000",
          amount: 450000,
          status: "pending",
        })}
        history={[]}
      />,
    );
    expect(screen.getByText("Alice Buyer")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("07700 900000")).toBeInTheDocument();
    expect(screen.getByText("£450,000")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("renders the AIP and vendor-notified badges", () => {
    render(
      <NegotiationThread
        offer={makeOffer({ aip_status: "verified", vendor_notified: true })}
        history={[]}
      />,
    );
    expect(screen.getByText("AIP Verified")).toBeInTheDocument();
    expect(screen.getByText("Vendor notified")).toBeInTheDocument();
  });

  it("shows the counter amount when present", () => {
    render(
      <NegotiationThread
        offer={makeOffer({ status: "countered", counter_amount: 460000 })}
        history={[]}
      />,
    );
    expect(screen.getByText(/Counter: £460,000/)).toBeInTheDocument();
  });
});

describe("NegotiationThread — history timeline", () => {
  it("shows the empty message when there is no history", () => {
    render(<NegotiationThread offer={makeOffer()} history={[]} />);
    expect(screen.getByText("No history yet.")).toBeInTheDocument();
  });

  it("renders a transition with previous and new status and a note", () => {
    render(
      <NegotiationThread
        offer={makeOffer({ status: "pending" })}
        history={[
          makeHistory({
            previous_status: "rejected",
            new_status: "countered",
            note: "Vendor wants more",
          }),
        ]}
      />,
    );
    // Scope to the History card so the offer-status badge ("pending") does not
    // collide with the timeline's status labels.
    const historyHeading = screen.getByText("History");
    const historyCard = historyHeading.closest("div[data-slot='card']") ?? historyHeading.parentElement!;
    expect(within(historyCard as HTMLElement).getByText("rejected")).toBeInTheDocument();
    expect(within(historyCard as HTMLElement).getByText("countered")).toBeInTheDocument();
    expect(within(historyCard as HTMLElement).getByText("Vendor wants more")).toBeInTheDocument();
  });
});

describe("NegotiationThread — actions visibility by status", () => {
  it("shows Accept/Reject for a pending offer", () => {
    render(<NegotiationThread offer={makeOffer({ status: "pending" })} history={[]} />);
    expect(screen.getAllByRole("button", { name: "Accept" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Reject" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Counter" }).length).toBeGreaterThan(0);
  });

  it("shows 'Accept Counter' and no Counter button for a countered offer", () => {
    render(<NegotiationThread offer={makeOffer({ status: "countered" })} history={[]} />);
    expect(
      screen.getAllByRole("button", { name: "Accept Counter" }).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Counter" })).not.toBeInTheDocument();
  });

  it("renders the finalised banner and no action buttons for an accepted offer", () => {
    render(<NegotiationThread offer={makeOffer({ status: "accepted" })} history={[]} />);
    expect(
      screen.getByText(/This offer is finalised/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reject" })).not.toBeInTheDocument();
  });

  it("renders the finalised banner for a rejected offer", () => {
    render(<NegotiationThread offer={makeOffer({ status: "rejected" })} history={[]} />);
    expect(screen.getByText(/This offer is finalised/)).toBeInTheDocument();
  });
});

describe("NegotiationThread — accept action", () => {
  it("confirms acceptance, PATCHes the endpoint and refreshes on success", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    render(<NegotiationThread offer={makeOffer({ id: "offer-7", status: "pending" })} history={[]} />);

    // Open the Accept confirmation dialog, then confirm.
    fireEvent.click(firstButton("Accept"));
    const confirm = await screen.findByRole("button", { name: "Accept Offer" });
    fireEvent.click(confirm);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/agent/offers",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
    const body = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string,
    );
    expect(body).toMatchObject({ id: "offer-7", action: "accept" });

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Offer accepted"));
    expect(refresh).toHaveBeenCalled();
  });

  it("shows an error toast when the accept request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "boom" }), { status: 500 }),
    );

    render(<NegotiationThread offer={makeOffer({ status: "pending" })} history={[]} />);

    fireEvent.click(firstButton("Accept"));
    fireEvent.click(await screen.findByRole("button", { name: "Accept Offer" }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("boom"));
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("NegotiationThread — reject action", () => {
  it("confirms rejection and PATCHes with action=reject", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    render(<NegotiationThread offer={makeOffer({ id: "offer-9", status: "pending" })} history={[]} />);

    fireEvent.click(firstButton("Reject"));
    fireEvent.click(await screen.findByRole("button", { name: "Reject Offer" }));

    await waitFor(() => {
      const body = JSON.parse(
        (fetchMock.mock.calls[0][1] as RequestInit).body as string,
      );
      expect(body).toMatchObject({ id: "offer-9", action: "reject" });
    });
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Offer rejected"));
  });
});
