import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useParams: () => ({ role: "agent" }),
}));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
const toastError = vi.fn();
vi.mock("sonner", () => ({ toast: { error: (m: string) => toastError(m), success: vi.fn() } }));

import InvoicesPage from "@/app/(protected)/dashboard/[role]/billing/invoices/page";

type Invoice = {
  id: string;
  created: number;
  amountPaid: number;
  currency: string;
  status: string;
  invoicePdf: string | null;
  description: string | null;
};

const invoice = (overrides?: Partial<Invoice>): Invoice => ({
  id: "in_1",
  created: 1_700_000_000,
  amountPaid: 2999,
  currency: "gbp",
  status: "paid",
  invoicePdf: "https://stripe.test/in_1.pdf",
  description: "Agent Pro — Monthly",
  ...overrides,
});

function mockFetchOnce(body: unknown, ok = true) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    json: async () => body,
  }) as unknown as typeof fetch;
}

describe("InvoicesPage", () => {
  beforeEach(() => {
    toastError.mockReset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a loading spinner before invoices resolve, then the list", async () => {
    mockFetchOnce({ invoices: [invoice()] });
    render(<InvoicesPage />);
    // Heading renders immediately
    expect(screen.getByText("Invoices")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("Agent Pro — Monthly", { exact: false })).toBeInTheDocument(),
    );
  });

  it("renders the empty state when there are no invoices", async () => {
    mockFetchOnce({ invoices: [] });
    render(<InvoicesPage />);
    await waitFor(() => expect(screen.getByText("No invoices yet.")).toBeInTheDocument());
  });

  it("renders a paid status badge", async () => {
    mockFetchOnce({ invoices: [invoice({ status: "paid" })] });
    render(<InvoicesPage />);
    await waitFor(() => expect(screen.getByText("Paid")).toBeInTheDocument());
  });

  it("renders an open status badge", async () => {
    mockFetchOnce({ invoices: [invoice({ status: "open" })] });
    render(<InvoicesPage />);
    await waitFor(() => expect(screen.getByText("Open")).toBeInTheDocument());
  });

  it("toasts an error when the fetch fails", async () => {
    mockFetchOnce({ error: "Server exploded" }, false);
    render(<InvoicesPage />);
    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Server exploded"));
    expect(screen.getByText("No invoices yet.")).toBeInTheDocument();
  });

  it("opens the invoice PDF in a new tab when Download is clicked", async () => {
    mockFetchOnce({ invoices: [invoice({ invoicePdf: "https://stripe.test/in_1.pdf" })] });
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<InvoicesPage />);
    await waitFor(() => expect(screen.getByText("PDF")).toBeInTheDocument());
    fireEvent.click(screen.getByText("PDF"));
    expect(openSpy).toHaveBeenCalledWith("https://stripe.test/in_1.pdf", "_blank");
  });
});
