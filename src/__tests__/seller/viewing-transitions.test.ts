// Wave 0 stub — implemented in Plan 13-07
// Covers: SELL-05 (viewing status transitions: pending→confirmed allowed; pending→completed rejected)
import { describe, it } from "vitest";

describe("Viewing Status Transitions", () => {
  it.todo("PATCH with action=confirm changes status from pending to confirmed");
  it.todo("PATCH with action=cancel changes status from pending or confirmed to cancelled");
  it.todo("PATCH with action=reschedule requires new_datetime and sets status to rescheduled");
  it.todo("PATCH with action=reschedule missing new_datetime returns 400");
  it.todo("PATCH with invalid action returns 400");
});
