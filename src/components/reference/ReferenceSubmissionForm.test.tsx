import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { ReferenceSubmissionForm } from "./ReferenceSubmissionForm";

const CLIENT_PROPS = {
  token: "raw-token-xyz",
  providerName: "Ace Plumbing",
  providerTrade: "Plumber",
  referenceType: "client" as const,
  refereeName: "Jane Doe",
  relationship: "Customer",
  requiresWorkDate: true,
};

const PEER_PROPS = {
  token: "raw-token-xyz",
  providerName: "Ace Plumbing",
  providerTrade: "Plumber",
  referenceType: "peer" as const,
  refereeName: "Bob Smith",
  relationship: null,
  requiresWorkDate: false,
};

function mockFetch(status: number, body: Record<string, unknown> = {}) {
  const fn = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

function typeReference(text: string) {
  fireEvent.change(screen.getByLabelText(/in your own words/i), {
    target: { value: text },
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("ReferenceSubmissionForm", () => {
  it("shows the provider name read-only (no input to change who they vouch for)", () => {
    render(<ReferenceSubmissionForm {...CLIENT_PROPS} />);
    expect(screen.getByText(/Ace Plumbing/)).toBeTruthy();
    // Provider identity is heading text, not an editable field.
    expect(screen.queryByLabelText(/provider name/i)).toBeNull();
  });

  it("renders work_date and rating for client references", () => {
    render(<ReferenceSubmissionForm {...CLIENT_PROPS} />);
    expect(screen.getByLabelText(/when did the work take place/i)).toBeTruthy();
    // Rating is a real radio group (native <input type="radio">).
    expect(screen.getByRole("group", { name: /rating/i })).toBeTruthy();
    expect(screen.getByRole("radio", { name: /1 star/i })).toBeTruthy();
  });

  it("hides work_date and rating for peer references", () => {
    render(<ReferenceSubmissionForm {...PEER_PROPS} />);
    expect(screen.queryByLabelText(/when did the work take place/i)).toBeNull();
    expect(screen.queryByRole("radio")).toBeNull();
  });

  it("sets the work_date max to today", () => {
    render(<ReferenceSubmissionForm {...CLIENT_PROPS} />);
    const input = screen.getByLabelText(/when did the work take place/i) as HTMLInputElement;
    const today = new Date().toISOString().slice(0, 10);
    expect(input.max).toBe(today);
  });

  it("submits a body with NO ids and shows the success state", async () => {
    const fetchMock = mockFetch(200, { ok: true });
    render(<ReferenceSubmissionForm {...CLIENT_PROPS} />);

    typeReference("They fitted a bathroom, tidy and on time.");
    fireEvent.change(screen.getByLabelText(/when did the work take place/i), {
      target: { value: "2026-01-05" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit reference/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/references/raw-token-xyz/submit");
    const sent = JSON.parse(init.body as string);
    expect(sent).not.toHaveProperty("id");
    expect(sent).not.toHaveProperty("provider_id");
    expect(sent.reference_text).toBe("They fitted a bathroom, tidy and on time.");
    expect(sent.work_date).toBe("2026-01-05");

    expect(await screen.findByText(/your reference has been submitted/i)).toBeTruthy();
  });

  it("surfaces the 409 already-submitted message", async () => {
    mockFetch(409, { error: "already" });
    render(<ReferenceSubmissionForm {...PEER_PROPS} />);
    typeReference("Reliable and skilled, happy to vouch.");
    fireEvent.click(screen.getByRole("button", { name: /submit reference/i }));
    expect(await screen.findByText(/already submitted/i)).toBeTruthy();
  });

  it("surfaces the 410 expired message", async () => {
    mockFetch(410, {});
    render(<ReferenceSubmissionForm {...PEER_PROPS} />);
    typeReference("Reliable and skilled, happy to vouch.");
    fireEvent.click(screen.getByRole("button", { name: /submit reference/i }));
    expect(await screen.findByText(/expired/i)).toBeTruthy();
  });

  it("surfaces the 429 rate-limited message", async () => {
    mockFetch(429, {});
    render(<ReferenceSubmissionForm {...PEER_PROPS} />);
    typeReference("Reliable and skilled, happy to vouch.");
    fireEvent.click(screen.getByRole("button", { name: /submit reference/i }));
    expect(await screen.findByText(/try again in a moment/i)).toBeTruthy();
  });

  it("surfaces a 400 validation message from the server", async () => {
    mockFetch(400, { error: "The work date can't be in the future." });
    render(<ReferenceSubmissionForm {...PEER_PROPS} />);
    typeReference("Reliable and skilled, happy to vouch.");
    fireEvent.click(screen.getByRole("button", { name: /submit reference/i }));
    expect(await screen.findByText(/work date can't be in the future/i)).toBeTruthy();
  });

  it("blocks submit client-side when the reference text is too short", async () => {
    const fetchMock = mockFetch(200, { ok: true });
    render(<ReferenceSubmissionForm {...PEER_PROPS} />);
    typeReference("short");
    fireEvent.click(screen.getByRole("button", { name: /submit reference/i }));
    expect(await screen.findByText(/at least 10 characters/i)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("declines with an optional reason and shows the declined state", async () => {
    const fetchMock = mockFetch(200, { ok: true });
    render(<ReferenceSubmissionForm {...PEER_PROPS} />);

    fireEvent.click(screen.getByRole("button", { name: /rather not provide/i }));
    fireEvent.change(screen.getByLabelText(/let them know why/i), {
      target: { value: "Too busy right now" },
    });
    fireEvent.click(screen.getByRole("button", { name: /confirm decline/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/references/raw-token-xyz/decline");
    expect(JSON.parse(init.body as string)).toEqual({ reason: "Too busy right now" });

    expect(await screen.findByText(/we won.t ask again/i)).toBeTruthy();
  });

  it("allows declining without forcing a reason", async () => {
    const fetchMock = mockFetch(200, { ok: true });
    render(<ReferenceSubmissionForm {...PEER_PROPS} />);

    fireEvent.click(screen.getByRole("button", { name: /rather not provide/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm decline/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body as string)).toEqual({});
  });
});
