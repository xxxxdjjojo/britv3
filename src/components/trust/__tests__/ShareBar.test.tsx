import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const { trackEventMock } = vi.hoisted(() => ({ trackEventMock: vi.fn() }));

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: trackEventMock,
}));

import { ShareBar } from "../ShareBar";

const PROPS = {
  title: "How much rent rise is legal?",
  toolKey: "rent-rise-checker",
  url: "https://www.truedeed.co.uk/tools/rent-rise-checker",
} as const;

describe("ShareBar", () => {
  beforeEach(() => {
    trackEventMock.mockClear();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  it("links to WhatsApp with the encoded title and url, and tracks the whatsapp share", () => {
    render(<ShareBar {...PROPS} />);

    const whatsApp = screen.getByRole("link", { name: /share on whatsapp/i });
    expect(whatsApp).toHaveAttribute(
      "href",
      `https://wa.me/?text=${encodeURIComponent(`${PROPS.title} ${PROPS.url}`)}`,
    );
    expect(whatsApp).toHaveAttribute("target", "_blank");
    expect(whatsApp).toHaveAttribute("rel", expect.stringContaining("noopener"));

    fireEvent.click(whatsApp);
    expect(trackEventMock).toHaveBeenCalledWith("tool_shared", {
      tool: PROPS.toolKey,
      channel: "whatsapp",
    });
  });

  it("copies the link, shows 'Copied', and tracks the copy_link share", async () => {
    render(<ShareBar {...PROPS} />);

    fireEvent.click(screen.getByRole("button", { name: /copy link/i }));

    expect(await screen.findByText("Copied")).toBeInTheDocument();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(PROPS.url);
    expect(trackEventMock).toHaveBeenCalledWith("tool_shared", {
      tool: PROPS.toolKey,
      channel: "copy_link",
    });
  });

  it("survives a missing clipboard API without throwing", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });
    render(<ShareBar {...PROPS} />);

    fireEvent.click(screen.getByRole("button", { name: /copy link/i }));

    // Still tracked, no crash; "Copied" never shows because the write failed.
    expect(trackEventMock).toHaveBeenCalledWith("tool_shared", {
      tool: PROPS.toolKey,
      channel: "copy_link",
    });
  });

  it("renders a mailto link with the title and url, and tracks the email share", () => {
    render(<ShareBar {...PROPS} />);

    const email = screen.getByRole("link", { name: /email me this/i });
    expect(email).toHaveAttribute(
      "href",
      `mailto:?subject=${encodeURIComponent(PROPS.title)}&body=${encodeURIComponent(
        `${PROPS.title}\n\n${PROPS.url}`,
      )}`,
    );

    fireEvent.click(email);
    expect(trackEventMock).toHaveBeenCalledWith("tool_shared", {
      tool: PROPS.toolKey,
      channel: "email",
    });
  });

  it("defaults the shared url to window.location.href when no url prop is given", () => {
    render(<ShareBar title={PROPS.title} toolKey={PROPS.toolKey} />);

    const whatsApp = screen.getByRole("link", { name: /share on whatsapp/i });
    expect(whatsApp.getAttribute("href")).toContain(
      encodeURIComponent(window.location.href),
    );
  });
});
