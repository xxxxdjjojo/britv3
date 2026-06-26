import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { LandlordGuideDownloadForm } from "./LandlordGuideDownloadForm";

function mockFetch(response: {
  ok: boolean;
  body: { ok?: boolean; alreadySubscribed?: boolean };
}) {
  const fn = vi.fn().mockResolvedValue({
    ok: response.ok,
    json: async () => response.body,
  });
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

function fillEmail(value: string) {
  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value },
  });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: /send me the guide/i }));
}

describe("LandlordGuideDownloadForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("posts to /api/newsletter with source 'landlord_guide'", async () => {
    const fetchMock = mockFetch({ ok: true, body: { ok: true } });

    render(<LandlordGuideDownloadForm />);
    fillEmail("landlord@example.com");
    submit();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/newsletter");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      email: "landlord@example.com",
      source: "landlord_guide",
    });
  });

  it("reveals a download link to the PDF on success", async () => {
    mockFetch({ ok: true, body: { ok: true, alreadySubscribed: false } });

    render(<LandlordGuideDownloadForm />);
    fillEmail("landlord@example.com");
    submit();

    const downloadLink = await screen.findByRole("link", {
      name: /download the guide/i,
    });
    expect(downloadLink).toHaveAttribute("href", "/guides/landlord-guide.pdf");
    expect(downloadLink).toHaveAttribute("target", "_blank");
    expect(downloadLink).toHaveAttribute(
      "rel",
      expect.stringContaining("noopener"),
    );

    // Confirms a copy was emailed.
    expect(screen.getByText(/emailed a copy/i)).toBeInTheDocument();
  });

  it("notes the existing subscription when already on the list", async () => {
    mockFetch({ ok: true, body: { ok: true, alreadySubscribed: true } });

    render(<LandlordGuideDownloadForm />);
    fillEmail("existing@example.com");
    submit();

    expect(await screen.findByText(/already on our list/i)).toBeInTheDocument();
  });

  it("shows an accessible error message when the request fails", async () => {
    mockFetch({ ok: false, body: { ok: false } });

    render(<LandlordGuideDownloadForm />);
    fillEmail("landlord@example.com");
    submit();

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
    // No download link is revealed on failure.
    expect(
      screen.queryByRole("link", { name: /download the guide/i }),
    ).not.toBeInTheDocument();
  });

  it("handles an invalid email rejected by the API (400)", async () => {
    mockFetch({ ok: false, body: { ok: false } });

    render(<LandlordGuideDownloadForm />);
    fillEmail("not-an-email");
    submit();

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});
