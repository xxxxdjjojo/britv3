/**
 * M3-A9 — AuditLogClient (action/adminId filters + export + load-more cursor).
 *
 * The client owns two filter inputs that push query params, a clear button,
 * a load-more button that pushes a cursor, and a CSV export that POSTs and
 * downloads. next/navigation and fetch are mocked; the DOM download side
 * effects (Blob/createObjectURL/anchor click) are stubbed.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { AuditLogClient } from "@/components/admin/AuditLogClient";
import type { AuditLogEntry } from "@/services/admin/audit-service";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

function entry(over: Partial<AuditLogEntry>): AuditLogEntry {
  return {
    id: "audit-1aaaaaaa",
    admin_id: "admin-1bbbbbbb",
    action: "user.suspend",
    target_type: "user",
    target_id: "target-1ccccccc",
    metadata: null,
    ip_address: "10.0.0.1",
    created_at: "2026-06-15T09:30:00.000Z",
    ...over,
  };
}

const ENTRIES = [
  entry({ id: "audit-1aaaaaaa", action: "user.suspend", created_at: "2026-06-15T09:30:00.000Z" }),
  entry({ id: "audit-2dddddddd", action: "listing.reject", created_at: "2026-06-14T08:00:00.000Z" }),
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ csv: "a,b\n1,2", count: 2 }) }));
  // Stub only the blob URL helpers on the real URL (keep URL a constructor so
  // happy-dom internals still work), and neutralise the anchor click so the
  // CSV download side effect doesn't try to navigate the test window.
  URL.createObjectURL = vi.fn(() => "blob:fake");
  URL.revokeObjectURL = vi.fn();
  vi
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => undefined);
});

function renderClient(over?: Partial<React.ComponentProps<typeof AuditLogClient>>) {
  return render(
    <AuditLogClient
      entries={ENTRIES}
      actionFilter=""
      adminIdFilter=""
      hasMore={false}
      limit={50}
      {...over}
    />,
  );
}

describe("AuditLogClient", () => {
  it("renders a row per audit entry with its action", () => {
    renderClient();
    expect(screen.getByText("user.suspend")).toBeInTheDocument();
    expect(screen.getByText("listing.reject")).toBeInTheDocument();
  });

  it("renders the empty-filter message when there are no entries", () => {
    renderClient({ entries: [] });
    expect(screen.getByText(/no entries match the current filters/i)).toBeInTheDocument();
  });

  it("pushes a filtered URL from the action and admin id inputs on Apply", () => {
    renderClient();
    fireEvent.change(screen.getByPlaceholderText(/filter by action/i), {
      target: { value: "user.suspend" },
    });
    fireEvent.change(screen.getByPlaceholderText(/filter by admin id/i), {
      target: { value: "admin-9" },
    });
    fireEvent.click(screen.getByRole("button", { name: /apply/i }));

    expect(mockPush).toHaveBeenCalledWith("?action=user.suspend&adminId=admin-9");
  });

  it("shows a Clear button only when a filter is active and resets to ?", () => {
    renderClient({ actionFilter: "user.suspend" });
    const clear = screen.getByRole("button", { name: /clear/i });
    fireEvent.click(clear);
    expect(mockPush).toHaveBeenCalledWith("?");
  });

  it("does not render a Clear button when no filter is active", () => {
    renderClient();
    expect(screen.queryByRole("button", { name: /clear/i })).not.toBeInTheDocument();
  });

  it("renders Load more only when hasMore is true and pushes the oldest cursor", () => {
    renderClient({ hasMore: true, limit: 50 });
    const loadMore = screen.getByRole("button", { name: /load more/i });
    fireEvent.click(loadMore);
    // Oldest entry's created_at is used as the cursor.
    expect(mockPush).toHaveBeenCalledWith("?cursor=2026-06-14T08%3A00%3A00.000Z");
  });

  it("disables the export button when there are no entries", () => {
    renderClient({ entries: [] });
    expect(screen.getByRole("button", { name: /export csv/i })).toBeDisabled();
  });

  it("POSTs to the export endpoint when Export CSV is clicked", async () => {
    renderClient({ actionFilter: "user.suspend" });
    fireEvent.click(screen.getByRole("button", { name: /export csv/i }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/audit-log/export?action=user.suspend",
        expect.objectContaining({ method: "POST" }),
      ),
    );
  });
});
