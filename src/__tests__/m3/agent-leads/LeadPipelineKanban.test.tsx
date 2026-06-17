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
  it("renders all five pipeline stage columns with their labels", () => {
    render(<LeadPipelineKanban initialLeads={LEADS_BY_STAGE} />);

    expect(screen.getByText("New Enquiry")).toBeInTheDocument();
    expect(screen.getByText("Qualified")).toBeInTheDocument();
    expect(screen.getByText("Viewing Booked")).toBeInTheDocument();
    expect(screen.getByText("Offer Made")).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });

  it("renders each lead in its stage with the contact name", () => {
    render(<LeadPipelineKanban initialLeads={LEADS_BY_STAGE} />);

    expect(screen.getByText("Alice Anderson")).toBeInTheDocument();
    expect(screen.getByText("Bob Brown")).toBeInTheDocument();
    expect(screen.getByText("Carol Clarke")).toBeInTheDocument();
    expect(screen.getByText("Dan Davies")).toBeInTheDocument();
  });

  it("shows a per-stage count badge reflecting the number of leads in that stage", () => {
    render(<LeadPipelineKanban initialLeads={LEADS_BY_STAGE} />);

    // new_enquiry has 2, qualified 1, viewing_booked 0, offer_made 1, closed 0
    expect(screen.getByText("2")).toBeInTheDocument();
    // two stages have count 1 — assert both present
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(2);
    // two stages have count 0
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(2);
  });

  it("links each lead card to its detail page", () => {
    render(<LeadPipelineKanban initialLeads={LEADS_BY_STAGE} />);

    const link = screen.getByText("Alice Anderson").closest("a");
    expect(link).toHaveAttribute("href", "/dashboard/agent/leads/lead-new-1");
  });
});

describe("LeadPipelineKanban — empty state", () => {
  it("renders all columns with 'No leads' when the pipeline is empty", () => {
    render(<LeadPipelineKanban initialLeads={{}} />);

    expect(screen.getByText("New Enquiry")).toBeInTheDocument();
    // every one of the five columns shows the empty placeholder
    expect(screen.getAllByText("No leads")).toHaveLength(5);
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

  it("keeps the stage count badge at the unfiltered total while filtering", () => {
    render(<LeadPipelineKanban initialLeads={LEADS_BY_STAGE} />);

    fireEvent.change(screen.getByPlaceholderText(/search leads/i), {
      target: { value: "alice" },
    });

    // new_enquiry column still reports its true total of 2 even though only
    // one card is shown (totalCount is computed off the unfiltered list).
    expect(screen.getByText("2")).toBeInTheDocument();
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
