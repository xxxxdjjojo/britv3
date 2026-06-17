import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useParams: () => ({ role: "provider" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
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

import RefundRequestPage from "@/app/(protected)/dashboard/[role]/billing/refund/page";

const REASONS = [
  "Service not as described",
  "Technical issues preventing use",
  "Accidentally subscribed to wrong plan",
  "No longer need the service",
  "Other",
];

describe("RefundRequestPage", () => {
  beforeEach(() => {
    toastSuccess.mockReset();
    toastError.mockReset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders all five refund reason radios", () => {
    render(<RefundRequestPage />);
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(5);
    REASONS.forEach((r) => expect(screen.getByText(r)).toBeInTheDocument());
  });

  it("renders the additional-details textarea", () => {
    render(<RefundRequestPage />);
    expect(
      screen.getByPlaceholderText(/additional context that might help/i),
    ).toBeInTheDocument();
  });

  it("disables the submit button until a reason is selected", async () => {
    render(<RefundRequestPage />);
    const submit = screen.getByRole("button", { name: /submit refund request/i });
    expect(submit).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: /Other/ }));
    expect(submit).toBeEnabled();
  });

  it("submits the selected reason and shows the success state", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ id: "re_123" }) });
    global.fetch = fetchMock as never;

    render(<RefundRequestPage />);
    fireEvent.click(screen.getByRole("radio", { name: /No longer need the service/ }));
    fireEvent.click(screen.getByRole("button", { name: /submit refund request/i }));

    await waitFor(() => expect(screen.getByText("Request submitted")).toBeInTheDocument());
    expect(toastSuccess).toHaveBeenCalled();

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.reason).toBe("No longer need the service");
  });

  it("appends additional details to the reason string", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ id: "re_123" }) });
    global.fetch = fetchMock as never;

    render(<RefundRequestPage />);
    fireEvent.click(screen.getByRole("radio", { name: /Other/ }));
    fireEvent.change(
      screen.getByPlaceholderText(/additional context that might help/i),
      { target: { value: "billed twice" } },
    );
    fireEvent.click(screen.getByRole("button", { name: /submit refund request/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.reason).toBe("Other: billed twice");
  });

  it("toasts an error and stays on the form when the API rejects", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue({ ok: false, json: async () => ({ error: "Outside refund window" }) }) as never;

    render(<RefundRequestPage />);
    fireEvent.click(screen.getByRole("radio", { name: /Other/ }));
    fireEvent.click(screen.getByRole("button", { name: /submit refund request/i }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Outside refund window"));
    expect(screen.queryByText("Request submitted")).not.toBeInTheDocument();
  });
});
