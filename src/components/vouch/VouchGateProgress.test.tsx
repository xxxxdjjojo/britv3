import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { VouchGateProgress, type VouchRequestSummary } from "./VouchGateProgress";

const requests: VouchRequestSummary[] = [
  {
    id: "peer-accepted",
    voucherKind: "peer",
    status: "accepted",
    requestedAt: "2026-07-01T10:00:00.000Z",
    expiresAt: "2026-08-01T10:00:00.000Z",
  },
  {
    id: "peer-pending",
    voucherKind: "peer",
    status: "pending",
    requestedAt: "2026-07-02T10:00:00.000Z",
    expiresAt: "2026-08-02T10:00:00.000Z",
  },
  {
    id: "client-expired",
    voucherKind: "client",
    status: "expired",
    requestedAt: "2026-05-01T10:00:00.000Z",
    expiresAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "client-revoked",
    voucherKind: "client",
    status: "revoked",
    requestedAt: "2026-06-01T10:00:00.000Z",
    expiresAt: "2026-07-01T10:00:00.000Z",
  },
];

describe("VouchGateProgress", () => {
  it("renders exactly three peer and three client slots with honest gate state", () => {
    render(
      <VouchGateProgress
        peerCount={1}
        clientCount={0}
        grandfathered={false}
        gateComplete={false}
        requests={requests}
      />,
    );

    expect(screen.getByRole("heading", { name: /build your trusted six/i })).toBeInTheDocument();
    expect(screen.getAllByTestId(/^peer-slot-/)).toHaveLength(3);
    expect(screen.getAllByTestId(/^client-slot-/)).toHaveLength(3);
    expect(screen.getByText("1 of 3 peers accepted")).toBeInTheDocument();
    expect(screen.getByText("0 of 3 clients accepted")).toBeInTheDocument();
    expect(screen.getByText("Accepted")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Expired")).toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    expect(screen.getAllByText("Invite someone")).toHaveLength(2);
  });

  it("unlocks a grandfathered provider without claiming they completed 3+3", () => {
    render(
      <VouchGateProgress
        peerCount={0}
        clientCount={0}
        grandfathered
        gateComplete
        requests={[]}
      />,
    );

    expect(screen.getByText(/access preserved/i)).toBeInTheDocument();
    expect(screen.queryByText(/trusted six complete/i)).not.toBeInTheDocument();
    expect(screen.getByText("0 of 3 peers accepted")).toBeInTheDocument();
  });

  it("opens a WhatsApp-first composer with correct share links and accessible tap targets", () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    render(
      <VouchGateProgress
        peerCount={0}
        clientCount={0}
        grandfathered={false}
        gateComplete={false}
        requests={[]}
        origin="https://truedeed.test"
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /invite a peer/i })[0]);
    fireEvent.change(screen.getByRole("textbox", { name: /email address/i }), {
      target: { value: "peer@example.test" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create invitation/i }));

    expect(screen.getByRole("link", { name: /share on whatsapp/i })).toHaveAttribute(
      "href",
      expect.stringMatching(/^https:\/\/wa\.me\/\?text=/),
    );
    expect(screen.getByRole("link", { name: /send by sms/i })).toHaveAttribute(
      "href",
      expect.stringMatching(/^sms:\?&body=/),
    );
    expect(screen.getByRole("link", { name: /send by email/i })).toHaveAttribute(
      "href",
      expect.stringMatching(/^mailto:\?/),
    );
    expect(screen.getByRole("button", { name: /copy invitation link/i })).toHaveClass("min-h-11");
    expect(open).not.toHaveBeenCalled();
  });
});
