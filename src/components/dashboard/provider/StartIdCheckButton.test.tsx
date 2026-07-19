import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StartIdCheckButton } from "./StartIdCheckButton";

describe("StartIdCheckButton", () => {
  const fetchMock = vi.fn();
  const assignMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    Object.defineProperty(window, "location", {
      value: { ...window.location, assign: assignMock },
      writable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
    assignMock.mockReset();
  });

  it("starts a session and redirects to the hosted URL", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ redirectUrl: "https://verify.didit.me/session/xyz" }) });
    render(<StartIdCheckButton label="Get started" />);
    fireEvent.click(screen.getByRole("button", { name: /get started/i }));
    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith("https://verify.didit.me/session/xyz");
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/kyc/session", { method: "POST" });
  });

  it("shows the API error message when the request fails", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: "Identity verification is not available yet" }) });
    render(<StartIdCheckButton label="Get started" />);
    fireEvent.click(screen.getByRole("button", { name: /get started/i }));
    expect(await screen.findByText(/not available yet/i)).toBeInTheDocument();
    expect(assignMock).not.toHaveBeenCalled();
  });

  it("shows a generic error when fetch throws", async () => {
    fetchMock.mockRejectedValue(new Error("network"));
    render(<StartIdCheckButton label="Get started" />);
    fireEvent.click(screen.getByRole("button", { name: /get started/i }));
    expect(await screen.findByText(/unavailable right now/i)).toBeInTheDocument();
  });
});
