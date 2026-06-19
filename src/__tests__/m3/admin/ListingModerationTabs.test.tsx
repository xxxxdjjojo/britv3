/**
 * M3-A9 — ListingModerationTabs (pending / all / flagged tabs + approve/reject/flag).
 *
 * The component owns three tabs, per-row action buttons, and two confirm
 * modals (reject + flag) that drive POSTs through the useAdminAction hook.
 * next/navigation, sonner, and global fetch are mocked.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";

import { ListingModerationTabs } from "@/components/admin/ListingModerationTabs";
import type { AdminListing } from "@/services/admin/listing-service";

const mockRefresh = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh, push: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: (msg: string) => toastSuccess(msg),
    error: (msg: string) => toastError(msg),
    info: vi.fn(),
  },
}));

function listing(over: Partial<AdminListing>): AdminListing {
  return {
    id: "00000000-0000-0000-0000-000000000000",
    title: "A listing",
    status: "pending",
    created_at: "2026-03-15T00:00:00.000Z",
    user_id: "owner-1",
    flagged: false,
    ...over,
  };
}

const PENDING = listing({ id: "pending-listing-aaaaaaaa", title: "Pending Flat", status: "pending" });
const PUBLISHED = listing({ id: "all-listing-bbbbbbbb", title: "Live House", status: "published" });
const FLAGGED = listing({ id: "flagged-listing-cccccccc", title: "Flagged Studio", status: "flagged" });

function renderTabs(over?: Partial<React.ComponentProps<typeof ListingModerationTabs>>) {
  return render(
    <ListingModerationTabs
      pendingListings={[PENDING]}
      allListings={[PUBLISHED]}
      flaggedListings={[FLAGGED]}
      {...over}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
});

describe("ListingModerationTabs", () => {
  it("renders the pending tab by default with its rows", () => {
    renderTabs();
    expect(screen.getByText("Pending Flat")).toBeInTheDocument();
  });

  it("shows count badges on the pending and flagged tab triggers", () => {
    renderTabs();
    const pendingTab = screen.getByRole("tab", { name: /pending review/i });
    const flaggedTab = screen.getByRole("tab", { name: /flagged/i });
    expect(within(pendingTab).getByText("1")).toBeInTheDocument();
    expect(within(flaggedTab).getByText("1")).toBeInTheDocument();
  });

  it("switches to the All Listings tab and reveals its rows", () => {
    renderTabs();
    fireEvent.click(screen.getByRole("tab", { name: /all listings/i }));
    expect(screen.getByText("Live House")).toBeInTheDocument();
  });

  it("renders an empty state in the pending tab when there are no pending listings", () => {
    renderTabs({ pendingListings: [] });
    expect(screen.getByText(/no pending listings/i)).toBeInTheDocument();
  });

  it("approves a pending listing via POST and toasts success", async () => {
    renderTabs();
    fireEvent.click(screen.getByRole("button", { name: /approve/i }));

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Listing approved"));
    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/listings/pending-listing-aaaaaaaa/approve",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("opens the reject modal, requires a reason, and POSTs the chosen reason", async () => {
    renderTabs();
    fireEvent.click(screen.getByRole("button", { name: /reject/i }));

    // Modal is open; confirm is disabled until a reason is picked.
    const dialog = screen.getByRole("dialog");
    const confirm = within(dialog).getByRole("button", { name: /reject listing/i });
    expect(confirm).toBeDisabled();

    // Open the base-ui select and choose the first reason.
    fireEvent.click(within(dialog).getByRole("combobox"));
    fireEvent.click(await screen.findByRole("option", { name: "Incomplete information" }));

    await waitFor(() => expect(confirm).not.toBeDisabled());
    fireEvent.click(confirm);

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/listings/pending-listing-aaaaaaaa/reject",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ reason: "Incomplete information" }),
        }),
      ),
    );
  });

  it("opens the flag modal with flag-specific reasons", () => {
    renderTabs();
    fireEvent.click(screen.getByRole("button", { name: /flag/i }));
    const dialog = screen.getByRole("dialog");
    // "Flag Listing" appears as both the heading and the confirm button label,
    // so assert on the dialog description text that is unique to the flag modal.
    expect(
      within(dialog).getByText(/flagged for further review/i),
    ).toBeInTheDocument();
  });
});
