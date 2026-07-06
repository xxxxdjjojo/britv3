import { describe, it, expect, vi } from "vitest";
import { getExistingViewingId } from "@/services/viewings/viewings-service";

const LISTING_UUID = "bbbbbbbb-0006-0006-0006-bbbbbbbbbbbb";
const USER_ID = "53d5b30f-8019-4324-b3f0-3b3bc02295a7";

/** Chainable builder ending at .maybeSingle(). */
function makeBuilder(result: { data: unknown }) {
  const calls: { eq: Array<[string, unknown]>; inArgs: Array<[string, unknown]> } = {
    eq: [],
    inArgs: [],
  };
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn((c: string, v: unknown) => {
      calls.eq.push([c, v]);
      return builder;
    }),
    in: vi.fn((c: string, v: unknown) => {
      calls.inArgs.push([c, v]);
      return builder;
    }),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => ({ data: result.data, error: null })),
  };
  return { builder, calls };
}

describe("getExistingViewingId", () => {
  it("returns null for a non-UUID listing id without querying", async () => {
    const from = vi.fn();
    const supabase = { from } as never;

    const result = await getExistingViewingId(supabase, USER_ID, "mock-1");

    expect(result).toBeNull();
    expect(from).not.toHaveBeenCalled();
  });

  it("queries viewings by user_id + listing_id + open statuses", async () => {
    const { builder, calls } = makeBuilder({ data: { id: "viewing-42" } });
    const from = vi.fn(() => builder);
    const supabase = { from } as never;

    const result = await getExistingViewingId(supabase, USER_ID, LISTING_UUID);

    expect(result).toBe("viewing-42");
    expect(from).toHaveBeenCalledWith("viewings");
    expect(calls.eq).toContainEqual(["user_id", USER_ID]);
    expect(calls.eq).toContainEqual(["listing_id", LISTING_UUID]);
    expect(calls.inArgs).toContainEqual(["status", ["pending", "confirmed", "rescheduled"]]);
  });

  it("returns null when no open viewing exists", async () => {
    const { builder } = makeBuilder({ data: null });
    const supabase = { from: vi.fn(() => builder) } as never;

    const result = await getExistingViewingId(supabase, USER_ID, LISTING_UUID);

    expect(result).toBeNull();
  });
});
