import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  canTransitionTo,
  getValidNextStatuses,
} from "@/services/landlord/maintenance-service";
import { ProviderAssignment } from "@/components/landlord/ProviderAssignment";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

/**
 * Provider assignment tests -- validates that the state machine supports
 * the assignment flow and that marketplace link is correct.
 */

describe("Provider assignment state machine", () => {
  it("allows transition from acknowledged to assigned", () => {
    expect(canTransitionTo("acknowledged", "assigned")).toBe(true);
  });

  it("does not allow direct assignment from new status", () => {
    expect(canTransitionTo("new", "assigned")).toBe(false);
  });

  it("does not allow assignment from in_progress", () => {
    expect(canTransitionTo("in_progress", "assigned")).toBe(false);
  });

  it("includes assigned in valid next statuses from acknowledged", () => {
    const valid = getValidNextStatuses("acknowledged");
    expect(valid).toContain("assigned");
  });

  it("allows transition from assigned to in_progress", () => {
    expect(canTransitionTo("assigned", "in_progress")).toBe(true);
  });
});

describe("ProviderAssignment directory link", () => {
  // The "Find Provider" button must point at a LIVE route. /marketplace/search
  // does not exist (only /marketplace and /marketplace/[slug]), and "maintenance"
  // is not a valid service_category. The trades directory at /services/tradespeople
  // is the correct live destination.
  function findProviderLink(): HTMLAnchorElement {
    render(
      <ProviderAssignment
        requestId="req-1"
        currentProviderId={null}
        currentProviderName={null}
      />,
    );
    return screen.getByRole("link", {
      name: /find provider/i,
    }) as HTMLAnchorElement;
  }

  it("targets the live tradespeople directory route", () => {
    expect(findProviderLink()).toHaveAttribute("href", "/services/tradespeople");
  });

  it("does not point at the dead /marketplace/search route", () => {
    expect(findProviderLink().getAttribute("href")).not.toContain(
      "/marketplace/search",
    );
  });
});
