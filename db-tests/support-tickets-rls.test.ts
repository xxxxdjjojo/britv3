/**
 * Real-Postgres RLS tests for support_tickets (20260713230000). Verifies the
 * customer boundary: a user sees only their OWN tickets and only non-internal
 * messages; anon sees nothing.
 */
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { applyPrerequisites, startPostgres, type DbHarness } from "./harness";

const MIG = join(process.cwd(), "supabase/migrations", "20260713230000_support_tickets.sql");

const USER_A = "11111111-1111-1111-1111-111111111111";
const USER_B = "22222222-2222-2222-2222-222222222222";
const TICKET_A = "aaaaaaaa-1111-1111-1111-111111111111";
const TICKET_B = "bbbbbbbb-2222-2222-2222-222222222222";

function asAnon(db: DbHarness, query: string): string {
  return db.sql(`begin; set local role anon; ${query}; commit;`);
}
function asUser(db: DbHarness, userId: string, query: string): string {
  return db.sql(
    `begin; set local role authenticated; ` +
      `set local request.jwt.claims = '{"sub":"${userId}"}'; ${query}; commit;`,
  );
}

let db: DbHarness;

beforeAll(() => {
  db = startPostgres();
  applyPrerequisites(db);
  db.sqlFile(MIG);

  db.sql(`
    insert into auth.users (id, email) values ('${USER_A}','a@t.test'), ('${USER_B}','b@t.test');
    insert into public.support_tickets (id, reference, user_id, email, subject) values
      ('${TICKET_A}', 'TD-AAAAAA', '${USER_A}', 'a@t.test', 'A ticket'),
      ('${TICKET_B}', 'TD-BBBBBB', '${USER_B}', 'b@t.test', 'B ticket');
    insert into public.support_ticket_messages (ticket_id, author_type, body, internal_note) values
      ('${TICKET_A}', 'customer', 'Public message', false),
      ('${TICKET_A}', 'admin', 'Internal note — do not show', true);
  `);
}, 90_000);

afterAll(() => db?.stop());

describe("support_tickets RLS", () => {
  it("a user sees only their own ticket", () => {
    expect(asUser(db, USER_A, "select count(*) from public.support_tickets")).toBe("1");
    expect(asUser(db, USER_A, "select subject from public.support_tickets")).toBe("A ticket");
    expect(asUser(db, USER_B, "select subject from public.support_tickets")).toBe("B ticket");
  });

  it("anon sees no tickets", () => {
    expect(asAnon(db, "select count(*) from public.support_tickets")).toBe("0");
  });

  it("a user sees non-internal messages only (internal notes hidden)", () => {
    expect(
      asUser(db, USER_A, "select count(*) from public.support_ticket_messages"),
    ).toBe("1");
    expect(
      asUser(db, USER_A, "select body from public.support_ticket_messages"),
    ).toBe("Public message");
  });

  it("a user cannot read another user's ticket messages", () => {
    expect(
      asUser(db, USER_B, `select count(*) from public.support_ticket_messages where ticket_id = '${TICKET_A}'`),
    ).toBe("0");
  });
});
