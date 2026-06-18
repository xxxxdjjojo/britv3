import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OffersReceivedPage from "@/app/(protected)/dashboard/seller/offers/page";
import { makeOffer } from "./_fixtures";

// Stub OfferCard's action modal (pulled in transitively) to avoid its network/state.
vi.mock("@/components/seller/offers/OfferActionModal", () => ({
  OfferActionModal: () => null,
}));

function stubFetch(impl: () => Promise<Response> | Response) {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OffersReceivedPage — loading", () => {
  it("shows skeleton cards while loading then clears them", async () => {
    let resolve!: (r: Response) => void;
    stubFetch(() => new Promise<Response>((res) => { resolve = res; }));

    const { container } = render(<OffersReceivedPage />);
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(2);

    resolve(new Response(JSON.stringify([]), { status: 200 }));
    await waitFor(() => expect(container.querySelectorAll(".animate-pulse")).toHaveLength(0));
  });
});

describe("OffersReceivedPage — empty", () => {
  it("renders the empty notice when no offers are returned", async () => {
    stubFetch(() => new Response(JSON.stringify([]), { status: 200 }));
    render(<OffersReceivedPage />);
    expect(await screen.findByText("No offers received yet")).toBeInTheDocument();
  });

  it("treats a failed fetch as empty", async () => {
    stubFetch(() => new Response(null, { status: 500 }));
    render(<OffersReceivedPage />);
    expect(await screen.findByText("No offers received yet")).toBeInTheDocument();
  });
});

describe("OffersReceivedPage — list vs compare toggle (SELL-11)", () => {
  it("defaults to list view: renders an OfferCard per offer", async () => {
    stubFetch(() =>
      new Response(
        JSON.stringify([
          makeOffer({ id: "o1", buyer_name: "Alice Buyer" }),
          makeOffer({ id: "o2", buyer_name: "Bob Buyer" }),
        ]),
        { status: 200 },
      ),
    );
    render(<OffersReceivedPage />);

    expect(await screen.findByText("Alice Buyer")).toBeInTheDocument();
    expect(screen.getByText("Bob Buyer")).toBeInTheDocument();
    // List view => no comparison table header row labelled "Detail".
    expect(screen.queryByRole("columnheader", { name: "Detail" })).not.toBeInTheDocument();
  });

  it("switches to the comparison table when Compare is selected", async () => {
    stubFetch(() =>
      new Response(
        JSON.stringify([
          makeOffer({ id: "o1", buyer_name: "Alice Buyer", status: "pending" }),
          makeOffer({ id: "o2", buyer_name: "Bob Buyer", status: "pending" }),
        ]),
        { status: 200 },
      ),
    );
    render(<OffersReceivedPage />);
    await screen.findByText("Alice Buyer");

    fireEvent.click(screen.getByRole("button", { name: /Compare/ }));

    expect(await screen.findByRole("columnheader", { name: "Detail" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Offer Amount" })).toBeInTheDocument();
  });

  it("counts only pending offers as active in the header", async () => {
    stubFetch(() =>
      new Response(
        JSON.stringify([
          makeOffer({ id: "o1", status: "pending" }),
          makeOffer({ id: "o2", status: "accepted" }),
        ]),
        { status: 200 },
      ),
    );
    render(<OffersReceivedPage />);
    expect(await screen.findByText("1 active offer")).toBeInTheDocument();
  });
});
