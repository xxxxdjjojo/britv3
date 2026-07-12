import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReferenceTracker } from "./ReferenceTracker";
import type { ProviderReference } from "@/types/provider-dashboard";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ refresh: vi.fn(), push: vi.fn() })),
}));

function ref(overrides: Partial<ProviderReference>): ProviderReference {
  return {
    id: overrides.id ?? "r-1",
    provider_id: "prov-1",
    reference_type: "peer",
    referee_name: "Jane Smith",
    referee_email: "jane@example.com",
    referee_phone: null,
    relationship: null,
    status: "pending",
    reference_text: null,
    requested_at: "2026-07-01T00:00:00Z",
    submitted_at: null,
    verified_at: null,
    ...overrides,
  };
}

describe("ReferenceTracker", () => {
  it("counts only verified references toward the requirement", () => {
    const references: ProviderReference[] = [
      ref({ id: "a", status: "verified", referee_name: "A" }),
      ref({ id: "b", status: "submitted", referee_name: "B" }),
      ref({ id: "c", status: "sent", referee_name: "C" }),
    ];
    render(
      <ReferenceTracker
        references={references}
        referenceType="peer"
        requiredCount={3}
        recencyDays={90}
      />,
    );
    // 1 verified of 3 — 'submitted' must NOT be counted.
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText(/\/ 3 verified/)).toBeInTheDocument();
  });

  it("renders a distinct label for each status (no misleading fallback)", () => {
    const references: ProviderReference[] = [
      ref({ id: "a", status: "sent", referee_name: "Sent Person" }),
      ref({ id: "b", status: "submitted", referee_name: "Submitted Person" }),
      ref({ id: "c", status: "declined", referee_name: "Declined Person" }),
      ref({ id: "d", status: "flagged", referee_name: "Flagged Person" }),
    ];
    render(
      <ReferenceTracker
        references={references}
        referenceType="peer"
        requiredCount={3}
        recencyDays={90}
      />,
    );
    expect(screen.getByText("Invitation sent")).toBeInTheDocument();
    expect(screen.getByText("Awaiting review")).toBeInTheDocument();
    expect(screen.getByText("Declined")).toBeInTheDocument();
    expect(screen.getByText("Flagged")).toBeInTheDocument();
    // A submitted (non-verified) reference must not read as "Verified".
    expect(screen.queryByText("Verified")).not.toBeInTheDocument();
  });

  it("shows Resend + Cancel only for pending/sent references", () => {
    const references: ProviderReference[] = [
      ref({ id: "a", status: "sent", referee_name: "Active" }),
      ref({ id: "b", status: "verified", referee_name: "Done" }),
    ];
    render(
      <ReferenceTracker
        references={references}
        referenceType="peer"
        requiredCount={3}
        recencyDays={90}
      />,
    );
    // One actionable row -> exactly one Resend and one Cancel button.
    expect(screen.getAllByRole("button", { name: /resend/i })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /cancel/i })).toHaveLength(1);
  });
});
