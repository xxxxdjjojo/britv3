/**
 * Landlord Deadline Diary — versioned Renters' Rights Act 2025 compliance
 * timeline content types.
 *
 * The diary page, the .ics calendar feed, and the reminder drip are all
 * driven entirely by this data so a housing solicitor can review or diff the
 * content (events, dates, trigger rules, citations) without reading any
 * component logic. Every entry must carry at least one citation — enforced
 * by `rra-deadlines.test.ts`.
 *
 * Date policy: an entry only gets `kind: "dated"` when the date is actually
 * published (in the Act, in commencement regulations, or in official GOV.UK
 * guidance). Everything else is `kind: "trigger"` with plain-English wording
 * about what starts the clock ("expected", "once commenced").
 */

export type Citation = {
  instrument: string;
  section: string;
  url: string;
};

/**
 * Who a deadline applies to. Drives the grouped rendering on the page and
 * the client-side personalisation from the profile answers.
 */
export type AppliesTo =
  | "all_landlords"
  | "pre_may_tenancies"
  | "new_tenancies";

type DeadlineBase = {
  id: string;
  title: string;
  /** Plain-English explanation of what the landlord has to do, and why. */
  summary: string;
  appliesTo: ReadonlyArray<AppliesTo>;
  /** Minimum 1 — enforced via test. */
  citations: ReadonlyArray<Citation>;
  /**
   * True when a managing agent typically handles the task day-to-day. The
   * legal duty stays with the landlord — the page says so explicitly.
   */
  agentUsuallyHandles: boolean;
};

/** A deadline with a published calendar date (ISO YYYY-MM-DD). */
export type DatedDeadline = DeadlineBase & {
  kind: "dated";
  date: string;
};

/**
 * A deadline whose exact date has NOT been published yet. `trigger` states,
 * in plain English, what will start the clock.
 */
export type TriggerDeadline = DeadlineBase & {
  kind: "trigger";
  trigger: string;
};

export type DeadlineEntry = DatedDeadline | TriggerDeadline;
