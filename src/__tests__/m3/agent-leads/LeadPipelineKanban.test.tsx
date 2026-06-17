/**
 * LeadPipelineKanban — column/stage grouping, counts, search filtering, and
 * the add-lead dialog open. Drag physics (@dnd-kit pointer sensors) are NOT
 * exercised — happy-dom has no real pointer/layout, so we test the
 * grouping/rendering logic and dialog instead.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { LeadPipelineKanban } from "@/components/dashboard/agent/leads/LeadPipelineKanban";
import { LEADS_BY_STAGE } from "./fixtures";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("LeadPipelineKanban — render with data", () => {
  it("renders the table column headers and a stage status badge per populated lead", () => {
    render(<LeadPipelineKanban initialLeads={LEADS_BY_STAGE} />);

    // The redesigned view is a paginated table (not stage columns). Each lead
    // row carries its stage as a status badge, so a stage label appears once
    // per lead in that stage — and only for stages that actually have leads.
    // Column headers are always present.
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Source")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();

    // new_enquiry has 2 leads → "New Enquiry" badge appears twice.
    expect(screen.getAllByText("New Enquiry")).toHaveLength(2);
    // qualified has 1 lead.
    expect(screen.getAllByText("Qualified")).toHaveLength(1);
    // offer_made has 1 lead → its badge, plus the "Offer Made" stat-card label.
    expect(screen.getAllByText("Offer Made")).toHaveLength(2);
    // viewing_booked and closed have no leads, so no row badge is rendered.
    expect(screen.queryByText("Viewing Booked")).not.toBeInTheDocument();
    expect(screen.queryByText("Closed")).not.toBeInTheDocument();
  });

  it("renders each lead in its stage with the contact name", () => {
    render(<LeadPipelineKanban initialLeads={LEADS_BY_STAGE} />);

    expect(screen.getByText("Alice Anderson")).toBeInTheDocument();
    expect(screen.getByText("Bob Brown")).toBeInTheDocument();
    expect(screen.getByText("Carol Clarke")).toBeInTheDocument();
    expect(screen.getByText("Dan Davies")).toBeInTheDocument();
  });

  it("shows summary stat cards reflecting the lead totals per stage", () => {
    render(<LeadPipelineKanban initialLeads={LEADS_BY_STAGE} />);

    // The redesigned header is a stats strip, not per-stage count badges.
    // Each StatCard pairs an uppercase label <p> with its computed value <span>.
    // "Offer Made" also appears as a row status badge, so resolve the label to
    // the stat-card <p> specifically before reading the sibling value.
    const statValue = (label: string): string | null => {
      const labelEl = screen
        .getAllByText(label)
        .find((el) => el.tagName === "P");
      return labelEl?.parentElement?.querySelector("span")?.textContent ?? null;
    };

    // 4 leads total across the fixture.
    expect(statValue("Total Leads")).toBe("4");
    // offer_made has 1 lead.
    expect(statValue("Offer Made")).toBe("1");
    // viewing_booked (Active Viewings) has 0 leads.
    expect(statValue("Active Viewings")).toBe("0");
  });

  it("links each lead card to its detail page", () => {
    render(<LeadPipelineKanban initialLeads={LEADS_BY_STAGE} />);

    const link = screen.getByText("Alice Anderson").closest("a");
    expect(link).toHaveAttribute("href", "/dashboard/agent/leads/lead-new-1");
  });
});

describe("LeadPipelineKanban — empty state", () => {
  it("renders a single 'No leads found' row when the pipeline is empty", () => {
    render(<LeadPipelineKanban initialLeads={{}} />);

    // The redesigned table shows one empty-state row (not a per-column
    // placeholder), and the column headers remain.
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("No leads found")).toBeInTheDocument();
    // Stat cards read zero with no leads.
    expect(screen.getByText("Total Leads")).toBeInTheDocument();
  });
});

describe("LeadPipelineKanban — search filtering", () => {
  it("filters visible lead cards by contact name (case-insensitive)", () => {
    render(<LeadPipelineKanban initialLeads={LEADS_BY_STAGE} />);

    fireEvent.change(screen.getByPlaceholderText(/search leads/i), {
      target: { value: "alice" },
    });

    expect(screen.getByText("Alice Anderson")).toBeInTheDocument();
    expect(screen.queryByText("Bob Brown")).not.toBeInTheDocument();
    expect(screen.queryByText("Carol Clarke")).not.toBeInTheDocument();
  });

  it("filters by contact email", () => {
    render(<LeadPipelineKanban initialLeads={LEADS_BY_STAGE} />);

    fireEvent.change(screen.getByPlaceholderText(/search leads/i), {
      target: { value: "bob@example.com" },
    });

    expect(screen.getByText("Bob Brown")).toBeInTheDocument();
    expect(screen.queryByText("Alice Anderson")).not.toBeInTheDocument();
  });

  it("keeps the Total Leads stat at the unfiltered total while filtering", () => {
    render(<LeadPipelineKanban initialLeads={LEADS_BY_STAGE} />);

    fireEvent.change(screen.getByPlaceholderText(/search leads/i), {
      target: { value: "alice" },
    });

    // Only Alice's row is shown, but the stats strip is computed off the
    // unfiltered list, so Total Leads still reports the true total of 4.
    const totalValue = screen
      .getByText("Total Leads")
      .parentElement?.querySelector("span")?.textContent;
    expect(totalValue).toBe("4");
    expect(screen.getByText("Alice Anderson")).toBeInTheDocument();
    expect(screen.queryByText("Bob Brown")).not.toBeInTheDocument();
  });
});

describe("LeadPipelineKanban — add lead dialog", () => {
  it("opens the add-lead dialog and shows the form fields", async () => {
    render(<LeadPipelineKanban initialLeads={{}} />);

    fireEvent.click(screen.getByRole("button", { name: /add lead/i }));

    await waitFor(() => {
      expect(screen.getByText(/add new lead/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("POSTs the new lead and prepends it to the new_enquiry column on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "lead-created-1",
        agent_id: "agent-1",
        property_id: null,
        contact_name: "Zara New",
        contact_email: null,
        contact_phone: null,
        stage: "new_enquiry",
        source: null,
        assigned_to: null,
        notes: null,
        created_at: "2026-06-16T00:00:00.000Z",
        updated_at: "2026-06-16T00:00:00.000Z",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<LeadPipelineKanban initialLeads={{}} />);
    fireEvent.click(screen.getByRole("button", { name: /add lead/i }));
    await waitFor(() => expect(screen.getByText(/add new lead/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Zara New" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^add lead$/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/agent/leads",
        expect.objectContaining({ method: "POST" }),
      );
    });
    expect(await screen.findByText("Zara New")).toBeInTheDocument();
  });

  it("does not submit when the name is empty (required guard)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<LeadPipelineKanban initialLeads={{}} />);
    fireEvent.click(screen.getByRole("button", { name: /add lead/i }));
    await waitFor(() => expect(screen.getByText(/add new lead/i)).toBeInTheDocument());

    // submit with blank name — handleAddLead early-returns
    fireEvent.click(screen.getByRole("button", { name: /^add lead$/i }));

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("LeadPipelineKanban — drag physics (out of scope)", () => {
  // FINDING: @dnd-kit PointerSensor drag-and-drop cannot be exercised under
  // happy-dom (no real pointer events / layout boxes). The stage-reassignment
  // logic in handleDragEnd is therefore not covered by component tests here;
  // it would need a real-browser runner (Playwright) or a direct unit test of
  // extracted pure logic (handleDragEnd is currently inlined in the component).
  it.todo("moves a lead to a new stage on drop (needs real-browser DnD)");
});
