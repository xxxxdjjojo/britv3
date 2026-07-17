/**
 * Real-Postgres RLS tests for status_incidents (20260713223000). Boots an
 * ephemeral container, stubs the pre-existing schema (auth.uid(), roles,
 * grants) via applyPrerequisites, applies the migration, then verifies the
 * public read boundary: anon and authenticated users see ONLY published
 * incidents, and incident updates only for published parents.
 */
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { applyPrerequisites, startPostgres, type DbHarness } from "./harness";

const MIG = join(process.cwd(), "supabase/migrations", "20260713223000_status_incidents.sql");

const PUBLISHED = "11111111-1111-1111-1111-111111111111";
const DRAFT = "22222222-2222-2222-2222-222222222222";
const USER = "33333333-3333-3333-3333-333333333333";

/** Run a query as the anonymous (unauthenticated) role. */
function asAnon(db: DbHarness, query: string): string {
  return db.sql(`begin; set local role anon; ${query}; commit;`);
}

/** Run a query as an authenticated user. */
function asUser(db: DbHarness, userId: string, query: string): string {
  return db.sql(
    `begin; set local role authenticated; ` +
      `set local request.jwt.claims = '{"sub":"${userId}"}'; ` +
      `${query}; commit;`,
  );
}

let db: DbHarness;

beforeAll(() => {
  db = startPostgres();
  applyPrerequisites(db);
  db.sqlFile(MIG);

  // Seed as postgres (bypasses RLS): one published incident + one draft.
  db.sql(`
    insert into public.status_incidents (id, title, severity, status, is_published)
    values
      ('${PUBLISHED}', 'Published outage', 'critical', 'investigating', true),
      ('${DRAFT}', 'Draft outage', 'major', 'investigating', false);
    insert into public.status_incident_updates (incident_id, status, body)
    values
      ('${PUBLISHED}', 'investigating', 'We are looking into it.'),
      ('${DRAFT}', 'investigating', 'Internal draft note.');
  `);
}, 90_000);

afterAll(() => db?.stop());

describe("status_incidents RLS", () => {
  it("anon sees only published incidents", () => {
    expect(asAnon(db, "select count(*) from public.status_incidents")).toBe("1");
    expect(
      asAnon(db, "select title from public.status_incidents"),
    ).toBe("Published outage");
  });

  it("authenticated users also see only published incidents", () => {
    expect(asUser(db, USER, "select count(*) from public.status_incidents")).toBe("1");
  });

  it("anon sees updates only for published incidents", () => {
    expect(asAnon(db, "select count(*) from public.status_incident_updates")).toBe("1");
    expect(
      asAnon(db, "select body from public.status_incident_updates"),
    ).toBe("We are looking into it.");
  });

  it("anon cannot insert an incident (RLS denies writes)", () => {
    expect(() =>
      asAnon(
        db,
        `insert into public.status_incidents (title, severity, status) values ('hack', 'minor', 'investigating')`,
      ),
    ).toThrow();
  });
});
