// Wave 0 stub — implemented in Plan 13-02/13-04
// Covers: SELL-16 (AI description returns 429 when attempt count ≥ 3)
import { describe, it } from "vitest";

describe("AI Description Generation", () => {
  it.todo("POST /api/seller/describe returns 429 when listing has 3 existing attempts");
  it.todo("POST /api/seller/describe returns 200 with description when attempts < 3");
  it.todo("GET /api/seller/describe?listing_id=X returns attempts_used count");
  it.todo("generateDescription records a new attempt in listing_description_attempts");
  it.todo("getAttemptCount returns correct count for listing");
});
