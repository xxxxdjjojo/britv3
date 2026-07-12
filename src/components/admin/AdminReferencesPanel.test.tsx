import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminReferencesPanel } from "./AdminReferencesPanel";
import type { AdminReferenceView } from "@/services/admin/verification-service";

function makeRef(
  overrides: Partial<AdminReferenceView> = {},
): AdminReferenceView {
  return {
    id: "ref-1",
    reference_type: "peer",
    referee_name: "Jane Referee",
    referee_email: "jane@example.com",
    relationship: "Former colleague",
    status: "submitted",
    reference_text: "They did excellent work on our project.",
    work_date: null,
    rating: null,
    requested_at: "2026-07-01T00:00:00Z",
    submitted_at: "2026-07-02T00:00:00Z",
    declined_reason: null,
    reviewed_at: null,
    reviewed_by: null,
    review_reason: null,
    ...overrides,
  };
}

describe("AdminReferencesPanel", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the referee full email and the statement", () => {
    render(<AdminReferencesPanel references={[makeRef()]} />);
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(
      screen.getByText("They did excellent work on our project."),
    ).toBeInTheDocument();
  });

  it("shows action buttons only for submitted / flagged rows", () => {
    render(
      <AdminReferencesPanel
        references={[
          makeRef({ id: "a", status: "submitted" }),
          makeRef({ id: "b", status: "verified", referee_name: "Verified Ref" }),
        ]}
      />,
    );
    // One reviewable row → exactly one Verify button.
    expect(
      screen.getAllByRole("button", { name: /Verify reference from/ }),
    ).toHaveLength(1);
  });

  it("renders each of the 9 statuses", () => {
    const statuses: AdminReferenceView["status"][] = [
      "pending",
      "sent",
      "submitted",
      "verified",
      "declined",
      "expired",
      "revoked",
      "rejected",
      "flagged",
    ];
    render(
      <AdminReferencesPanel
        references={statuses.map((s, i) =>
          makeRef({ id: `r-${i}`, status: s, referee_name: `Ref ${s}` }),
        )}
      />,
    );
    for (const s of statuses) {
      expect(screen.getByText(s)).toBeInTheDocument();
    }
  });

  it("reject dialog blocks empty reason, then posts with the reason", async () => {
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    render(<AdminReferencesPanel references={[makeRef()]} />);

    fireEvent.click(screen.getByRole("button", { name: /Reject reference from/ }));
    // Confirm button disabled until a reason is present → no fetch on click.
    const confirm = screen.getByRole("button", { name: /Confirm reject/ });
    expect(confirm).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText("Enter a reason…"), {
      target: { value: "Suspicious duplicate email" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Confirm reject/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/admin/references/ref-1/review");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      decision: "reject",
      reason: "Suspicious duplicate email",
    });
  });

  it("surfaces a 409 already-reviewed error", async () => {
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: "This reference was already reviewed." }),
    });

    render(<AdminReferencesPanel references={[makeRef()]} />);
    fireEvent.click(screen.getByRole("button", { name: /Verify reference from/ }));
    fireEvent.click(screen.getByRole("button", { name: /Confirm verify/ }));

    await waitFor(() =>
      expect(
        screen.getByText("This reference was already reviewed."),
      ).toBeInTheDocument(),
    );
  });
});
