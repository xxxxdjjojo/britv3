import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ArchivedDraftListings } from "@/components/dashboard/agent/listings/ArchivedDraftListings";
import { ARCHIVED_DRAFT_LISTINGS, makeListing } from "./fixtures";

// next/image renders a complex element; stub to a plain img so assertions on
// alt text and absence of network behaviour stay deterministic.
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { src, alt } = props as { src: string; alt: string };
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} />;
  },
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

beforeEach(() => {
  toastSuccess.mockReset();
  toastError.mockReset();
  vi.restoreAllMocks();
});

describe("ArchivedDraftListings — render + tab counts", () => {
  it("renders the heading and both tab triggers with counts", () => {
    render(<ArchivedDraftListings listings={ARCHIVED_DRAFT_LISTINGS} />);
    expect(
      screen.getByRole("heading", { name: /Archived & Draft Listings/ }),
    ).toBeInTheDocument();
    // 2 archived, 1 draft in the fixture
    expect(
      screen.getByRole("tab", { name: /Archived \(2\)/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Drafts \(1\)/ }),
    ).toBeInTheDocument();
  });

  it("shows the archived tab content by default", () => {
    render(<ArchivedDraftListings listings={ARCHIVED_DRAFT_LISTINGS} />);
    expect(screen.getByText("Archived one")).toBeInTheDocument();
    expect(screen.getByText("Archived two")).toBeInTheDocument();
    // Draft content is in the hidden (unselected) panel
    expect(screen.queryByText("Draft one")).not.toBeInTheDocument();
  });
});

describe("ArchivedDraftListings — tab switching", () => {
  it("switches to the Drafts tab and shows draft listings", () => {
    render(<ArchivedDraftListings listings={ARCHIVED_DRAFT_LISTINGS} />);
    fireEvent.click(screen.getByRole("tab", { name: /Drafts/ }));
    expect(screen.getByText("Draft one")).toBeInTheDocument();
    expect(screen.queryByText("Archived one")).not.toBeInTheDocument();
  });
});

describe("ArchivedDraftListings — empty states", () => {
  it("shows 'No listings found.' in the archived tab when none are archived", () => {
    render(
      <ArchivedDraftListings
        listings={[makeListing({ id: "d", status: "draft", title: "Only draft" })]}
      />,
    );
    expect(screen.getByRole("tab", { name: /Archived \(0\)/ })).toBeInTheDocument();
    expect(screen.getByText("No listings found.")).toBeInTheDocument();
  });

  it("shows zero counts on both tabs when given an empty list", () => {
    render(<ArchivedDraftListings listings={[]} />);
    expect(screen.getByRole("tab", { name: /Archived \(0\)/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Drafts \(0\)/ })).toBeInTheDocument();
  });
});

describe("ArchivedDraftListings — restore action", () => {
  it("calls the PATCH endpoint and removes the card on success", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    render(
      <ArchivedDraftListings
        listings={[makeListing({ id: "arch-x", status: "archived", title: "Restore me" })]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Restore" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/agent/listings/arch-x",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
    await waitFor(() =>
      expect(screen.queryByText("Restore me")).not.toBeInTheDocument(),
    );
    expect(toastSuccess).toHaveBeenCalledWith("Listing restored to draft.");
  });

  it("shows an error toast and keeps the card when restore fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 500 }),
    );

    render(
      <ArchivedDraftListings
        listings={[makeListing({ id: "arch-y", status: "archived", title: "Keep me" })]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Restore" }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "Could not restore listing. Please try again.",
      ),
    );
    expect(screen.getByText("Keep me")).toBeInTheDocument();
  });
});
