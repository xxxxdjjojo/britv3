/**
 * M3-A9 — VerificationQueueClient + the inner VerificationQueue card.
 *
 * The Client wrapper delegates rendering to VerificationQueue and turns
 * approve/reject into POSTs at /api/admin/verifications/review. We test the
 * wrapper (fetch payload + refresh) and the card's empty / notes-toggle logic.
 *
 * FINDING: the verifications data layer has a documented schema-drift column
 * error in this milestone (verification-service queries fail against the live
 * DB). These tests bypass that entirely by feeding fixture props to the
 * client component, which is the supported way to exercise the UI.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { VerificationQueueClient } from "@/components/admin/VerificationQueueClient";
import { VerificationQueue } from "@/components/admin/VerificationQueue";
import type { VerificationQueueItem } from "@/services/admin/verification-service";

const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh, push: vi.fn() }),
}));

const ITEM: VerificationQueueItem = {
  id: "provider-1",
  full_name: "Hannah Cole",
  email: "hannah@trade.co",
  verification_status: "pending",
  provider_details: {
    business_name: "Cole Plumbing Ltd",
    document_url: "https://example.com/doc.pdf",
  },
  created_at: "2026-04-01T00:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
});

describe("VerificationQueueClient", () => {
  it("renders provider name, business name and email", () => {
    render(<VerificationQueueClient verifications={[ITEM]} />);
    expect(screen.getByText("Hannah Cole")).toBeInTheDocument();
    expect(screen.getByText("Cole Plumbing Ltd")).toBeInTheDocument();
    expect(screen.getByText("hannah@trade.co")).toBeInTheDocument();
  });

  it("renders an empty state when the queue is clear", () => {
    render(<VerificationQueueClient verifications={[]} />);
    expect(screen.getByText(/no pending verifications/i)).toBeInTheDocument();
  });

  it("approves a provider with the review payload and refreshes", async () => {
    render(<VerificationQueueClient verifications={[ITEM]} />);
    fireEvent.click(screen.getByRole("button", { name: /approve/i }));

    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/verifications/review",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          userId: "provider-1",
          decision: "approved",
          notes: undefined,
        }),
      }),
    );
  });

  it("rejects a provider with the review payload and refreshes", async () => {
    render(<VerificationQueueClient verifications={[ITEM]} />);
    fireEvent.click(screen.getByRole("button", { name: /reject/i }));

    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/verifications/review",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          userId: "provider-1",
          decision: "rejected",
          notes: undefined,
        }),
      }),
    );
  });
});

describe("VerificationQueue (card)", () => {
  it("toggles the notes textarea and passes the entered note to onApprove", () => {
    const onApprove = vi.fn();
    render(
      <VerificationQueue
        verifications={[ITEM]}
        onApprove={onApprove}
        onReject={vi.fn()}
      />,
    );

    // Notes hidden until toggled.
    expect(screen.queryByPlaceholderText(/decision notes/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /add notes/i }));

    const notes = screen.getByPlaceholderText(/decision notes/i);
    fireEvent.change(notes, { target: { value: "Docs verified manually." } });
    fireEvent.click(screen.getByRole("button", { name: /approve/i }));

    expect(onApprove).toHaveBeenCalledWith("provider-1", "Docs verified manually.");
  });

  it("renders a View documents link when a document url is present", () => {
    render(
      <VerificationQueue
        verifications={[ITEM]}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    expect(screen.getByRole("link", { name: /view documents/i })).toHaveAttribute(
      "href",
      "https://example.com/doc.pdf",
    );
  });
});
