/**
 * Tests for CandidateReviewQueue (TDD RED — component not yet implemented)
 *
 * Pins the contract of the admin invoice-candidate review queue
 * (Truedeed Phase 2, design spec §5). Props-driven client component.
 *
 *  1. Each card shows ONE-SCREEN evidence: applicant name, listing address,
 *     introduction occurred date, notification date, events count
 *     ("3 events"), the outcome's completion date + £-formatted agreed price,
 *     and the fee line "£249.00 + £49.80 VAT"
 *  2. Source badge — "Agent reported" (agent_report) / "PPD audit"
 *     (audit_match)
 *  3. Approve and Reject buttons per card
 *  4. Reject without a note shows /note is required/i and does NOT call
 *     onDecide; Reject with a note calls onDecide with decision 'rejected'
 *  5. Approve works without a note — onDecide with decision 'approved'
 *  6. Empty queue — /no candidates awaiting review/i
 *  7. on_hold_branch_query items show /awaiting branch reply/i and Approve is
 *     disabled until holdExpiresAt has passed
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { CandidateReviewQueue } from "@/components/admin/truedeed/CandidateReviewQueue";

// ---------------------------------------------------------------------------
// Fixtures (synthetic)
// ---------------------------------------------------------------------------

type CandidateReviewItem = {
  candidateId: string;
  source: "agent_report" | "audit_match";
  status: string;
  amountPence: number;
  vatPence: number;
  introduction: {
    applicantName: string;
    occurredAt: string;
    notifiedAt: string;
    rebuttalDeadline: string;
    listingAddress: string;
    eventsCount: number;
  };
  outcome: {
    outcome: string;
    completionDate: string;
    agreedPricePence: number;
  } | null;
  holdExpiresAt: string | null;
};

const AGENT_REPORTED_CANDIDATE: CandidateReviewItem = {
  candidateId: "candidate-1",
  source: "agent_report",
  status: "pending_review",
  amountPence: 24900,
  vatPence: 4980,
  introduction: {
    applicantName: "Amira Khan",
    occurredAt: "2026-05-02T09:30:00.000Z",
    notifiedAt: "2026-05-04T08:00:00.000Z",
    rebuttalDeadline: "2026-05-11T08:00:00.000Z",
    listingAddress: "12 Cedar Avenue, Manchester M20 3GH",
    eventsCount: 3,
  },
  outcome: {
    outcome: "completed",
    completionDate: "2026-06-01",
    agreedPricePence: 45_000_000,
  },
  holdExpiresAt: null,
};

const AUDIT_MATCHED_CANDIDATE: CandidateReviewItem = {
  candidateId: "candidate-2",
  source: "audit_match",
  status: "pending_review",
  amountPence: 24900,
  vatPence: 4980,
  introduction: {
    applicantName: "Tom Whitfield",
    occurredAt: "2026-04-14T14:00:00.000Z",
    notifiedAt: "2026-04-15T08:00:00.000Z",
    rebuttalDeadline: "2026-04-22T08:00:00.000Z",
    listingAddress: "8 Harbour Lane, Bristol BS1 4QF",
    eventsCount: 5,
  },
  outcome: {
    outcome: "completed",
    completionDate: "2026-05-29",
    agreedPricePence: 31_250_000,
  },
  holdExpiresAt: null,
};

const ON_HOLD_FUTURE: CandidateReviewItem = {
  ...AGENT_REPORTED_CANDIDATE,
  candidateId: "candidate-hold-future",
  status: "on_hold_branch_query",
  holdExpiresAt: "2099-01-01T00:00:00.000Z",
};

const ON_HOLD_PAST: CandidateReviewItem = {
  ...AGENT_REPORTED_CANDIDATE,
  candidateId: "candidate-hold-past",
  status: "on_hold_branch_query",
  holdExpiresAt: "2020-01-01T00:00:00.000Z",
};

const BOTH_CANDIDATES = [AGENT_REPORTED_CANDIDATE, AUDIT_MATCHED_CANDIDATE];

const onDecide = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CandidateReviewQueue", () => {
  it("shows one-screen evidence: applicant, listing, dates, events count, outcome and fee", () => {
    // Arrange / Act
    render(
      <CandidateReviewQueue
        items={[AGENT_REPORTED_CANDIDATE]}
        onDecide={onDecide}
      />,
    );

    // Assert — everything the §5 decision needs on a single card.
    const intro = AGENT_REPORTED_CANDIDATE.introduction;
    expect(screen.getByText(intro.applicantName)).toBeInTheDocument();
    expect(screen.getByText(intro.listingAddress)).toBeInTheDocument();

    // en-GB dates: occurred 2 May 2026, notified 4 May 2026, completion 1 Jun(e) 2026
    expect(screen.getByText(/2\s+may\s+2026/i)).toBeInTheDocument();
    expect(screen.getByText(/4\s+may\s+2026/i)).toBeInTheDocument();
    expect(screen.getByText(/1\s+jun\w*\s+2026/i)).toBeInTheDocument();

    expect(screen.getByText(/3 events/i)).toBeInTheDocument();

    // Agreed price 45_000_000p → £450,000; fee 24900p + 4980p VAT.
    expect(screen.getByText(/£450,000/)).toBeInTheDocument();
    expect(
      screen.getByText(/£249\.00\s*\+\s*£49\.80\s*VAT/i),
    ).toBeInTheDocument();
  });

  it("shows a source badge for agent-reported and PPD-audit candidates", () => {
    // Arrange / Act
    render(<CandidateReviewQueue items={BOTH_CANDIDATES} onDecide={onDecide} />);

    // Assert
    expect(screen.getByText(/agent reported/i)).toBeInTheDocument();
    expect(screen.getByText(/ppd audit/i)).toBeInTheDocument();
  });

  it("renders Approve and Reject buttons for each candidate", () => {
    // Arrange / Act
    render(<CandidateReviewQueue items={BOTH_CANDIDATES} onDecide={onDecide} />);

    // Assert
    expect(screen.getAllByRole("button", { name: /approve/i })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /reject/i })).toHaveLength(2);
  });

  it("shows a note-required error and does not call onDecide when Reject is clicked without a note", () => {
    // Arrange
    render(
      <CandidateReviewQueue
        items={[AGENT_REPORTED_CANDIDATE]}
        onDecide={onDecide}
      />,
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: /reject/i }));

    // Assert
    expect(screen.getByText(/note is required/i)).toBeInTheDocument();
    expect(onDecide).not.toHaveBeenCalled();
  });

  it("calls onDecide with decision 'rejected' and the note when Reject is clicked with a note", () => {
    // Arrange
    render(
      <CandidateReviewQueue
        items={[AGENT_REPORTED_CANDIDATE]}
        onDecide={onDecide}
      />,
    );
    fireEvent.change(screen.getByLabelText(/note/i), {
      target: { value: "PPD match is a different unit at the same postcode." },
    });

    // Act
    fireEvent.click(screen.getByRole("button", { name: /reject/i }));

    // Assert
    expect(onDecide).toHaveBeenCalledTimes(1);
    expect(onDecide).toHaveBeenCalledWith({
      candidateId: "candidate-1",
      decision: "rejected",
      note: "PPD match is a different unit at the same postcode.",
    });
  });

  it("calls onDecide with decision 'approved' and an empty note when Approve is clicked without a note", () => {
    // Arrange
    render(
      <CandidateReviewQueue
        items={[AGENT_REPORTED_CANDIDATE]}
        onDecide={onDecide}
      />,
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: /approve/i }));

    // Assert
    expect(onDecide).toHaveBeenCalledTimes(1);
    expect(onDecide).toHaveBeenCalledWith({
      candidateId: "candidate-1",
      decision: "approved",
      note: "",
    });
  });

  it("renders an empty state when there are no candidates", () => {
    // Arrange / Act
    render(<CandidateReviewQueue items={[]} onDecide={onDecide} />);

    // Assert
    expect(
      screen.getByText(/no candidates awaiting review/i),
    ).toBeInTheDocument();
  });

  it("shows /awaiting branch reply/i and disables Approve while the branch-query hold has not expired", () => {
    // Arrange / Act — holdExpiresAt in the far future
    render(<CandidateReviewQueue items={[ON_HOLD_FUTURE]} onDecide={onDecide} />);

    // Assert
    expect(screen.getByText(/awaiting branch reply/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /approve/i })).toBeDisabled();
  });

  it("enables Approve on an on-hold candidate once holdExpiresAt has passed", () => {
    // Arrange / Act — holdExpiresAt in the past
    render(<CandidateReviewQueue items={[ON_HOLD_PAST]} onDecide={onDecide} />);

    // Assert
    expect(screen.getByRole("button", { name: /approve/i })).toBeEnabled();
  });
});
