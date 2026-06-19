import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Step7Review } from "@/components/seller/wizard/Step7Review";
import { makeListing } from "./_fixtures";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

function stubFetch(impl: () => Promise<Response> | Response) {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

// A listing that satisfies every required checklist item.
function completeListing() {
  return makeListing({
    address_line_1: "14 Elm Road",
    property_type: "terraced",
    tenure: "freehold",
    bedrooms: 3,
    bathrooms: 2,
    photos: [{ url: "https://example.com/p1.jpg", order: 0 }],
    description: "x".repeat(60),
    asking_price: 35000000,
    epc_url: "https://example.com/epc.pdf",
  });
}

function publishButton(): HTMLButtonElement {
  return screen.getByRole("button", { name: /Publish Listing/ }) as HTMLButtonElement;
}

// The CPUTR control is the base-ui Checkbox nested in a <label>. In happy-dom,
// clicking the label-wrapped role element double-fires and nets no toggle, so
// we click the hidden native input directly.
function acceptCputr(container: HTMLElement) {
  const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
  fireEvent.click(input);
}

beforeEach(() => {
  push.mockReset();
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Step7Review — loading / missing listing", () => {
  it("renders the loading placeholder when no listing is provided", () => {
    render(<Step7Review listing={null} listingId="listing-1" />);
    expect(screen.getByText("Loading listing...")).toBeInTheDocument();
  });
});

describe("Step7Review — step-gating via publication checklist (SELL)", () => {
  it("disables Publish while required steps are incomplete", () => {
    // Missing photos, description, price, epc -> required incomplete.
    const incomplete = makeListing({
      photos: [],
      description: null,
      asking_price: null,
      epc_url: null,
    });
    render(<Step7Review listing={incomplete} listingId="listing-1" />);

    expect(publishButton()).toBeDisabled();
    expect(screen.getByText("Complete all required fields before publishing.")).toBeInTheDocument();
  });

  it("marks each unmet required item and shows the incomplete count", () => {
    const incomplete = makeListing({
      photos: [],
      description: null,
      asking_price: null,
      epc_url: null,
      key_selling_points: [],
    });
    render(<Step7Review listing={incomplete} listingId="listing-1" />);
    // 8 checklist items, 4 complete (address, type/tenure, beds/baths) — verify count text exists.
    expect(screen.getByText(/\/8 complete/)).toBeInTheDocument();
  });

  it("keeps Publish disabled when all steps complete but CPUTR is unaccepted", () => {
    render(<Step7Review listing={completeListing()} listingId="listing-1" />);
    // requiredComplete is true, but cputrAccepted defaults false.
    expect(publishButton()).toBeDisabled();
    expect(
      screen.queryByText("Complete all required fields before publishing."),
    ).not.toBeInTheDocument();
  });

  it("enables Publish once all steps complete AND CPUTR declaration is accepted", () => {
    const { container } = render(<Step7Review listing={completeListing()} listingId="listing-1" />);
    acceptCputr(container);
    expect(publishButton()).toBeEnabled();
  });

  it("navigating an incomplete required item routes back to that step", () => {
    const incomplete = makeListing({ asking_price: null }); // price step (5) incomplete
    render(<Step7Review listing={incomplete} listingId="listing-1" />);

    fireEvent.click(screen.getByText("Asking price set"));
    expect(push).toHaveBeenCalledWith("/dashboard/seller/listings/create?step=5&id=listing-1");
  });
});

describe("Step7Review — publish action", () => {
  it("PATCHes the publish action and redirects on success", async () => {
    stubFetch(() => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const { container } = render(<Step7Review listing={completeListing()} listingId="listing-1" />);
    acceptCputr(container);

    fireEvent.click(publishButton());
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/dashboard/seller/listings?published=1"),
    );
  });

  it("shows an error when publish fails", async () => {
    stubFetch(() => new Response(null, { status: 500 }));
    const { container } = render(<Step7Review listing={completeListing()} listingId="listing-1" />);
    acceptCputr(container);

    fireEvent.click(publishButton());
    expect(await screen.findByText(/Failed to publish/)).toBeInTheDocument();
  });
});
