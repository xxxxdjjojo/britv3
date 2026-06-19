import { describe, expect, it, vi } from "vitest";
import {
  assertOrgRole,
  getOrganisationMembers,
  getUserOrganisation,
} from "./organisation-service";

type Result = { data?: unknown; error?: unknown };

function chain(result: Result = { data: null, error: null }) {
  const resolved = { data: null, error: null, ...result };
  const c: Record<string, unknown> = {};
  const self = () => c as never;
  Object.assign(c, {
    select: vi.fn(self),
    eq: vi.fn(self),
    order: vi.fn(self),
    limit: vi.fn(self),
    maybeSingle: vi.fn().mockResolvedValue(resolved),
    then: (resolve: (v: Result) => unknown) => Promise.resolve(resolved).then(resolve),
  });
  return c as Record<string, ReturnType<typeof vi.fn>> & Result;
}

describe("organisation-service", () => {
  it("resolves the user's active organisation with role (nested join)", async () => {
    const c = chain({
      data: {
        organisation_id: "org-1",
        role: "owner",
        organisations: { name: "Org One", slug: "org-one" },
      },
    });
    const supabase = { from: vi.fn(() => c) };

    const result = await getUserOrganisation(supabase as never, "user-1");

    expect(result).toEqual({
      organisation_id: "org-1",
      name: "Org One",
      slug: "org-one",
      role: "owner",
    });
    expect(c.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(c.eq).toHaveBeenCalledWith("status", "active");
  });

  it("handles the nested join arriving as an array", async () => {
    const c = chain({
      data: {
        organisation_id: "org-2",
        role: "member",
        organisations: [{ name: "Org Two", slug: "org-two" }],
      },
    });
    const supabase = { from: vi.fn(() => c) };

    const result = await getUserOrganisation(supabase as never, "user-2");

    expect(result).toMatchObject({ name: "Org Two", slug: "org-two", role: "member" });
  });

  it("returns null when the user has no active membership", async () => {
    const supabase = { from: vi.fn(() => chain({ data: null })) };
    expect(await getUserOrganisation(supabase as never, "nobody")).toBeNull();
  });

  it("returns null when the membership has no resolvable organisation (FK gap)", async () => {
    const supabase = {
      from: vi.fn(() =>
        chain({ data: { organisation_id: "org-x", role: "owner", organisations: null } }),
      ),
    };
    expect(await getUserOrganisation(supabase as never, "user-x")).toBeNull();
  });

  it("lists organisation members", async () => {
    const c = chain({ data: [{ id: "m1" }, { id: "m2" }] });
    const supabase = { from: vi.fn(() => c) };

    const members = await getOrganisationMembers(supabase as never, "org-1");

    expect(members).toHaveLength(2);
    expect(c.eq).toHaveBeenCalledWith("organisation_id", "org-1");
  });

  it("assertOrgRole passes when the user holds an allowed role", async () => {
    const supabase = { from: vi.fn(() => chain({ data: { role: "admin" } })) };
    await expect(
      assertOrgRole(supabase as never, "user-1", "org-1", ["owner", "admin"]),
    ).resolves.toBeUndefined();
  });

  it("assertOrgRole throws when the user lacks the role", async () => {
    const supabase = { from: vi.fn(() => chain({ data: { role: "viewer" } })) };
    await expect(
      assertOrgRole(supabase as never, "user-1", "org-1", ["owner", "admin"]),
    ).rejects.toThrow(/lacks required role/);
  });

  it("assertOrgRole throws when there is no membership", async () => {
    const supabase = { from: vi.fn(() => chain({ data: null })) };
    await expect(
      assertOrgRole(supabase as never, "user-1", "org-1", ["owner"]),
    ).rejects.toThrow(/lacks required role/);
  });
});
