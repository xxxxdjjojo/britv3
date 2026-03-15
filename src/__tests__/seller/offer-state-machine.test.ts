// Wave 0 stub — implemented in Plan 13-08
// Covers: SELL-07 (offer state machine rejects invalid transitions)
import { describe, it } from "vitest";

describe("Offer State Machine", () => {
  it.todo("PATCH action=accept transitions pending offer to accepted");
  it.todo("PATCH action=counter transitions pending offer to countered");
  it.todo("PATCH action=reject transitions pending offer to rejected");
  it.todo("PATCH action=accept on an already-accepted offer returns 400 (invalid transition)");
  it.todo("PATCH with unknown action returns 400");
});
