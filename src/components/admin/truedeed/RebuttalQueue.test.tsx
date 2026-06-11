/**
 * Tests for RebuttalQueue (TDD RED — component not yet implemented)
 *
 * Pins the contract of the admin pending-rebuttal moderation queue
 * (Truedeed Phase 1, design spec §6). Props-driven client component.
 *
 *  1. Renders each pending rebuttal with introduction facts and both dates
 *     side by side: claimed evidence date vs our occurred-at date
 *  2. Evidence links open in a new tab with rel="noopener noreferrer"
 *  3. Uphold and Reject buttons render per item
 *  4. Deciding without a reason shows /reason is required/i and does NOT
 *     call onDecide
 *  5. With a reason filled, onDecide is called with decision
 *     'upheld' / 'rejected' and the reason
 *  6. Empty queue — /no pending rebuttals/i
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { RebuttalQueue } from "@/components/admin/truedeed/RebuttalQueue";

// ---------------------------------------------------------------------------
// Fixtures (synthetic)
// ---------------------------------------------------------------------------

type PendingRebuttal = {
  rebuttalId: string;
  introduction: {
    applicantName: string;
    listingAddress: string;
    occurredAt: string;
  };
  evidenceDatedAt: string;
  evidenceUrls: string[];
  submittedAt: string;
  branchName: string;
};

const REBUTTAL_ONE: PendingRebuttal = {
  rebuttalId: "rebuttal-1",
  introduction: {
    applicantName: "Amira Khan",
    listingAddress: "12 Cedar Avenue, Manchester M20 3GH",
    occurredAt: "2026-06-10T09:30:00.000Z",
  },
  evidenceDatedAt: "2026-06-05",
  evidenceUrls: [
    "https://storage.example.com/evidence/rebuttal-1/email-thread.pdf?token=abc",
    "https://storage.example.com/evidence/rebuttal-1/call-log.png?token=def",
  ],
  submittedAt: "2026-06-11T10:00:00.000Z",
  branchName: "Hartley & Co — Didsbury",
};

const REBUTTAL_TWO: PendingRebuttal = {
  rebuttalId: "rebuttal-2",
  introduction: {
    applicantName: "Tom Whitfield",
    listingAddress: "8 Harbour Lane, Bristol BS1 4QF",
    occurredAt: "2026-05-22T14:00:00.000Z",
  },
  evidenceDatedAt: "2026-05-18",
  evidenceUrls: ["https://storage.example.com/evidence/rebuttal-2/viewing-note.pdf?token=ghi"],
  submittedAt: "2026-05-26T16:45:00.000Z",
  branchName: "Hartley & Co — Clifton",
};

const ALL_ITEMS = [REBUTTAL_ONE, REBUTTAL_TWO];

const ALL_EVIDENCE_URLS = ALL_ITEMS.flatMap((item) => item.evidenceUrls);

const onDecide = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RebuttalQueue", () => {
  it("renders introduction facts and branch name for each pending rebuttal", () => {
    // Arrange / Act
    render(<RebuttalQueue items={ALL_ITEMS} onDecide={onDecide} />);

    // Assert
    for (const item of ALL_ITEMS) {
      expect(screen.getByText(item.introduction.applicantName)).toBeInTheDocument();
      expect(screen.getByText(item.introduction.listingAddress)).toBeInTheDocument();
      expect(screen.getByText(item.branchName)).toBeInTheDocument();
    }
  });

  it("shows the claimed evidence date and our occurred-at date side by side", () => {
    // Arrange / Act
    render(<RebuttalQueue items={[REBUTTAL_ONE]} onDecide={onDecide} />);

    // Assert — en-GB formatting: claimed 5 Jun(e) 2026 vs occurred 10 Jun(e) 2026
    expect(screen.getByText(/5\s+jun\w*\s+2026/i)).toBeInTheDocument();
    expect(screen.getByText(/10\s+jun\w*\s+2026/i)).toBeInTheDocument();
  });

  it("renders every evidence link with target _blank and noopener noreferrer rel", () => {
    // Arrange / Act
    render(<RebuttalQueue items={ALL_ITEMS} onDecide={onDecide} />);

    // Assert
    const links = screen.getAllByRole("link");
    const evidenceLinks = links.filter((link) =>
      ALL_EVIDENCE_URLS.includes(link.getAttribute("href") ?? ""),
    );

    expect(evidenceLinks).toHaveLength(ALL_EVIDENCE_URLS.length);

    for (const link of evidenceLinks) {
      expect(link.getAttribute("target")).toBe("_blank");
      const rel = link.getAttribute("rel") ?? "";
      expect(rel).toContain("noopener");
      expect(rel).toContain("noreferrer");
    }
  });

  it("renders Uphold and Reject buttons for each item", () => {
    // Arrange / Act
    render(<RebuttalQueue items={ALL_ITEMS} onDecide={onDecide} />);

    // Assert
    expect(screen.getAllByRole("button", { name: /uphold/i })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /reject/i })).toHaveLength(2);
  });

  it.each([
    ["uphold", /uphold/i],
    ["reject", /reject/i],
  ])(
    "shows a reason-required error and does not call onDecide when %s is clicked without a reason",
    (_label, buttonName) => {
      // Arrange
      render(<RebuttalQueue items={[REBUTTAL_ONE]} onDecide={onDecide} />);

      // Act
      fireEvent.click(screen.getByRole("button", { name: buttonName }));

      // Assert
      expect(screen.getByText(/reason is required/i)).toBeInTheDocument();
      expect(onDecide).not.toHaveBeenCalled();
    },
  );

  it("calls onDecide with decision 'upheld' and the reason when Uphold is clicked with a reason", () => {
    // Arrange
    render(<RebuttalQueue items={[REBUTTAL_ONE]} onDecide={onDecide} />);
    fireEvent.change(screen.getByLabelText(/reason/i), {
      target: { value: "Evidence pre-dates our introduction by five days." },
    });

    // Act
    fireEvent.click(screen.getByRole("button", { name: /uphold/i }));

    // Assert
    expect(onDecide).toHaveBeenCalledTimes(1);
    expect(onDecide).toHaveBeenCalledWith({
      rebuttalId: "rebuttal-1",
      decision: "upheld",
      reason: "Evidence pre-dates our introduction by five days.",
    });
  });

  it("calls onDecide with decision 'rejected' and the reason when Reject is clicked with a reason", () => {
    // Arrange
    render(<RebuttalQueue items={[REBUTTAL_ONE]} onDecide={onDecide} />);
    fireEvent.change(screen.getByLabelText(/reason/i), {
      target: { value: "Evidence is undated and does not reference the listing." },
    });

    // Act
    fireEvent.click(screen.getByRole("button", { name: /reject/i }));

    // Assert
    expect(onDecide).toHaveBeenCalledTimes(1);
    expect(onDecide).toHaveBeenCalledWith({
      rebuttalId: "rebuttal-1",
      decision: "rejected",
      reason: "Evidence is undated and does not reference the listing.",
    });
  });

  it("renders an empty state when the queue is empty", () => {
    // Arrange / Act
    render(<RebuttalQueue items={[]} onDecide={onDecide} />);

    // Assert
    expect(screen.getByText(/no pending rebuttals/i)).toBeInTheDocument();
  });
});
