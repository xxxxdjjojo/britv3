/**
 * LeadDetailTimeline — activity feed rendering, empty state, contact info,
 * actor "You" attribution, and the add-note submit flow (success + guard).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { LeadDetailTimeline } from "@/components/dashboard/agent/leads/LeadDetailTimeline";
import { makeLead, makeActivity, LEAD_ACTIVITIES, TEAM_MEMBERS } from "./fixtures";

const USER_ID = "user-me-1";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("LeadDetailTimeline — render with data", () => {
  it("renders the contact name and contact methods", () => {
    render(
      <LeadDetailTimeline
        lead={makeLead()}
        activities={LEAD_ACTIVITIES}
        teamMembers={TEAM_MEMBERS}
        userId={USER_ID}
      />,
    );

    expect(screen.getByRole("heading", { name: "Jane Buyer" })).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(screen.getByText("07700900001")).toBeInTheDocument();
  });

  it("renders an email mailto link and a phone tel link", () => {
    render(
      <LeadDetailTimeline
        lead={makeLead()}
        activities={LEAD_ACTIVITIES}
        teamMembers={TEAM_MEMBERS}
        userId={USER_ID}
      />,
    );

    expect(screen.getByRole("link", { name: "jane@example.com" })).toHaveAttribute(
      "href",
      "mailto:jane@example.com",
    );
    expect(screen.getByRole("link", { name: "07700900001" })).toHaveAttribute(
      "href",
      "tel:07700900001",
    );
  });

  it("renders each activity's description in the timeline", () => {
    render(
      <LeadDetailTimeline
        lead={makeLead()}
        activities={LEAD_ACTIVITIES}
        teamMembers={TEAM_MEMBERS}
        userId={USER_ID}
      />,
    );

    expect(screen.getByText("Lead created from website enquiry")).toBeInTheDocument();
    expect(screen.getByText("Called the buyer, very keen")).toBeInTheDocument();
    expect(screen.getByText("Moved to Qualified")).toBeInTheDocument();
  });

  it("attributes activities by the current user as 'You'", () => {
    render(
      <LeadDetailTimeline
        lead={makeLead()}
        activities={[
          makeActivity({
            id: "act-mine",
            actor_id: USER_ID,
            description: "My note",
          }),
        ]}
        teamMembers={TEAM_MEMBERS}
        userId={USER_ID}
      />,
    );

    expect(screen.getByText(/^You/)).toBeInTheDocument();
  });

  it("renders the humanised current stage badge", () => {
    render(
      <LeadDetailTimeline
        lead={makeLead({ stage: "qualified" })}
        activities={LEAD_ACTIVITIES}
        teamMembers={TEAM_MEMBERS}
        userId={USER_ID}
      />,
    );

    expect(screen.getByText("Qualified")).toBeInTheDocument();
  });
});

describe("LeadDetailTimeline — empty state", () => {
  it("shows 'No activity yet' when there are no activities", () => {
    render(
      <LeadDetailTimeline
        lead={makeLead()}
        activities={[]}
        teamMembers={TEAM_MEMBERS}
        userId={USER_ID}
      />,
    );

    expect(screen.getByText(/no activity yet/i)).toBeInTheDocument();
  });

  it("omits the email/phone blocks when contact details are absent", () => {
    render(
      <LeadDetailTimeline
        lead={makeLead({ contact_email: null, contact_phone: null })}
        activities={[]}
        teamMembers={TEAM_MEMBERS}
        userId={USER_ID}
      />,
    );

    expect(screen.queryByText("Email")).not.toBeInTheDocument();
    expect(screen.queryByText("Phone")).not.toBeInTheDocument();
    // The "Send Email" action also depends on an email being present.
    expect(
      screen.queryByRole("link", { name: /send email/i }),
    ).not.toBeInTheDocument();
  });
});

describe("LeadDetailTimeline — add note", () => {
  it("disables the Add Note button while the textarea is empty", () => {
    render(
      <LeadDetailTimeline
        lead={makeLead()}
        activities={[]}
        teamMembers={TEAM_MEMBERS}
        userId={USER_ID}
      />,
    );

    expect(screen.getByRole("button", { name: /add note/i })).toBeDisabled();
  });

  it("POSTs the note and appends the returned activity to the timeline", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () =>
        makeActivity({
          id: "act-new",
          activity_type: "note_added",
          description: "Follow-up scheduled",
          actor_id: USER_ID,
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <LeadDetailTimeline
        lead={makeLead()}
        activities={[]}
        teamMembers={TEAM_MEMBERS}
        userId={USER_ID}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/add a note/i), {
      target: { value: "Follow-up scheduled" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add note/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/agent/leads/activities",
        expect.objectContaining({ method: "POST" }),
      );
    });
    expect(await screen.findByText("Follow-up scheduled")).toBeInTheDocument();
  });
});

describe("LeadDetailTimeline — pipeline selects", () => {
  it("shows the lead's current stage as the selected value in the Stage select", () => {
    render(
      <LeadDetailTimeline
        lead={makeLead({ stage: "viewing_booked" })}
        activities={[]}
        teamMembers={TEAM_MEMBERS}
        userId={USER_ID}
      />,
    );

    // The Stage select trigger renders the human label for the current stage.
    // (Distinct from the "Viewing Booked" pipeline column label which is not
    // present here, so this text uniquely identifies the select value.)
    expect(screen.getByText("Viewing Booked")).toBeInTheDocument();
  });

  // FINDING: base-ui <Select> renders NO native <select> element under
  // happy-dom (confirmed: document.querySelectorAll("select").length === 0).
  // The visible trigger is a button whose listbox opens via pointer/keyboard
  // interaction that happy-dom does not fully simulate, so we cannot
  // deterministically change the value to assert the PATCH /api/agent/leads
  // call from handleStageChange / handleAssignedToChange. Needs a real-browser
  // runner (Playwright) or extraction of the handler into a tested unit.
  it.todo("PATCHes /api/agent/leads when the Stage select value changes");
  it.todo("PATCHes /api/agent/leads when the Assigned-to select value changes");
});
