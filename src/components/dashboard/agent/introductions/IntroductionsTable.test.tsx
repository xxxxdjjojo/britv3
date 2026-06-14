/**
 * Tests for IntroductionsTable (TDD RED — component not yet implemented)
 *
 * Pins the contract of the agent introductions-ledger table (Truedeed Phase 1,
 * design spec §6). Props-driven client component — data fetched by parents.
 *
 *  1. Renders a row per introduction with applicant name, listing address,
 *     and humanised contact type ("Enquiry" / "Viewing request" / "Message")
 *  2. Status badge text renders per status (Active / Rebutted / Completed)
 *  3. rebuttalOpen=true — countdown/deadline element containing the formatted
 *     deadline date and an enabled "Dispute" button
 *  4. rebuttalOpen=false — dispute affordance absent or disabled, with
 *     explanatory copy matching /window closed/i
 *  5. Empty list — /no introductions/i
 *  6. Clicking a row calls onSelect with the introduction id
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { IntroductionsTable } from "@/components/dashboard/agent/introductions/IntroductionsTable";

// ---------------------------------------------------------------------------
// Fixtures (synthetic)
// ---------------------------------------------------------------------------

type IntroductionStatus =
  | "active"
  | "rebutted"
  | "cancelled_manifest_error"
  | "converted_sstc"
  | "converted_exchanged"
  | "converted_completed"
  | "expired";

type AgentIntroduction = {
  id: string;
  applicantName: string;
  listingAddress: string;
  contactType: "enquiry" | "viewing_request" | "message";
  occurredAt: string;
  status: IntroductionStatus;
  rebuttalDeadline: string | null;
  rebuttalOpen: boolean;
};

const INTRO_ACTIVE: AgentIntroduction = {
  id: "intro-active-1",
  applicantName: "Amira Khan",
  listingAddress: "12 Cedar Avenue, Manchester M20 3GH",
  contactType: "enquiry",
  occurredAt: "2026-06-12T09:30:00.000Z",
  status: "active",
  rebuttalDeadline: "2026-06-19T17:00:00.000Z",
  rebuttalOpen: true,
};

const INTRO_REBUTTED: AgentIntroduction = {
  id: "intro-rebutted-2",
  applicantName: "Tom Whitfield",
  listingAddress: "8 Harbour Lane, Bristol BS1 4QF",
  contactType: "viewing_request",
  occurredAt: "2026-05-20T14:00:00.000Z",
  status: "rebutted",
  rebuttalDeadline: "2026-05-28T17:00:00.000Z",
  rebuttalOpen: false,
};

const INTRO_COMPLETED: AgentIntroduction = {
  id: "intro-completed-3",
  applicantName: "Priya Patel",
  listingAddress: "44 Orchard Row, Leeds LS6 2AB",
  contactType: "message",
  occurredAt: "2026-01-05T11:15:00.000Z",
  status: "converted_completed",
  rebuttalDeadline: null,
  rebuttalOpen: false,
};

const ALL_INTRODUCTIONS = [INTRO_ACTIVE, INTRO_REBUTTED, INTRO_COMPLETED];

const onSelect = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("IntroductionsTable", () => {
  it("renders applicant name and listing address for every introduction", () => {
    // Arrange / Act
    render(
      <IntroductionsTable introductions={ALL_INTRODUCTIONS} onSelect={onSelect} />,
    );

    // Assert
    for (const intro of ALL_INTRODUCTIONS) {
      expect(screen.getByText(intro.applicantName)).toBeInTheDocument();
      expect(screen.getByText(intro.listingAddress)).toBeInTheDocument();
    }
  });

  it("humanises the contact type for each row", () => {
    // Arrange / Act
    render(
      <IntroductionsTable introductions={ALL_INTRODUCTIONS} onSelect={onSelect} />,
    );

    // Assert
    expect(screen.getByText("Enquiry")).toBeInTheDocument();
    expect(screen.getByText("Viewing request")).toBeInTheDocument();
    expect(screen.getByText("Message")).toBeInTheDocument();
  });

  it("renders a status badge with humanised status text per introduction", () => {
    // Arrange / Act
    render(
      <IntroductionsTable introductions={ALL_INTRODUCTIONS} onSelect={onSelect} />,
    );

    // Assert
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Rebutted")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("shows the formatted rebuttal deadline and an enabled Dispute button when the window is open", () => {
    // Arrange / Act
    render(
      <IntroductionsTable introductions={[INTRO_ACTIVE]} onSelect={onSelect} />,
    );

    // Assert — deadline 2026-06-19 formatted en-GB ("19 Jun 2026" / "19 June 2026")
    expect(screen.getByText(/19\s+jun\w*\s+2026/i)).toBeInTheDocument();

    const disputeButton = screen.getByRole("button", { name: /dispute/i });
    expect(disputeButton).toBeEnabled();
  });

  it("removes or disables the dispute affordance and explains the closed window when rebuttalOpen is false", () => {
    // Arrange / Act
    render(
      <IntroductionsTable introductions={[INTRO_REBUTTED]} onSelect={onSelect} />,
    );

    // Assert — affordance is either absent or disabled
    const disputeButton = screen.queryByRole("button", { name: /dispute/i });
    if (disputeButton !== null) {
      expect(disputeButton).toBeDisabled();
    }
    expect(screen.getByText(/window closed/i)).toBeInTheDocument();
  });

  it("renders an empty state when there are no introductions", () => {
    // Arrange / Act
    render(<IntroductionsTable introductions={[]} onSelect={onSelect} />);

    // Assert
    expect(screen.getByText(/no introductions/i)).toBeInTheDocument();
  });

  it("calls onSelect with the introduction id when a row is clicked", () => {
    // Arrange
    render(
      <IntroductionsTable introductions={ALL_INTRODUCTIONS} onSelect={onSelect} />,
    );

    // Act — click inside the row via the applicant cell
    fireEvent.click(screen.getByText(INTRO_COMPLETED.applicantName));

    // Assert
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(INTRO_COMPLETED.id);
  });
});
