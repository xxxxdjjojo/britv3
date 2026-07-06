import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi, beforeEach } from "vitest";

// __dirname = src/app/(main)/fair-landlord-register  → 4 levels to repo root
const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const SRC = path.join(ROOT, "src");
const MIGRATIONS_DIR = path.join(ROOT, "supabase", "migrations");
const CHARTER_PATH = path.join(SRC, "content", "fair-landlord-register", "charter.ts");

// ---------------------------------------------------------------------------
// 1. Charter content guard
// ---------------------------------------------------------------------------
describe("charter.ts content", () => {
  it('contains verbatim "a pledge, not a vetting service"', () => {
    expect(existsSync(CHARTER_PATH), "charter.ts missing").toBe(true);
    const body = readFileSync(CHARTER_PATH, "utf8");
    expect(body).toContain("a pledge, not a vetting service");
  });

  it("exports PLEDGE_ITEMS as a non-empty array", async () => {
    const { PLEDGE_ITEMS } = await import(
      "@/content/fair-landlord-register/charter"
    );
    expect(Array.isArray(PLEDGE_ITEMS)).toBe(true);
    expect(PLEDGE_ITEMS.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Migration file
// ---------------------------------------------------------------------------
describe("fair_landlord_pledges migration", () => {
  const migrationFile = existsSync(MIGRATIONS_DIR)
    ? readdirSync(MIGRATIONS_DIR).find((f) => f.includes("fair_landlord_pledges"))
    : undefined;

  it("migration file exists", () => {
    expect(migrationFile, "no migration filename contains fair_landlord_pledges").toBeTruthy();
  });

  it("migration file is non-empty (>100 chars)", () => {
    if (!migrationFile) return;
    const body = readFileSync(path.join(MIGRATIONS_DIR, migrationFile), "utf8");
    expect(body.trim().length).toBeGreaterThan(100);
  });

  it("migration SQL enables row level security", () => {
    if (!migrationFile) return;
    const body = readFileSync(path.join(MIGRATIONS_DIR, migrationFile), "utf8");
    expect(body).toContain("row level security");
  });

  it("migration SQL gates public reads on status = 'published'", () => {
    if (!migrationFile) return;
    const body = readFileSync(path.join(MIGRATIONS_DIR, migrationFile), "utf8");
    expect(body).toMatch(/status\s*=\s*'published'/);
  });
});

// ---------------------------------------------------------------------------
// 3. API route — POST / DELETE with mocked Supabase client
// ---------------------------------------------------------------------------

// Build a minimal fake Supabase chain.
function makeSupabase({
  user,
  insertError = null,
  updateError = null,
}: {
  user: { id: string; app_metadata: Record<string, unknown> } | null;
  insertError?: { code?: string; message?: string } | null;
  updateError?: { message?: string } | null;
}) {
  const insertFn = vi.fn().mockResolvedValue({ error: insertError });
  const updateFn = vi.fn().mockResolvedValue({ error: updateError });

  // Fluent builder used in the route's insert/update calls.
  const fromFn = vi.fn().mockReturnValue({
    insert: () => insertFn(),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        neq: () => updateFn(),
      }),
    }),
  });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: user ? null : new Error("not authenticated"),
      }),
    },
    from: fromFn,
  };
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("POST /api/landlords/fair-landlord-pledge", () => {
  beforeEach(() => vi.resetModules());

  it("returns 401 when no user session", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({ user: null }) as never,
    );

    const { POST } = await import(
      "../../api/landlords/fair-landlord-pledge/route"
    );
    const req = new Request("http://localhost/api/landlords/fair-landlord-pledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "Test", area: "Leeds" }),
    });
    // NextRequest wraps Request — cast is fine for unit-testing the handler.
    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not a landlord", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({
        user: { id: "user-1", app_metadata: { role: "homebuyer" } },
      }) as never,
    );

    const { POST } = await import(
      "../../api/landlords/fair-landlord-pledge/route"
    );
    const req = new Request("http://localhost/api/landlords/fair-landlord-pledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "Test", area: "Leeds" }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(403);
  });

  it("returns 201 on happy-path landlord signup", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({
        user: { id: "landlord-1", app_metadata: { role: "landlord" } },
        insertError: null,
      }) as never,
    );

    const { POST } = await import(
      "../../api/landlords/fair-landlord-pledge/route"
    );
    const req = new Request("http://localhost/api/landlords/fair-landlord-pledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "Jane Smith", area: "Leeds" }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(201);
    const body = await res.json() as { ok: boolean };
    expect(body.ok).toBe(true);
  });
});

describe("DELETE /api/landlords/fair-landlord-pledge", () => {
  beforeEach(() => vi.resetModules());

  it("returns 200 on happy-path revocation", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(
      makeSupabase({
        user: { id: "landlord-1", app_metadata: { role: "landlord" } },
        updateError: null,
      }) as never,
    );

    const { DELETE } = await import(
      "../../api/landlords/fair-landlord-pledge/route"
    );
    const res = await DELETE();
    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean };
    expect(body.ok).toBe(true);
  });
});
