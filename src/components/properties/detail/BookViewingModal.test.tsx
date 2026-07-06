import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BookViewingModal } from "./BookViewingModal";

const PROP_UUID = "bbbbbbbb-0006-0006-0006-bbbbbbbbbbbb";

function mockFetchSequence(handlers: Array<(url: string, init?: RequestInit) => Response>) {
  let call = 0;
  return vi.fn(async (url: string, init?: RequestInit) => {
    const h = handlers[Math.min(call, handlers.length - 1)];
    call += 1;
    return h(url, init);
  });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => vi.restoreAllMocks());
beforeEach(() => vi.clearAllMocks());

describe("BookViewingModal — request-a-viewing fallback", () => {
  it("shows a request form when no slots are available", async () => {
    vi.stubGlobal("fetch", mockFetchSequence([() => json({ slots: [] })]));

    render(<BookViewingModal propertyId={PROP_UUID} propertyStatus="active" existingViewingId={null} />);

    expect(await screen.findByText(/request a viewing and the host will confirm/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /request a viewing/i })).toBeInTheDocument();
  });

  it("submits a request and shows a confirmation", async () => {
    const fetchMock = mockFetchSequence([
      () => json({ slots: [] }), // initial slot load
      () => json({ success: true, viewingId: "v1" }), // request-viewing POST
    ]);
    vi.stubGlobal("fetch", fetchMock);

    render(<BookViewingModal propertyId={PROP_UUID} propertyStatus="active" existingViewingId={null} />);

    const input = await screen.findByLabelText(/preferred date & time/i);
    fireEvent.change(input, { target: { value: "2027-04-02T14:00" } });
    fireEvent.click(screen.getByRole("button", { name: /request a viewing/i }));

    expect(await screen.findByText(/request sent/i)).toBeInTheDocument();
    // second fetch call hit the request-viewing endpoint
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/properties/${PROP_UUID}/request-viewing`,
        expect.objectContaining({ method: "POST" }),
      ),
    );
  });

  it("prompts sign-in when the request returns 401", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchSequence([() => json({ slots: [] }), () => json({ error: "Not authenticated" }, 401)]),
    );

    render(<BookViewingModal propertyId={PROP_UUID} propertyStatus="active" existingViewingId={null} />);

    const input = await screen.findByLabelText(/preferred date & time/i);
    fireEvent.change(input, { target: { value: "2027-04-02T14:00" } });
    fireEvent.click(screen.getByRole("button", { name: /request a viewing/i }));

    expect(await screen.findByRole("link", { name: /sign in/i })).toBeInTheDocument();
  });
});
