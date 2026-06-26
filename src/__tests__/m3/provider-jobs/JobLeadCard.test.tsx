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

  it("renders Accept, Decline and Message actions (hero variant)", () => {
    // The redesign splits the card into a featured "hero" layout (explicit
    // Accept / Decline / Message buttons) and a compact "grid" layout (Accept +
    // a More-options menu that opens the decline dialog). The labelled Decline
    // and Message actions live on the hero variant.
    render(
      <JobLeadCard
        lead={makeLead()}
        providerId="prov-1"
        onRemove={vi.fn()}
        variant="hero"
      />,
    );

    expect(screen.getByRole("button", { name: /Accept Lead/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Decline/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Message client")).toBeInTheDocument();
  });

  it("renders Accept and a More-options menu in the default grid variant", () => {
    render(<JobLeadCard lead={makeLead()} providerId="prov-1" onRemove={vi.fn()} />);

    expect(screen.getByRole("button", { name: /Accept Lead/i })).toBeInTheDocument();
    // The compact grid card replaces the labelled Decline/Message buttons with
    // a single More-options control that opens the decline dialog.
    expect(screen.getByLabelText("More options")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Decline$/i }),
    ).not.toBeInTheDocument();
  });
});

describe("JobLeadCard — quote action", () => {
  it("hero 'Send Quote' links to the builder pre-filled with the lead id", () => {
    render(
      <JobLeadCard
        lead={makeLead({ id: "lead-42" })}
        providerId="prov-1"
        onRemove={vi.fn()}
        variant="hero"
      />,
    );

    expect(
      screen.getByRole("link", { name: /send quote/i }),
    ).toHaveAttribute(
      "href",
      "/dashboard/provider/quotes/builder?request_id=lead-42",
    );
  });

  it("grid 'Quote' links to the builder pre-filled with the lead id", () => {
    render(
      <JobLeadCard
        lead={makeLead({ id: "lead-42" })}
        providerId="prov-1"
        onRemove={vi.fn()}
        variant="grid"
      />,
    );

    expect(screen.getByRole("link", { name: /^quote$/i })).toHaveAttribute(
      "href",
      "/dashboard/provider/quotes/builder?request_id=lead-42",
    );
  });

  it("hero 'Message' is a real inbox link, not a dead button", () => {
    render(
      <JobLeadCard
        lead={makeLead()}
        providerId="prov-1"
        onRemove={vi.fn()}
        variant="hero"
      />,
    );

    expect(
      screen.getByRole("link", { name: /message client/i }),
    ).toHaveAttribute("href", "/inbox");
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

    // The grid card opens the decline dialog via the More-options control.
    fireEvent.click(screen.getByLabelText("More options"));

    expect(screen.getByText("Decline lead?")).toBeInTheDocument();
    // Default reason is selected
    expect(screen.getByRole("combobox")).toHaveValue("Not available");
  });

  it("calls declineLead with the chosen reason and removes on confirm", async () => {
    mockDeclineLead.mockResolvedValue(undefined);
    const onRemove = vi.fn();

    render(<JobLeadCard lead={makeLead()} providerId="prov-1" onRemove={onRemove} />);

    fireEvent.click(screen.getByLabelText("More options"));
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

    fireEvent.click(screen.getByLabelText("More options"));
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    await waitFor(() => expect(screen.queryByText("Decline lead?")).not.toBeInTheDocument());
    expect(mockDeclineLead).not.toHaveBeenCalled();
  });

  it("shows an error and closes the dialog on decline failure", async () => {
    mockDeclineLead.mockRejectedValue(new Error("Network down"));

    render(<JobLeadCard lead={makeLead()} providerId="prov-1" onRemove={vi.fn()} />);

    fireEvent.click(screen.getByLabelText("More options"));
    const dialog = screen.getByText("Decline lead?").closest("div") as HTMLElement;
    fireEvent.click(within(dialog).getByRole("button", { name: "Decline" }));

    expect(await screen.findByText("Network down")).toBeInTheDocument();
    expect(screen.queryByText("Decline lead?")).not.toBeInTheDocument();
  });
});
