// Wave 0 stub — implemented in Plan 13-04
// Covers: SELL-03 (wizard step navigation preserves draft data across steps)
import { describe, it } from "vitest";

describe("Wizard State", () => {
  it.todo("step param is clamped to 1-7 range (below 1 → 1, above 7 → 7)");
  it.todo("step 1 POST creates a new draft listing and returns id");
  it.todo("steps 2-7 PATCH the existing listing id from URL params");
  it.todo("wizard page with ?id= param loads existing draft data into step components");
});
