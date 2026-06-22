import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import InstantValuationPage from "@/app/(protected)/dashboard/seller/valuation/page";
import { makeComparable } from "./_fixtures";

const valuationPayload = {
  postcode: "SW1A 1AA",
  comparables: [makeComparable()],
  estimate: 35000000,
  range_low: 33000000,
  range_high: 37000000,
  evidence: "high",
  based_on: 5,
};

function mockFetchOnce(impl: () => Promise<Response> | Response) {
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

describe("InstantValuationPage — postcode input gating", () => {
  it("disables the Show Sold Prices button while the postcode is empty", () => {
    render(<InstantValuationPage />);
    expect(screen.getByRole("button", { name: /Show Sold Prices/ })).toBeDisabled();
  });

  it("enables the button once a postcode is typed (and upper-cases input)", () => {
    render(<InstantValuationPage />);
    const input = screen.getByPlaceholderText("e.g. SW1A 1AA");
    fireEvent.change(input, { target: { value: "sw1a 1aa" } });

    expect(input).toHaveValue("SW1A 1AA");
    expect(screen.getByRole("button", { name: /Show Sold Prices/ })).toBeEnabled();
  });
});

describe("InstantValuationPage — loading state", () => {
  it("shows the loading label while the request is in flight", async () => {
    let resolve!: (r: Response) => void;
    mockFetchOnce(() => new Promise<Response>((res) => { resolve = res; }));

    render(<InstantValuationPage />);
    fireEvent.change(screen.getByPlaceholderText("e.g. SW1A 1AA"), { target: { value: "SW1A1AA" } });
    fireEvent.click(screen.getByRole("button", { name: /Show Sold Prices/ }));

    expect(await screen.findByText("Loading...")).toBeInTheDocument();

    resolve(new Response(JSON.stringify(valuationPayload), { status: 200 }));
    await waitFor(() => expect(screen.queryByText("Loading...")).not.toBeInTheDocument());
  });
});

describe("InstantValuationPage — success", () => {
  it("renders the ValuationResult on a successful response", async () => {
    mockFetchOnce(() => new Response(JSON.stringify(valuationPayload), { status: 200 }));

    render(<InstantValuationPage />);
    fireEvent.change(screen.getByPlaceholderText("e.g. SW1A 1AA"), { target: { value: "SW1A1AA" } });
    fireEvent.click(screen.getByRole("button", { name: /Show Sold Prices/ }));

    expect(await screen.findByText("£350,000")).toBeInTheDocument();
    expect(screen.getByText(/Average recent sold price near SW1A 1AA/)).toBeInTheDocument();
  });
});

describe("InstantValuationPage — ERROR state", () => {
  it("shows an error message when the request fails (non-ok)", async () => {
    mockFetchOnce(() => new Response(null, { status: 500 }));

    render(<InstantValuationPage />);
    fireEvent.change(screen.getByPlaceholderText("e.g. SW1A 1AA"), { target: { value: "SW1A1AA" } });
    fireEvent.click(screen.getByRole("button", { name: /Show Sold Prices/ }));

    expect(
      await screen.findByText(/Could not retrieve valuation data/),
    ).toBeInTheDocument();
  });

  it("shows an error message when fetch rejects", async () => {
    mockFetchOnce(() => Promise.reject(new Error("network")));

    render(<InstantValuationPage />);
    fireEvent.change(screen.getByPlaceholderText("e.g. SW1A 1AA"), { target: { value: "SW1A1AA" } });
    fireEvent.click(screen.getByRole("button", { name: /Show Sold Prices/ }));

    expect(
      await screen.findByText(/Could not retrieve valuation data/),
    ).toBeInTheDocument();
  });
});
