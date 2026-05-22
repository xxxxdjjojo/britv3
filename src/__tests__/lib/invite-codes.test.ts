// src/__tests__/lib/invite-codes.test.ts
//
// MEMO PIVOT v2 — invite-only seed onboarding for the first 50 trades,
// 10 agents, 20 developers.

import { describe, it, expect } from "vitest";

import {
  generateInviteCode,
  validateInviteCode,
  redeemInviteCode,
  INVITE_QUOTAS,
  type InviteAudience,
} from "@/lib/invite-codes";

describe("INVITE_QUOTAS — memo seed targets", () => {
  it("trade quota is 50", () => {
    expect(INVITE_QUOTAS.trade).toBe(50);
  });

  it("agent quota is 10", () => {
    expect(INVITE_QUOTAS.agent).toBe(10);
  });

  it("developer quota is 20", () => {
    expect(INVITE_QUOTAS.developer).toBe(20);
  });
});

describe("generateInviteCode", () => {
  it("returns a code prefixed with BRIT-<AUDIENCE>-", () => {
    const code = generateInviteCode("trade");
    expect(code).toMatch(/^BRIT-TRADE-[A-Z0-9]{6,}$/);
  });

  it("never collides on 1,000 sequential generations", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1_000; i++) {
      const code = generateInviteCode("agent");
      expect(seen.has(code)).toBe(false);
      seen.add(code);
    }
    expect(seen.size).toBe(1_000);
  });
});

describe("validateInviteCode", () => {
  it("returns null for malformed codes", async () => {
    expect(await validateInviteCode("bogus")).toBeNull();
  });

  it("returns the audience for a well-formed unused code", async () => {
    const code = generateInviteCode("agent");
    const result = await validateInviteCode(code, { skipPersistence: true });
    expect(result?.audience).toBe<InviteAudience>("agent");
  });
});

describe("redeemInviteCode", () => {
  it("rejects redemption of an already-redeemed code", async () => {
    const code = generateInviteCode("developer");
    await redeemInviteCode(code, "user-1", { skipPersistence: true });
    await expect(
      redeemInviteCode(code, "user-2", { skipPersistence: true }),
    ).rejects.toThrow(/already redeemed|invalid/i);
  });

  it("returns success metadata on first redemption", async () => {
    const code = generateInviteCode("trade");
    const result = await redeemInviteCode(code, "user-1", {
      skipPersistence: true,
    });
    expect(result.audience).toBe("trade");
    expect(result.userId).toBe("user-1");
  });
});
