/**
 * Tests for truedeed/dunning-machine (TDD RED — module not yet implemented)
 *
 * Pins the contract of @/lib/truedeed/dunning-machine per
 * docs/truedeed/billing-flow-gocardless.md §2 (timeline) and §5 (state
 * machine sketch). PURE state machine — no I/O, no Date.now(); day_tick
 * carries daysOverdue explicitly.
 *
 *   open → collecting → paid
 *              ↘ failed → overdue(D0) → overdue(D7) → final_notice(D14)
 *                                                   → suspended(D21)
 *   dispute_raised (clause 9.5) → disputed [clock frozen, this invoice only]
 *     resolved rejected → resumes at ctx.stateBeforeDispute
 *     resolved upheld   → cancelled
 *   paid + charged_back → charged_back (clause 8.6, ops-only path)
 *
 * Emails: 1 failed (→overdue), 2 reminder (D+7, state unchanged),
 * 3 final notice (D+14), 4 suspended (D+21), 5 reinstated (payment received).
 * Illegal transitions throw 'invalid dunning transition'.
 */

import { describe, it, expect } from "vitest";

import {
  nextState,
  emailForTransition,
  DUNNING_DAYS,
  type DunningEvent,
} from "@/lib/truedeed/dunning-machine";

// ---------------------------------------------------------------------------
// Fixtures & helpers
// ---------------------------------------------------------------------------

const tick = (daysOverdue: number): DunningEvent => ({
  type: "day_tick",
  daysOverdue,
});

const PAYMENT_CONFIRMED: DunningEvent = { type: "payment_confirmed" };
const PAYMENT_FAILED: DunningEvent = { type: "payment_failed" };
const COLLECTION_STARTED: DunningEvent = { type: "collection_started" };
const DISPUTE_RAISED: DunningEvent = { type: "dispute_raised" };

// ---------------------------------------------------------------------------
// 1. DUNNING_DAYS constants (billing doc §2: D+7 / D+14 / D+21)
// ---------------------------------------------------------------------------

describe("DUNNING_DAYS", () => {
  it("pins the dunning schedule: reminder 7, final notice 14, suspend 21", () => {
    // Assert
    expect(DUNNING_DAYS).toEqual({ REMINDER: 7, FINAL_NOTICE: 14, SUSPEND: 21 });
  });
});

// ---------------------------------------------------------------------------
// 2. Happy path: open → collecting → paid
// ---------------------------------------------------------------------------

describe("happy path", () => {
  it("open + collection_started → collecting (due date DD attempt)", () => {
    // Act + Assert
    expect(nextState("open", COLLECTION_STARTED)).toBe("collecting");
  });

  it("collection start fires no email (Email 0 is invoice-issue, not a transition)", () => {
    // Act + Assert
    expect(
      emailForTransition("open", "collecting", COLLECTION_STARTED),
    ).toBeNull();
  });

  it("collecting + payment_confirmed → paid", () => {
    // Act + Assert
    expect(nextState("collecting", PAYMENT_CONFIRMED)).toBe("paid");
  });
});

// ---------------------------------------------------------------------------
// 3. Dunning timeline: failed → overdue → final_notice → suspended
// ---------------------------------------------------------------------------

describe("dunning timeline", () => {
  it("collecting + payment_failed → overdue (dunning day 0)", () => {
    // Act + Assert
    expect(nextState("collecting", PAYMENT_FAILED)).toBe("overdue");
  });

  it("entering overdue fires email_1_failed", () => {
    // Act + Assert
    expect(emailForTransition("collecting", "overdue", PAYMENT_FAILED)).toBe(
      "email_1_failed",
    );
  });

  it("overdue + day_tick 7 → still overdue (state unchanged, reminder is email-only)", () => {
    // Act + Assert
    expect(nextState("overdue", tick(7))).toBe("overdue");
  });

  it("D+7 self-transition fires email_2_reminder", () => {
    // Act + Assert
    expect(emailForTransition("overdue", "overdue", tick(7))).toBe(
      "email_2_reminder",
    );
  });

  it("overdue + day_tick below the reminder threshold → overdue, no email", () => {
    // Act + Assert
    expect(nextState("overdue", tick(3))).toBe("overdue");
    expect(emailForTransition("overdue", "overdue", tick(3))).toBeNull();
  });

  it("overdue + day_tick 14 → final_notice, firing email_3_final_notice", () => {
    // Act
    const to = nextState("overdue", tick(14));

    // Assert
    expect(to).toBe("final_notice");
    expect(emailForTransition("overdue", "final_notice", tick(14))).toBe(
      "email_3_final_notice",
    );
  });

  it("final_notice + day_tick 21 → suspended (clause 11.1(a)), firing email_4_suspended", () => {
    // Act
    const to = nextState("final_notice", tick(21));

    // Assert
    expect(to).toBe("suspended");
    expect(emailForTransition("final_notice", "suspended", tick(21))).toBe(
      "email_4_suspended",
    );
  });
});

