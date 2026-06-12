/**
 * Truedeed dunning state machine (billing spec §2 timeline, §5 sketch).
 *
 * PURE — no I/O, no Date.now(); the daily `dunning:tick` job passes
 * daysOverdue explicitly. The webhook route and billing services drive it:
 *
 *   open → collecting → paid
 *              ↘ failed → overdue(D0) → overdue(D7) → final_notice(D14)
 *                                                   → suspended(D21)
 *   dispute_raised (clause 9.5) → disputed [clock frozen, this invoice only]
 *     resolved rejected → resumes at ctx.stateBeforeDispute
 *     resolved upheld   → cancelled
 *   paid + charged_back → charged_back (clause 8.6, ops-only path)
 *
 * Illegal transitions throw 'invalid dunning transition'.
 */

/** Invoice dunning states (spec §5). */
export type DunningState =
  | "open"
  | "collecting"
  | "paid"
  | "overdue"
  | "final_notice"
  | "suspended"
  | "disputed"
  | "cancelled"
  | "charged_back";

/** Events the machine consumes (webhooks, daily tick, dispute flow). */
export type DunningEvent =
  | { type: "collection_started" }
  | { type: "payment_confirmed" }
  | { type: "payment_failed" }
  | { type: "day_tick"; daysOverdue: number }
  | { type: "dispute_raised" }
  | { type: "dispute_resolved"; outcome: "rejected" | "upheld" }
  | { type: "charged_back" }
  | { type: "cancelled" };

/** Context for transitions that need history (dispute resume, spec §2). */
export type DunningContext = {
  /** State the invoice was in when the dispute froze its clock. */
  stateBeforeDispute?: DunningState;
};

/** Email ids fired on transitions (spec §4; Email 0 is invoice-issue). */
export type DunningEmail =
  | "email_1_failed"
  | "email_2_reminder"
  | "email_3_final_notice"
  | "email_4_suspended"
  | "email_5_reinstated";

/** Dunning schedule in days from overdue (spec §2: D+7 / D+14 / D+21). */
export const DUNNING_DAYS = {
  REMINDER: 7,
  FINAL_NOTICE: 14,
  SUSPEND: 21,
} as const;

/** States from which a clause 9.5 dispute may still be properly raised. */
const DISPUTABLE_STATES: readonly DunningState[] = [
  "open",
  "collecting",
  "overdue",
  "final_notice",
];

/** States where a confirmed payment reinstates the branch (Email 5). */
const DUNNING_PAYABLE_STATES: readonly DunningState[] = [
  "overdue",
  "final_notice",
  "suspended",
];

function invalidTransition(state: DunningState, event: DunningEvent): Error {
  return new Error(
    `invalid dunning transition: ${state} + ${event.type}`,
  );
}

/**
 * Resolve the next state for an event (spec §5). Throws
 * 'invalid dunning transition' for any pairing outside the lattice.
 */
export function nextState(
  state: DunningState,
  event: DunningEvent,
  ctx: DunningContext = {},
): DunningState {
  if (event.type === "dispute_raised") {
    if (DISPUTABLE_STATES.includes(state)) {
      return "disputed";
    }
    throw invalidTransition(state, event);
  }

  switch (state) {
    case "open":
      if (event.type === "collection_started") return "collecting";
      if (event.type === "cancelled") return "cancelled";
      break;

    case "collecting":
      if (event.type === "payment_confirmed") return "paid";
      if (event.type === "payment_failed") return "overdue";
      break;

    case "overdue":
      if (event.type === "payment_confirmed") return "paid";
      if (event.type === "day_tick") {
        return event.daysOverdue >= DUNNING_DAYS.FINAL_NOTICE
          ? "final_notice"
          : "overdue";
      }
      break;

    case "final_notice":
      if (event.type === "payment_confirmed") return "paid";
      if (event.type === "day_tick") {
        return event.daysOverdue >= DUNNING_DAYS.SUSPEND
          ? "suspended"
          : "final_notice";
      }
      break;

    case "suspended":
      if (event.type === "payment_confirmed") return "paid";
      break;

    case "disputed":
      if (event.type === "dispute_resolved") {
        if (event.outcome === "upheld") return "cancelled";
        if (!ctx.stateBeforeDispute) {
          throw invalidTransition(state, event);
        }
        return ctx.stateBeforeDispute; // clock resumes where it stopped (§2)
      }
      break;

    case "paid":
      if (event.type === "charged_back") return "charged_back"; // clause 8.6
      break;

    case "cancelled":
    case "charged_back":
      break; // terminal — every event falls through to throw
  }

  throw invalidTransition(state, event);
}

/**
 * Email fired by a from → to transition (spec §2/§4), or null when the
 * transition is silent. Email 0 (invoice issued) is not a transition email.
 */
export function emailForTransition(
  from: DunningState,
  to: DunningState,
  event: DunningEvent,
): DunningEmail | null {
  if (to === "overdue" && event.type === "payment_failed") {
    return "email_1_failed"; // D+0: payment failed / overdue
  }
  if (
    from === "overdue" &&
    to === "overdue" &&
    event.type === "day_tick" &&
    event.daysOverdue === DUNNING_DAYS.REMINDER
  ) {
    return "email_2_reminder"; // D+7: reminder, sent once, state unchanged
  }
  if (to === "final_notice" && from !== "disputed") {
    return "email_3_final_notice"; // D+14: formal notice
  }
  if (to === "suspended" && from !== "disputed") {
    return "email_4_suspended"; // D+21: suspension (clause 11.1(a))
  }
  if (to === "paid" && DUNNING_PAYABLE_STATES.includes(from)) {
    return "email_5_reinstated"; // payment received during dunning
  }
  return null;
}
