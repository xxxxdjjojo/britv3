import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BriefingSubscribeForm } from "@/components/briefing/BriefingSubscribeForm";

const trackEventMock = vi.fn();
vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: (...args: unknown[]) => trackEventMock(...args),
}));

function mockFetchOnce(body: Record<string, unknown>, ok = true): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      json: () => Promise.resolve(body),
    }),
  );
}

async function submitForm(email = "agent@example.co.uk"): Promise<void> {
  const input = screen.getByLabelText("Email address");
  fireEvent.change(input, { target: { value: email } });
  fireEvent.submit(input.closest("form")!);
}

afterEach(() => {
  trackEventMock.mockReset();
  vi.unstubAllGlobals();
});

describe("BriefingSubscribeForm", () => {
  it("posts email, source and the agent_briefing audience to /api/newsletter", async () => {
    mockFetchOnce({ ok: true, requiresConfirmation: true });
    render(<BriefingSubscribeForm source="agent_briefing_landing" />);

    await submitForm();
    await screen.findByText(/check your inbox to confirm/i);

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/newsletter",
      expect.objectContaining({ method: "POST" }),
    );
    const requestBody = JSON.parse(
      String(fetchMock.mock.calls[0]?.[1]?.body),
    ) as Record<string, unknown>;
    expect(requestBody).toEqual({
      email: "agent@example.co.uk",
      source: "agent_briefing_landing",
      audience: "agent_briefing",
    });
  });

  it("shows the check-your-inbox state when confirmation is required", async () => {
    mockFetchOnce({ ok: true, requiresConfirmation: true });
    render(<BriefingSubscribeForm />);

    await submitForm();

    expect(
      await screen.findByText(/check your inbox to confirm/i),
    ).toBeInTheDocument();
  });

  it("fires the briefing_subscribed KPI event on successful submit", async () => {
    mockFetchOnce({ ok: true, requiresConfirmation: true });
    render(<BriefingSubscribeForm />);

    await submitForm();
    await screen.findByText(/check your inbox to confirm/i);

    expect(trackEventMock).toHaveBeenCalledWith("briefing_subscribed", {
      audience: "agent_briefing",
    });
  });

  it("does not fire the KPI event when the API rejects", async () => {
    mockFetchOnce({ error: "invalid_payload" }, false);
    render(<BriefingSubscribeForm />);

    await submitForm();

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
    expect(trackEventMock).not.toHaveBeenCalled();
  });

  it("renders the confirmed state when arriving from the confirm email", () => {
    render(<BriefingSubscribeForm initialConfirmed />);

    expect(screen.getByText(/you're confirmed/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /get the briefing/i }),
    ).not.toBeInTheDocument();
  });
});
