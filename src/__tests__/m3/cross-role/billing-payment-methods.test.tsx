import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useParams: () => ({ role: "landlord" }),
}));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { success: (m: string) => toastSuccess(m), error: (m: string) => toastError(m) },
}));

import PaymentMethodsPage from "@/app/(protected)/dashboard/[role]/billing/payment-methods/page";

type PaymentMethod = {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
};

const method = (overrides?: Partial<PaymentMethod>): PaymentMethod => ({
  id: "pm_1",
  brand: "visa",
  last4: "4242",
  expMonth: 4,
  expYear: 2030,
  isDefault: false,
  ...overrides,
});

describe("PaymentMethodsPage", () => {
  beforeEach(() => {
    toastSuccess.mockReset();
    toastError.mockReset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the empty state when there are no saved cards", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ methods: [] }) }) as never;
    render(<PaymentMethodsPage />);
    await waitFor(() =>
      expect(screen.getByText("No saved payment methods.")).toBeInTheDocument(),
    );
  });

  it("renders saved cards with masked last4 and expiry", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ methods: [method()] }) }) as never;
    render(<PaymentMethodsPage />);
    await waitFor(() => expect(screen.getByText(/4242/)).toBeInTheDocument());
    expect(screen.getByText("Expires 04/2030")).toBeInTheDocument();
  });

  it("shows the Default badge for the default card and hides Set default", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ methods: [method({ isDefault: true })] }) }) as never;
    render(<PaymentMethodsPage />);
    await waitFor(() => expect(screen.getByText("Default")).toBeInTheDocument());
    expect(screen.queryByText("Set default")).not.toBeInTheDocument();
  });

  it("toasts an error when loading fails", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue({ ok: false, json: async () => ({ error: "nope" }) }) as never;
    render(<PaymentMethodsPage />);
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("nope"));
  });

  it("calls set-default and optimistically marks the card default", async () => {
    const fetchMock = vi
      .fn()
      // initial load
      .mockResolvedValueOnce({ ok: true, json: async () => ({ methods: [method()] }) })
      // POST set-default
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
    global.fetch = fetchMock as never;

    render(<PaymentMethodsPage />);
    await waitFor(() => expect(screen.getByText("Set default")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Set default"));

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("Default payment method updated"),
    );
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/billing/methods",
      expect.objectContaining({ method: "POST" }),
    );
    // After success the card becomes default → badge appears
    await waitFor(() => expect(screen.getByText("Default")).toBeInTheDocument());
  });

  it("calls delete and removes the card from the list", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ methods: [method({ last4: "1111" })] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
    global.fetch = fetchMock as never;

    render(<PaymentMethodsPage />);
    await waitFor(() => expect(screen.getByText(/1111/)).toBeInTheDocument());

    // The delete button is the trailing icon-only ghost button (no accessible text)
    const deleteButton = screen
      .getAllByRole("button")
      .find((b) => b.className.includes("text-red-500"));
    expect(deleteButton).toBeDefined();
    fireEvent.click(deleteButton!);

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Card removed"));
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/billing/methods?id=pm_1",
      expect.objectContaining({ method: "DELETE" }),
    );
    await waitFor(() => expect(screen.queryByText(/1111/)).not.toBeInTheDocument());
  });
});
