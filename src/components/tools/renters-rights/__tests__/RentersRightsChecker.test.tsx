import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const { trackEventMock } = vi.hoisted(() => ({ trackEventMock: vi.fn() }));

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: trackEventMock,
}));

import { RentersRightsChecker } from "../RentersRightsChecker";
import { RENTERS_RIGHTS_TREES } from "@/content/renters-rights";

describe("RentersRightsChecker", () => {
  beforeEach(() => {
    trackEventMock.mockClear();
  });

  it("starts with the role picker and fires tool_started on role pick", () => {
    render(<RentersRightsChecker />);

    expect(screen.getByRole("heading", { name: /who are you checking for/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /i'm a tenant/i }));

    expect(trackEventMock).toHaveBeenCalledWith("tool_started", {
      tool: "renters_rights_checker",
    });
    // First tenant question is on screen.
    const start = RENTERS_RIGHTS_TREES.tenant.nodes.find(
      (n) => n.id === RENTERS_RIGHTS_TREES.tenant.start,
    );
    expect(start?.kind).toBe("question");
    if (start?.kind === "question") {
      expect(screen.getByRole("heading", { name: start.question })).toBeInTheDocument();
    }
  });

  it("walks tenant answers to an outcome, renders citations and fires tool_completed", () => {
    render(<RentersRightsChecker />);

    fireEvent.click(screen.getByRole("button", { name: /i'm a tenant/i }));
    fireEvent.click(screen.getByRole("button", { name: /before 1 may 2026/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /yes — it was served on or after 1 may 2026/i }),
    );

    // Outcome screen for out_s21_post.
    expect(
      screen.getByRole("heading", {
        name: /a section 21 notice served on or after 1 may 2026 is not valid/i,
      }),
    ).toBeInTheDocument();
    expect(trackEventMock).toHaveBeenCalledWith("tool_completed", {
      tool: "renters_rights_checker",
      role: "tenant",
      outcome: "out_s21_post",
    });

    // Every citation renders as "instrument, section" linking its https url.
    const outcome = RENTERS_RIGHTS_TREES.tenant.nodes.find((n) => n.id === "out_s21_post");
    expect(outcome?.kind).toBe("outcome");
    if (outcome?.kind !== "outcome") return;
    expect(screen.getByText(/why: cited grounds/i)).toBeInTheDocument();
    for (const citation of outcome.citations) {
      const link = screen.getByRole("link", {
        name: `${citation.instrument}, ${citation.section}`,
      });
      expect(link).toHaveAttribute("href", citation.url);
      expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    }

    // Non-agent CTA points at the blog newsletter, plus share + restart affordances.
    expect(screen.getByRole("link", { name: /subscribe on the blog/i })).toHaveAttribute(
      "href",
      "/blog",
    );
    expect(screen.getByRole("link", { name: /share on whatsapp/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start again/i })).toBeInTheDocument();
  });

  it("letting agents get the /agent-briefing deadline-reminders CTA", () => {
    render(<RentersRightsChecker />);

    fireEvent.click(screen.getByRole("button", { name: /i'm a letting agent/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /managed book — tenancies that began before/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^yes$/i }));

    expect(
      screen.getByRole("heading", { name: /audit those files now/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /get deadline reminders/i }),
    ).toHaveAttribute("href", "/agent-briefing");
  });

  it("back steps to the previous question, and back from the first question returns to roles", () => {
    render(<RentersRightsChecker />);

    fireEvent.click(screen.getByRole("button", { name: /i'm a tenant/i }));
    fireEvent.click(screen.getByRole("button", { name: /before 1 may 2026/i }));
    expect(
      screen.getByRole("heading", { name: /section 21 .* eviction notice/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(
      screen.getByRole("heading", { name: /when did your current tenancy start/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(
      screen.getByRole("heading", { name: /who are you checking for/i }),
    ).toBeInTheDocument();
  });

  it("start again resets to the role picker", () => {
    render(<RentersRightsChecker />);

    fireEvent.click(screen.getByRole("button", { name: /i'm a tenant/i }));
    fireEvent.click(screen.getByRole("button", { name: /on or after 1 may 2026/i }));
    fireEvent.click(screen.getByRole("button", { name: /^yes$/i }));
    expect(screen.getByText(/your result/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /start again/i }));
    expect(
      screen.getByRole("heading", { name: /who are you checking for/i }),
    ).toBeInTheDocument();
  });
});
