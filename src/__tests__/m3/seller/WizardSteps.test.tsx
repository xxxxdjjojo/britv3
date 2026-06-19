import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Step1AddressType } from "@/components/seller/wizard/Step1AddressType";
import { Step2Details } from "@/components/seller/wizard/Step2Details";
import { Step5Price } from "@/components/seller/wizard/Step5Price";
import { makeListing } from "./_fixtures";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// next/image -> plain img.
vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

function stubFetch(impl: () => Promise<Response> | Response) {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  push.mockReset();
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// Continue button is the WizardShell footer button labelled "Continue".
function continueButton(): HTMLButtonElement {
  return screen.getByRole("button", { name: /Continue/ }) as HTMLButtonElement;
}

describe("Step1AddressType — validation", () => {
  it("disables Continue with an empty form", () => {
    render(<Step1AddressType listing={null} />);
    expect(continueButton()).toBeDisabled();
  });

  it("stays disabled until all required fields are filled", () => {
    // A listing missing tenure/type should keep Continue disabled.
    render(
      <Step1AddressType
        listing={{ postcode: "SW1A 1AA", address_line_1: "14 Elm Road", city: "London" }}
      />,
    );
    expect(continueButton()).toBeDisabled();
  });

  it("enables Continue when all required fields are present (freehold)", () => {
    render(
      <Step1AddressType
        listing={{
          postcode: "SW1A 1AA",
          address_line_1: "14 Elm Road",
          city: "London",
          property_type: "terraced",
          tenure: "freehold",
        }}
      />,
    );
    expect(continueButton()).toBeEnabled();
  });

  it("requires positive lease years for a leasehold property", () => {
    render(
      <Step1AddressType
        listing={{
          postcode: "SW1A 1AA",
          address_line_1: "14 Elm Road",
          city: "London",
          property_type: "flat",
          tenure: "leasehold",
          leasehold_years_remaining: null,
        }}
      />,
    );
    // leasehold with no years -> still invalid.
    expect(continueButton()).toBeDisabled();
  });

  it("shows the short-lease warning for leases under 80 years", () => {
    render(
      <Step1AddressType
        listing={{
          postcode: "SW1A 1AA",
          address_line_1: "14 Elm Road",
          city: "London",
          property_type: "flat",
          tenure: "leasehold",
          leasehold_years_remaining: 70,
        }}
      />,
    );
    expect(screen.getByText("Short Lease Warning")).toBeInTheDocument();
  });

  it("POSTs the new listing and navigates to step 2 on continue", async () => {
    stubFetch(() => new Response(JSON.stringify({ id: "new-listing-id" }), { status: 200 }));
    render(
      <Step1AddressType
        listing={{
          postcode: "SW1A 1AA",
          address_line_1: "14 Elm Road",
          city: "London",
          property_type: "terraced",
          tenure: "freehold",
        }}
      />,
    );

    fireEvent.click(continueButton());

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/dashboard/seller/listings/create?step=2&id=new-listing-id"),
    );
  });

  it("surfaces an error when the create request fails", async () => {
    stubFetch(() => new Response(null, { status: 500 }));
    render(
      <Step1AddressType
        listing={{
          postcode: "SW1A 1AA",
          address_line_1: "14 Elm Road",
          city: "London",
          property_type: "terraced",
          tenure: "freehold",
        }}
      />,
    );

    fireEvent.click(continueButton());
    expect(await screen.findByText(/Failed to save/)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});

describe("Step2Details — validation (NTSELAT planning requirement)", () => {
  it("disables Continue without beds/baths/planning status", () => {
    render(<Step2Details listing={null} listingId="listing-1" />);
    expect(continueButton()).toBeDisabled();
  });

  it("stays disabled when planning permission status is missing", () => {
    render(
      <Step2Details
        listing={{ bedrooms: 3, bathrooms: 2 }}
        listingId="listing-1"
      />,
    );
    // beds+baths present but planning_permission_status not set.
    expect(continueButton()).toBeDisabled();
  });

  it("enables Continue once beds, baths and planning status are present", () => {
    render(
      <Step2Details
        listing={
          {
            bedrooms: 3,
            bathrooms: 2,
            planning_permission_status: "none_known",
          } as Parameters<typeof Step2Details>[0]["listing"]
        }
        listingId="listing-1"
      />,
    );
    expect(continueButton()).toBeEnabled();
  });

  it("PATCHes details and advances to step 3", async () => {
    stubFetch(() => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    render(
      <Step2Details
        listing={
          {
            bedrooms: 3,
            bathrooms: 2,
            planning_permission_status: "granted",
          } as Parameters<typeof Step2Details>[0]["listing"]
        }
        listingId="listing-1"
      />,
    );

    fireEvent.click(continueButton());
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/dashboard/seller/listings/create?step=3&id=listing-1"),
    );
  });
});

describe("Step5Price — validation (min asking price)", () => {
  it("disables Continue with no price", () => {
    render(<Step5Price listing={null} listingId="listing-1" />);
    expect(continueButton()).toBeDisabled();
  });

  it("disables Continue for a price below the £1,000 floor", () => {
    render(<Step5Price listing={{ asking_price: 50000 }} listingId="listing-1" />); // £500
    expect(continueButton()).toBeDisabled();
  });

  it("enables Continue for a valid asking price", () => {
    render(<Step5Price listing={makeListing({ asking_price: 35000000 })} listingId="listing-1" />);
    expect(continueButton()).toBeEnabled();
  });

  it("PATCHes price and advances to step 6", async () => {
    stubFetch(() => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    render(<Step5Price listing={makeListing({ asking_price: 35000000 })} listingId="listing-1" />);

    fireEvent.click(continueButton());
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/dashboard/seller/listings/create?step=6&id=listing-1"),
    );
  });
});
