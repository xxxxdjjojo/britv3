export { RRA_DEADLINES } from "./entries";
export type {
  AppliesTo,
  Citation,
  DatedDeadline,
  DeadlineEntry,
  TriggerDeadline,
} from "./types";

/** Bump on any material content change; shown via ContentVersionStamp. */
export const RRA_DEADLINES_VERSION = 1;

/** Date the entries were last checked against legislation and guidance. */
export const RRA_DEADLINES_CHECKED_DATE = "2026-07-03";

import { RRA_DEADLINES } from "./entries";
import type { DatedDeadline } from "./types";

/** Dated entries only, ascending by date — the .ics feed and drip source. */
export function datedDeadlines(): ReadonlyArray<DatedDeadline> {
  return RRA_DEADLINES.filter(
    (entry): entry is DatedDeadline => entry.kind === "dated",
  )
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
}