// ---------------------------------------------------------------------------
// 4. Payment received at any dunning stage → paid + reinstatement email
// ---------------------------------------------------------------------------

describe("payment received during dunning", () => {
  it("overdue + payment_confirmed → paid, firing email_5_reinstated", () => {
    // Act + Assert
    expect(nextState("overdue", PAYMENT_CONFIRMED)).toBe("paid");
    expect(emailForTransition("overdue", "paid", PAYMENT_CONFIRMED)).toBe(
      "email_5_reinstated",
    );
  });

  it("final_notice + payment_confirmed → paid, firing email_5_reinstated", () => {
    // Act + Assert
    expect(nextState("final_notice", PAYMENT_CONFIRMED)).toBe("paid");
    expect(emailForTransition("final_notice", "paid", PAYMENT_CONFIRMED)).toBe(
      "email_5_reinstated",
    );
  });

  it("suspended + payment_confirmed → paid (automatic reinstatement), firing email_5_reinstated", () => {
    // Act + Assert
    expect(nextState("suspended", PAYMENT_CONFIRMED)).toBe("paid");
    expect(emailForTransition("suspended", "paid", PAYMENT_CONFIRMED)).toBe(
      "email_5_reinstated",
    );
  });
});

// ---------------------------------------------------------------------------
// 5. Disputes (clause 9.5): freeze, resume, uphold
// ---------------------------------------------------------------------------

describe("disputes", () => {
  it("dispute_raised from open / collecting / overdue / final_notice → disputed", () => {
    // Act + Assert
    expect(nextState("open", DISPUTE_RAISED)).toBe("disputed");
    expect(nextState("collecting", DISPUTE_RAISED)).toBe("disputed");
    expect(nextState("overdue", DISPUTE_RAISED)).toBe("disputed");
    expect(nextState("final_notice", DISPUTE_RAISED)).toBe("disputed");
  });

  it("dispute resolved as rejected resumes the clock at the pre-dispute state", () => {
    // Arrange
    const event: DunningEvent = {
      type: "dispute_resolved",
      outcome: "rejected",
    };

    // Act + Assert — clock restarts where it stopped (§2 dispute pause)
    expect(
      nextState("disputed", event, { stateBeforeDispute: "final_notice" }),
    ).toBe("final_notice");
    expect(nextState("disputed", event, { stateBeforeDispute: "overdue" })).toBe(
      "overdue",
    );
  });

  it("dispute resolved as upheld → cancelled (invoice written off)", () => {
    // Arrange
    const event: DunningEvent = { type: "dispute_resolved", outcome: "upheld" };

    // Act + Assert
    expect(
      nextState("disputed", event, { stateBeforeDispute: "overdue" }),
    ).toBe("cancelled");
  });

  it("dispute_raised from suspended is illegal (clause 9.5 window long past)", () => {
    // Act + Assert
    expect(() => nextState("suspended", DISPUTE_RAISED)).toThrow(
      /invalid dunning transition/,
    );
  });
});

// ---------------------------------------------------------------------------
// 6. Chargebacks and terminal states
// ---------------------------------------------------------------------------

describe("chargebacks and terminal states", () => {
  it("paid + charged_back → charged_back (clause 8.6: debt survives, ops-only)", () => {
    // Act + Assert
    expect(nextState("paid", { type: "charged_back" })).toBe("charged_back");
  });

  it("paid + payment_failed is illegal and throws", () => {
    // Act + Assert
    expect(() => nextState("paid", PAYMENT_FAILED)).toThrow(
      /invalid dunning transition/,
    );
  });

  it("cancelled is terminal: any event throws", () => {
    // Act + Assert
    expect(() => nextState("cancelled", COLLECTION_STARTED)).toThrow(
      /invalid dunning transition/,
    );
    expect(() => nextState("cancelled", tick(30))).toThrow(
      /invalid dunning transition/,
    );
    expect(() => nextState("cancelled", PAYMENT_CONFIRMED)).toThrow(
      /invalid dunning transition/,
    );
  });

  it("invoice cancellation: open + cancelled event → cancelled", () => {
    // Act + Assert
    expect(nextState("open", { type: "cancelled" })).toBe("cancelled");
  });
});
