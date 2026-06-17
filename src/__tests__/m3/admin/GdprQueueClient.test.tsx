/**
 * M3-A9 — GdprQueueClient (status filter + SLA badges + fulfil action).
 *
 * Renders a request table, a status Select that pushes ?status= to the URL,
 * SLA badges derived from created_at, and a Fulfil button on pending rows
 * that POSTs to the export/delete endpoint. We freeze time so SLA maths is
 * deterministic. next/navigation, sonner and fetch are mocked.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";

import { GdprQueueClient } from "@/components/admin/GdprQueueClient";
import type { GdprRequest } from "@/services/admin/gdpr-service";

// SLA badges are derived from created_at vs. the real "now" inside the
// component (it calls new Date()). We compute created_at relative to the
// real clock so the maths is deterministic WITHOUT fake timers — fake timers
// break waitFor and base-ui Select's microtask-driven open/select flow.
const DAY_MS = 24 * 60 * 60 * 1000;
function daysAgo(n: number): string {
  return new Date(Date.now() - n * DAY_MS).toISOString();
}

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const toastSuccess = vi.fn();
const toastInfo = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (m: string) => toastSuccess(m),
    info: (m: string) => toastInfo(m),
    error: vi.fn(),
  },
}));

function req(over: Partial<GdprRequest>): GdprRequest {
  return {
    id: "11111111-2222-3333-4444-555555555555",
    user_id: "user-1",
    request_type: "export",
    status: "pending",
    export_url: null,
    export_expires_at: null,
    notes: null,
    fulfilled_by: null,
    fulfilled_at: null,
    created_at: daysAgo(7), // ~23 days SLA remaining
    ...over,
  };
}

const PENDING_DELETION = req({
  id: "del-1aaaaaaa",
  request_type: "deletion",
  status: "pending",
  created_at: daysAgo(5),
});

// Created 40 days ago -> past the 30-day deadline => overdue.
const OVERDUE_EXPORT = req({
  id: "exp-overduebbbb",
  request_type: "export",
  status: "pending",
  created_at: daysAgo(40),
});

const FULFILLED = req({
  id: "ful-1cccccccc",
  status: "fulfilled",
  fulfilled_at: daysAgo(2),
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) }));
});

describe("GdprQueueClient", () => {
  it("renders the request count and a row per request", () => {
    render(
      <GdprQueueClient
        requests={[PENDING_DELETION, FULFILLED]}
        allRequests={[PENDING_DELETION, FULFILLED]}
        statusFilter="all"
      />,
    );
    expect(screen.getByText(/2 requests/i)).toBeInTheDocument();
    expect(screen.getByText(/deletion/i)).toBeInTheDocument();
  });

  it("shows an OVERDUE SLA badge for a request past its 30-day deadline", () => {
    render(
      <GdprQueueClient
        requests={[OVERDUE_EXPORT]}
        allRequests={[OVERDUE_EXPORT]}
        statusFilter="pending"
      />,
    );
    expect(screen.getByText(/overdue/i)).toBeInTheDocument();
  });

  it("shows a Complete SLA indicator for a fulfilled request", () => {
    render(
      <GdprQueueClient
        requests={[FULFILLED]}
        allRequests={[FULFILLED]}
        statusFilter="fulfilled"
      />,
    );
    expect(screen.getByText(/complete/i)).toBeInTheDocument();
  });

  it("renders the empty-filter message when no requests match", () => {
    render(
      <GdprQueueClient requests={[]} allRequests={[]} statusFilter="failed" />,
    );
    expect(screen.getByText(/no requests match the selected filter/i)).toBeInTheDocument();
  });

  it("renders the status filter options with per-status counts", async () => {
    render(
      <GdprQueueClient
        requests={[PENDING_DELETION]}
        allRequests={[PENDING_DELETION, FULFILLED]}
        statusFilter="all"
      />,
    );
    fireEvent.click(screen.getByRole("combobox"));
    // Counts are derived from allRequests: 1 pending, 1 fulfilled.
    expect(await screen.findByRole("option", { name: /pending \(1\)/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /fulfilled \(1\)/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /all statuses/i })).toBeInTheDocument();
  });

  // FINDING: base-ui Select, when CONTROLLED (value={current}), does not fire
  // onValueChange on a fireEvent/userEvent click of an option under happy-dom
  // (no real pointer geometry / pointer-capture). The uncontrolled reject
  // modal Select in ListingModerationTabs works; this one is controlled, so
  // the ?status= push path is verified by E2E rather than here.
  it.skip("pushes ?status=pending when the controlled status Select changes", async () => {
    render(
      <GdprQueueClient
        requests={[PENDING_DELETION]}
        allRequests={[PENDING_DELETION, FULFILLED]}
        statusFilter="all"
      />,
    );
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(await screen.findByRole("option", { name: /pending \(1\)/i }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("?status=pending"));
  });

  it("fulfils a pending deletion via the delete endpoint and toasts success", async () => {
    render(
      <GdprQueueClient
        requests={[PENDING_DELETION]}
        allRequests={[PENDING_DELETION]}
        statusFilter="pending"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /delete data/i }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/gdpr/del-1aaaaaaa/delete",
        expect.objectContaining({ method: "POST" }),
      ),
    );
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("User data deletion completed"),
    );
  });

  it("fulfils a pending export via the export endpoint", async () => {
    const pendingExport = req({
      id: "exp-pendingdddd",
      request_type: "export",
      status: "pending",
      created_at: daysAgo(3),
    });
    render(
      <GdprQueueClient
        requests={[pendingExport]}
        allRequests={[pendingExport]}
        statusFilter="pending"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /export data/i }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/gdpr/exp-pendingdddd/export",
        expect.objectContaining({ method: "POST" }),
      ),
    );
  });

  it("shows an info toast and does not refresh when fulfil returns 409", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 409, json: async () => ({}) }),
    );
    render(
      <GdprQueueClient
        requests={[PENDING_DELETION]}
        allRequests={[PENDING_DELETION]}
        statusFilter="pending"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /delete data/i }));

    await waitFor(() =>
      expect(toastInfo).toHaveBeenCalledWith(
        "Request already fulfilled or in progress",
      ),
    );
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("does not render a fulfil button on non-pending rows", () => {
    render(
      <GdprQueueClient
        requests={[FULFILLED]}
        allRequests={[FULFILLED]}
        statusFilter="fulfilled"
      />,
    );
    const table = screen.getByRole("table");
    expect(
      within(table).queryByRole("button", { name: /export data|delete data/i }),
    ).not.toBeInTheDocument();
  });
});
