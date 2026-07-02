import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockUseAuth = vi.fn();
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => mockUseAuth() }));

import { QuoteModal } from "@/components/providers/QuoteModal";

const BASE_PROPS = {
  providerUserId: "prov-user-1",
  providerName: "Richards Plumbing",
  categories: ["plumber", "handyman"],
  open: true,
  onOpenChange: vi.fn(),
};

function fillStepOne() {
  fireEvent.change(screen.getByLabelText(/postcode/i), {
    target: { value: "SW1A 1AA" },
  });
  fireEvent.change(screen.getByLabelText(/budget/i), {
    target: { value: "£200 – £500" },
  });
  fireEvent.change(screen.getByLabelText(/timeline/i), {
    target: { value: "ASAP" },
  });
  fireEvent.change(screen.getByLabelText(/describe the work/i), {
    target: {
      value:
        "The kitchen mixer tap has been dripping constantly for a week and the base is now leaking into the cupboard below.",
    },
  });
}

describe("QuoteModal (targeted RFQ)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: "rfq-1" } }),
    }) as never;
  });

  it("submits directly with target_provider_id when logged in (no contact step)", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });
    render(<QuoteModal {...BASE_PROPS} />);
    fillStepOne();
    fireEvent.click(screen.getByRole("button", { name: /submit request/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const body = JSON.parse(
      (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    expect(body.target_provider_id).toBe("prov-user-1");
    expect(body.property_postcode).toBe("SW1A 1AA");
    expect(body.contact_email).toBeUndefined();
    expect(await screen.findByText(/request sent/i)).toBeInTheDocument();
  });

  it("collects contact details for guests before submitting", async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    render(<QuoteModal {...BASE_PROPS} />);
    fillStepOne();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "Jane Smith" },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "jane@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit request/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const body = JSON.parse(
      (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    expect(body.contact_email).toBe("jane@example.com");
    expect(body.target_provider_id).toBe("prov-user-1");
  });

  it("preselects the trader's first service category by default (spec §A)", () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });
    render(<QuoteModal {...BASE_PROPS} />);
    expect(
      (screen.getByLabelText(/service type/i) as HTMLSelectElement).value,
    ).toBe("plumber");
  });

  it("shows the trader identity on step 1", () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });
    render(<QuoteModal {...BASE_PROPS} />);
    expect(screen.getByText(/request to richards plumbing/i)).toBeInTheDocument();
  });

  it("uses a custom initialService name in the title but keeps the category enum", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });
    // initialService is provider_services.name — a display name, NOT an enum.
    render(<QuoteModal {...BASE_PROPS} initialService="Boiler Installation & Repair" />);

    // Category stays preselected from the trader's services, never matched
    // against the custom name.
    expect(
      (screen.getByLabelText(/service type/i) as HTMLSelectElement).value,
    ).toBe("plumber");

    fillStepOne();
    fireEvent.click(screen.getByRole("button", { name: /submit request/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const body = JSON.parse(
      (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    expect(body.title).toBe("Boiler Installation & Repair needed in SW1A 1AA");
    expect(body.service_category).toBe("plumber");
  });

  it("shows a visible error when the API rejects", async () => {
    mockUseAuth.mockReturnValue({ user: { id: "user-1" }, loading: false });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Enter a valid UK postcode" }),
    });
    render(<QuoteModal {...BASE_PROPS} />);
    fillStepOne();
    fireEvent.click(screen.getByRole("button", { name: /submit request/i }));
    expect(
      await screen.findByText(/enter a valid uk postcode/i),
    ).toBeInTheDocument();
  });
});
