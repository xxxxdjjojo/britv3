import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OfferCard } from "@/components/seller/offers/OfferCard";
import { makeOffer } from "./_fixtures";

// The action modal owns its own network/state; stub it so card tests stay
// focused on the presentational + colour-coding logic. We render a marker so
// "modal opened" is observable.
vi.mock("@/components/seller/offers/OfferActionModal", () => ({
  OfferActionModal: ({ action }: { action: string }) => (
    <div data-testid="offer-action-modal">action:{action}</div>
  ),
}));

describe("OfferCard render-with-data", () => {
  it("renders buyer name, formatted amount and status", () => {
    render(<OfferCard offer={makeOffer()} onUpdated={vi.fn()} />);

    expect(screen.getByText("Alice Buyer")).toBeInTheDocument();
    expect(screen.getByText("£350,000")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("shows chain-free badge for a chain-free offer", () => {
    render(<OfferCard offer={makeOffer({ chain_status: "chain_free" })} onUpdated={vi.fn()} />);
    expect(screen.getByText("Chain-free")).toBeInTheDocument();
  });

  it("shows in-chain badge with chain length", () => {
    render(
      <OfferCard
        offer={makeOffer({ chain_status: "in_chain", chain_length: 3 })}
        onUpdated={vi.fn()}
      />,
    );
    expect(screen.getByText("In chain (3)")).toBeInTheDocument();
  });

  it("renders conditions section when present", () => {
    render(
      <OfferCard offer={makeOffer({ conditions: "Subject to survey" })} onUpdated={vi.fn()} />,
    );
    expect(screen.getByText("Conditions")).toBeInTheDocument();
    expect(screen.getByText("Subject to survey")).toBeInTheDocument();
  });
});

describe("OfferCard colour coding (SELL-06)", () => {
  it("offer above asking price renders amount with text-green-600 and TrendingUp", () => {
    const offer = makeOffer({
      amount: 36000000,
      listing: { ...makeOffer().listing!, asking_price: 35000000 },
    });
    render(<OfferCard offer={offer} onUpdated={vi.fn()} />);

    const amount = screen.getByText("£360,000");
    expect(amount).toHaveClass("text-green-600");
    expect(screen.getByText(/\+2\.9% vs asking/)).toBeInTheDocument();
  });

  it("offer more than 1% below asking renders amount with text-red-600", () => {
    const offer = makeOffer({
      amount: 33000000, // ~5.7% below 350k
      listing: { ...makeOffer().listing!, asking_price: 35000000 },
    });
    render(<OfferCard offer={offer} onUpdated={vi.fn()} />);

    const amount = screen.getByText("£330,000");
    expect(amount).toHaveClass("text-red-600");
    expect(screen.getByText(/-5\.7% vs asking/)).toBeInTheDocument();
  });

  it("offer at asking (within 1% below) renders neutral text-slate-500 and no trend icon", () => {
    const offer = makeOffer({
      amount: 35000000,
      listing: { ...makeOffer().listing!, asking_price: 35000000 },
    });
    render(<OfferCard offer={offer} onUpdated={vi.fn()} />);

    const amount = screen.getByText("£350,000");
    expect(amount).toHaveClass("text-slate-500");
    // diff === 0 -> percentageText set but TrendIcon null, so no "vs asking" row
    expect(screen.queryByText(/vs asking/)).not.toBeInTheDocument();
  });

  it("falls back to neutral text-slate-700 when listing asking price is absent", () => {
    const offer = makeOffer({ listing: undefined });
    render(<OfferCard offer={offer} onUpdated={vi.fn()} />);

    const amount = screen.getByText("£350,000");
    expect(amount).toHaveClass("text-slate-700");
    expect(screen.queryByText(/vs asking/)).not.toBeInTheDocument();
  });
});

describe("OfferCard interactive", () => {
  it("shows Accept/Counter/Reject actions only for pending offers", () => {
    render(<OfferCard offer={makeOffer({ status: "pending" })} onUpdated={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Accept" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Counter" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
  });

  it("hides actions for non-pending offers", () => {
    render(<OfferCard offer={makeOffer({ status: "accepted" })} onUpdated={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Accept" })).not.toBeInTheDocument();
  });

  it("opens the action modal with the chosen action when Accept is clicked", () => {
    render(<OfferCard offer={makeOffer({ status: "pending" })} onUpdated={vi.fn()} />);

    expect(screen.queryByTestId("offer-action-modal")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));

    expect(screen.getByTestId("offer-action-modal")).toHaveTextContent("action:accept");
  });
});
