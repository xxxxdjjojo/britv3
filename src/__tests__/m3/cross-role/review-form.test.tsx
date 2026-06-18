import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { success: (m: string) => toastSuccess(m), error: (m: string) => toastError(m) },
}));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { ReviewForm } from "@/components/reviews/ReviewForm";

describe("ReviewForm", () => {
  beforeEach(() => {
    toastSuccess.mockReset();
    toastError.mockReset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders title, review text fields and a submit button", () => {
    render(<ReviewForm bookingId="bk-1" providerId="prov-1" />);
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/your review/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit review/i })).toBeInTheDocument();
  });

  it("renders the overall rating radiogroup with 5 stars", () => {
    render(<ReviewForm bookingId="bk-1" providerId="prov-1" />);
    const overall = screen.getByRole("radiogroup", { name: /overall rating/i });
    expect(overall.querySelectorAll('[role="radio"]')).toHaveLength(5);
  });

  it("renders booking context when provided", () => {
    render(
      <ReviewForm
        bookingId="bk-1"
        providerId="prov-1"
        bookingContext={{
          serviceName: "Boiler Service",
          providerName: "PlumbCo",
          completedDate: "12 Jan 2026",
        }}
      />,
    );
    expect(screen.getByText("Boiler Service by PlumbCo")).toBeInTheDocument();
    expect(screen.getByText("Completed 12 Jan 2026")).toBeInTheDocument();
  });

  it("shows validation errors and does not submit when fields are empty", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as never;
    render(<ReviewForm bookingId="bk-1" providerId="prov-1" />);
    fireEvent.click(screen.getByRole("button", { name: /submit review/i }));
    await waitFor(() =>
      expect(screen.getByText(/title must be at least 5 characters/i)).toBeInTheDocument(),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("tracks the review text character count", () => {
    render(<ReviewForm bookingId="bk-1" providerId="prov-1" />);
    const textarea = screen.getByLabelText(/your review/i);
    fireEvent.change(textarea, { target: { value: "A decent enough job overall." } });
    expect(screen.getByText("28/2000")).toBeInTheDocument();
  });

  it("submits a valid review and renders the success state", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    global.fetch = fetchMock as never;
    const onSuccess = vi.fn();

    render(<ReviewForm bookingId="bk-1" providerId="prov-1" onSuccess={onSuccess} />);

    // Select overall rating (5th star = 5)
    const overall = screen.getByRole("radiogroup", { name: /overall rating/i });
    const stars = overall.querySelectorAll('[role="radio"]');
    fireEvent.click(stars[4]);

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Excellent work all round" },
    });
    fireEvent.change(screen.getByLabelText(/your review/i), {
      target: { value: "They arrived on time and fixed everything properly." },
    });

    fireEvent.click(screen.getByRole("button", { name: /submit review/i }));

    await waitFor(() => expect(screen.getByText("Review Submitted!")).toBeInTheDocument());
    expect(toastSuccess).toHaveBeenCalledWith("Review submitted successfully");
    expect(onSuccess).toHaveBeenCalled();

    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toMatchObject({
      booking_id: "bk-1",
      provider_id: "prov-1",
      overall_rating: 5,
      title: "Excellent work all round",
    });
  });

  it("toasts an error and stays on the form when the API rejects", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue({ ok: false, json: async () => ({ error: "Already reviewed" }) }) as never;

    render(<ReviewForm bookingId="bk-1" providerId="prov-1" />);
    const overall = screen.getByRole("radiogroup", { name: /overall rating/i });
    fireEvent.click(overall.querySelectorAll('[role="radio"]')[4]);
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Solid service" },
    });
    fireEvent.change(screen.getByLabelText(/your review/i), {
      target: { value: "Everything went smoothly from start to finish." },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit review/i }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Already reviewed"));
    expect(screen.queryByText("Review Submitted!")).not.toBeInTheDocument();
  });
});
