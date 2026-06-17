import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import type { ProviderLead } from "@/services/provider/provider-job-service";
import { JobLeadCard } from "@/components/dashboard/provider/JobLeadCard";

// ---------------------------------------------------------------------------
// Mocks — JobLeadCard calls acceptLead/declineLead from the service module and
// createClient from the supabase client lib. Both are mocked so the component
// logic (loading, success -> onRemove, error display) is exercised in isolation.
// ---------------------------------------------------------------------------

const mockAcceptLead = vi.fn();
const mockDeclineLead = vi.fn();

vi.mock("@/services/provider/provider-job-service", () => ({
  acceptLead: (...args: unknown[]) => mockAcceptLead(...args),
  declineLead: (...args: unknown[]) => mockDeclineLead(...args),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({}),
}));

function makeLead(overrides: Partial<ProviderLead> = {}): ProviderLead {
  return {
    id: "lead-1",
    clientName: "Jane Smith",
    serviceCategory: "Plumbing",
    description: "Leaking kitchen tap needs replacing.",
    location: "Bristol",
    status: "new",
    budgetMinPence: 10_000,
    budgetMaxPence: 25_000,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 48 * 3_600_000).toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("JobLeadCard — render with data", () => {
  it("renders category, client, description, location and budget", () => {
    render(<JobLeadCard lead={makeLead()} providerId="prov-1" onRemove={vi.fn()} />);

    expect(screen.getByText("Plumbing")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("Leaking kitchen tap needs replacing.")).toBeInTheDocument();
    expect(screen.getByText("Bristol")).toBeInTheDocument();
    expect(screen.getByText("£100–£250")).toBeInTheDocument();
  });

  it("shows 'Budget TBC' when both budget bounds are null", () => {
    render(
      <JobLeadCard
        lead={makeLead({ budgetMinPence: null, budgetMaxPence: null })}
        providerId="prov-1"
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText("Budget TBC")).toBeInTheDocument();
  });

  it("shows 'Location TBC' when location is empty", () => {
    render(
      <JobLeadCard
        lead={makeLead({ location: "" })}
        providerId="prov-1"
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText("Location TBC")).toBeInTheDocument();
  });

  it("renders Accept, Decline and Message actions", () => {
    render(<JobLeadCard lead={makeLead()} providerId="prov-1" onRemove={vi.fn()} />);

    expect(screen.getByRole("button", { name: /Accept Lead/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Decline/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Message client")).toBeInTheDocument();
  });
});

describe("JobLeadCard — accept flow", () => {
  it("calls acceptLead and onRemove on success", async () => {
    mockAcceptLead.mockResolvedValue({ bookingId: "booking-1" });
    const onRemove = vi.fn();

    render(<JobLeadCard lead={makeLead()} providerId="prov-1" onRemove={onRemove} />);

    fireEvent.click(screen.getByRole("button", { name: /Accept Lead/i }));

    await waitFor(() => expect(onRemove).toHaveBeenCalledWith("lead-1"));
    expect(mockAcceptLead).toHaveBeenCalledWith("lead-1", "prov-1", expect.anything());
  });

  it("shows the error message and does NOT remove on accept failure", async () => {
    mockAcceptLead.mockRejectedValue(new Error("Lead already taken"));
    const onRemove = vi.fn();

    render(<JobLeadCard lead={makeLead()} providerId="prov-1" onRemove={onRemove} />);

    fireEvent.click(screen.getByRole("button", { name: /Accept Lead/i }));

    expect(await screen.findByText("Lead already taken")).toBeInTheDocument();
    expect(onRemove).not.toHaveBeenCalled();
  });
});

describe("JobLeadCard — decline flow", () => {
  it("opens the decline dialog with a reason selector", () => {
    render(<JobLeadCard lead={makeLead()} providerId="prov-1" onRemove={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /^Decline$/i }));

    expect(screen.getByText("Decline lead?")).toBeInTheDocument();
    // Default reason is selected
    expect(screen.getByRole("combobox")).toHaveValue("Not available");
  });

  it("calls declineLead with the chosen reason and removes on confirm", async () => {
    mockDeclineLead.mockResolvedValue(undefined);
    const onRemove = vi.fn();

    render(<JobLeadCard lead={makeLead()} providerId="prov-1" onRemove={onRemove} />);

    fireEvent.click(screen.getByRole("button", { name: /^Decline$/i }));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Budget too low" } });
    // The confirm button lives inside the dialog (next to Cancel)
    const dialog = screen.getByText("Decline lead?").closest("div") as HTMLElement;
    const confirmBtn = within(dialog).getByRole("button", { name: "Decline" });
    fireEvent.click(confirmBtn);

    await waitFor(() => expect(onRemove).toHaveBeenCalledWith("lead-1"));
    expect(mockDeclineLead).toHaveBeenCalledWith(
      "lead-1",
      "prov-1",
      "Budget too low",
      expect.anything(),
    );
  });

  it("cancelling the dialog closes it without calling declineLead", async () => {
    render(<JobLeadCard lead={makeLead()} providerId="prov-1" onRemove={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /^Decline$/i }));
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    await waitFor(() => expect(screen.queryByText("Decline lead?")).not.toBeInTheDocument());
    expect(mockDeclineLead).not.toHaveBeenCalled();
  });

  it("shows an error and closes the dialog on decline failure", async () => {
    mockDeclineLead.mockRejectedValue(new Error("Network down"));

    render(<JobLeadCard lead={makeLead()} providerId="prov-1" onRemove={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /^Decline$/i }));
    const dialog = screen.getByText("Decline lead?").closest("div") as HTMLElement;
    fireEvent.click(within(dialog).getByRole("button", { name: "Decline" }));

    expect(await screen.findByText("Network down")).toBeInTheDocument();
    expect(screen.queryByText("Decline lead?")).not.toBeInTheDocument();
  });
});
