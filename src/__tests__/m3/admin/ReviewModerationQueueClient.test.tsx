/**
 * M3-A9 — ReviewModerationQueueClient + inner ReviewModerationQueue card.
 *
 * The client maps Remove/Dismiss actions onto POSTs at
 * /api/admin/reports/resolve with the resolution and adminId. We test the
 * fetch payloads, the refresh, and the empty state.
 *
 * FINDING: review-moderation data layer has documented schema-drift column
 * errors this milestone; these tests feed fixture props to the client, which
 * bypasses the broken query path.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { ReviewModerationQueueClient } from "@/components/admin/ReviewModerationQueueClient";
import type { ReportedReview } from "@/services/admin/review-service";

const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh, push: vi.fn() }),
}));

const REPORT: ReportedReview = {
  id: "report-aaaaaaaa-1111",
  entity_id: "review-9999",
  reason: "Hate speech",
  status: "open",
  created_at: "2026-05-10T00:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
});

describe("ReviewModerationQueueClient", () => {
  it("renders the report id, reason and linked review id", () => {
    render(<ReviewModerationQueueClient reports={[REPORT]} adminId="admin-1" />);
    expect(screen.getByText(/report #report-a/i)).toBeInTheDocument();
    expect(screen.getByText("Hate speech")).toBeInTheDocument();
    expect(screen.getByText(/review-9999/)).toBeInTheDocument();
  });

  it("renders an empty state when there are no reports", () => {
    render(<ReviewModerationQueueClient reports={[]} adminId="admin-1" />);
    expect(screen.getByText(/no reported reviews/i)).toBeInTheDocument();
  });

  it("resolves (removes) a review with the resolved payload including adminId", async () => {
    render(<ReviewModerationQueueClient reports={[REPORT]} adminId="admin-42" />);
    fireEvent.click(screen.getByRole("button", { name: /remove review/i }));

    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/reports/resolve",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          reportId: "report-aaaaaaaa-1111",
          resolution: "resolved",
          note: undefined,
          adminId: "admin-42",
        }),
      }),
    );
  });

  it("dismisses a report with the dismissed payload including adminId", async () => {
    render(<ReviewModerationQueueClient reports={[REPORT]} adminId="admin-42" />);
    fireEvent.click(screen.getByRole("button", { name: /dismiss report/i }));

    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/reports/resolve",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          reportId: "report-aaaaaaaa-1111",
          resolution: "dismissed",
          note: undefined,
          adminId: "admin-42",
        }),
      }),
    );
  });
});
