import { describe, expect, it } from "vitest";

import { canCustomerReply, generateTicketReference } from "./ticket-service";

describe("generateTicketReference", () => {
  it("produces a TD- prefixed 6-char reference from an unambiguous alphabet", () => {
    const ref = generateTicketReference(() => 0);
    expect(ref).toMatch(/^TD-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  });

  it("varies with the rng (distinct references)", () => {
    let n = 0;
    const rng = () => {
      n += 0.137;
      return n % 1;
    };
    const a = generateTicketReference(rng);
    const b = generateTicketReference(rng);
    expect(a).not.toBe(b);
  });

  it("never contains ambiguous characters (0/O/1/I)", () => {
    for (let i = 0; i < 50; i += 1) {
      const ref = generateTicketReference();
      expect(ref.slice(3)).not.toMatch(/[01OI]/);
    }
  });
});

describe("canCustomerReply", () => {
  it("allows replies on open/pending tickets", () => {
    expect(canCustomerReply("open")).toBe(true);
    expect(canCustomerReply("pending_customer")).toBe(true);
    expect(canCustomerReply("pending_internal")).toBe(true);
  });

  it("blocks replies on resolved/closed tickets", () => {
    expect(canCustomerReply("resolved")).toBe(false);
    expect(canCustomerReply("closed")).toBe(false);
  });
});
