// Wave 0 stub — implemented in Plan 13-09
// Covers: SELL-08 (sale progression stage enforces sequential advance only)
import { describe, it } from "vitest";

describe("Sale Progression", () => {
  it.todo("advanceStage from stage 1 moves to stage 2 and records completion date");
  it.todo("advanceStage from stage 8 throws 'Already at final stage' error");
  it.todo("PATCH action=advance_stage with current_stage=N advances to N+1");
  it.todo("getSaleProgressionById returns null for non-existent ID (not an error)");
  it.todo("createSaleProgression inserts with current_stage=1 and today as stage_dates[1]");
});
