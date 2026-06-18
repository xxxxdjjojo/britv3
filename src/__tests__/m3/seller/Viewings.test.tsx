import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import ManageViewingsPage from "@/app/(protected)/dashboard/seller/viewings/page";
import { ViewingCard } from "@/components/seller/viewings/ViewingCard";
import { makeViewing } from "./_fixtures";

// next/image renders a plain img in tests.
vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

// The action modal owns its own network/state; stub it.
vi.mock("@/components/seller/viewings/ViewingActionModal", () => ({
  ViewingActionModal: ({ action }: { action: string }) => (
    <div data-testid="viewing-action-modal">action:{action}</div>
  ),
}));

function stubFetch(impl: () => Promise<Response> | Response) {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ManageViewingsPage — loading skeleton", () => {
  it("shows skeleton placeholders while loading then clears them", async () => {
    let resolve!: (r: Response) => void;
    stubFetch(() => new Promise<Response>((res) => { resolve = res; }));

    const { container } = render(<ManageViewingsPage />);
    // Initial loading state renders 3 animate-pulse skeleton cards.
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(3);

    resolve(new Response(JSON.stringify([]), { status: 200 }));
    await waitFor(() =>
      expect(container.querySelectorAll(".animate-pulse")).toHaveLength(0),
    );
  });
});

describe("ManageViewingsPage — empty state", () => {
  it("renders the empty notice when there are no upcoming viewings", async () => {
    stubFetch(() => new Response(JSON.stringify([]), { status: 200 }));
    render(<ManageViewingsPage />);
    expect(await screen.findByText("No upcoming viewings")).toBeInTheDocument();
  });

  it("treats a failed fetch as empty (renders empty notice, not a crash)", async () => {
    stubFetch(() => new Response(null, { status: 500 }));
    render(<ManageViewingsPage />);
    expect(await screen.findByText("No upcoming viewings")).toBeInTheDocument();
  });
});

describe("ManageViewingsPage — render-with-data", () => {
  it("groups viewings by date and renders the buyer", async () => {
    stubFetch(() =>
      new Response(
        JSON.stringify([makeViewing({ buyer_name: "Dana Viewer", viewing_datetime: "2026-06-20T15:00:00.000Z" })]),
        { status: 200 },
      ),
    );
    render(<ManageViewingsPage />);
    expect(await screen.findByText("Dana Viewer")).toBeInTheDocument();
  });

  it("re-fetches with the past filter when the Past tab is clicked", async () => {
    const fetchMock = stubFetch(() => new Response(JSON.stringify([]), { status: 200 }));
    render(<ManageViewingsPage />);

    await screen.findByText("No upcoming viewings");
    fireEvent.click(screen.getByRole("button", { name: /past viewings/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/seller/viewings?filter=past"),
    );
  });
});

describe("ViewingCard render + interactive", () => {
  it("renders address, buyer and status badge", () => {
    render(<ViewingCard viewing={makeViewing({ status: "confirmed" })} onUpdated={vi.fn()} />);
    expect(screen.getByText("14 Elm Road, London")).toBeInTheDocument();
    expect(screen.getByText("Bob Viewer")).toBeInTheDocument();
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
  });

  it("shows Confirm action only for pending viewings", () => {
    render(<ViewingCard viewing={makeViewing({ status: "pending" })} onUpdated={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });

  it("hides all actions for cancelled / completed viewings", () => {
    render(<ViewingCard viewing={makeViewing({ status: "cancelled" })} onUpdated={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Reschedule" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("opens the action modal with the chosen action on Cancel", () => {
    render(<ViewingCard viewing={makeViewing({ status: "confirmed" })} onUpdated={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByTestId("viewing-action-modal")).toHaveTextContent("action:cancel");
  });

  it("renders buyer feedback when present", () => {
    render(
      <ViewingCard
        viewing={makeViewing({ status: "completed", feedback: "Loved the kitchen" })}
        onUpdated={vi.fn()}
      />,
    );
    expect(screen.getByText("Buyer feedback")).toBeInTheDocument();
    expect(within(screen.getByText("Buyer feedback").parentElement!).getByText(/Loved the kitchen/)).toBeInTheDocument();
  });
});
