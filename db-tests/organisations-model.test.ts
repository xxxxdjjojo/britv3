/**
 * Real-Postgres tests for the organisations tenancy model
 * (20260619140000/140001/140002) layered on the agent feed import ledger
 * (20260619120003). Boots an ephemeral container, stubs the pre-existing
 * schema the migrations reference, applies the migrations, and exercises
 * membership helpers, member-visibility RLS, the org-consistency triggers,
 * and the idempotent agency→organisation backfill.
 */
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyPrerequisites, startPostgres, type DbHarness } from "./harness";

const MIG = (file: string): string =>
  join(process.cwd(), "supabase/migrations", file);
const LEDGER = MIG("20260619120003_agent_feed_import_ledger.sql");
const ORG_MODEL = MIG("20260619140000_organisations_model.sql");
const ORG_SCOPE = MIG("20260619140001_org_scope_ingestion.sql");
const BACKFILL = MIG("20260619140002_backfill_agency_organisations.sql");

const AGENT_A = "11111111-1111-1111-1111-111111111111"; // owner of ORG_1, agent on INT_1
const USER_B = "22222222-2222-2222-2222-222222222222"; // outsider (no membership)
const AGENT_C = "33333333-3333-3333-3333-333333333333"; // backfilled agency
const USER_D = "44444444-4444-4444-4444-444444444444"; // member of ORG_1, NOT the agent
const ORG_1 = "a1111111-1111-1111-1111-111111111111";
const ORG_2 = "b2222222-2222-2222-2222-222222222222";
const INT_1 = "c1111111-1111-1111-1111-111111111111";
const RUN_1 = "d1111111-1111-1111-1111-111111111111";
const PROP_C = "e1111111-1111-1111-1111-111111111111";
const LST_C = "f1111111-1111-1111-1111-111111111111";

// Stub of pre-existing tables the migrations reference but the base harness
// prerequisites do not provide.
const EXTRA_STUB = `
create table public.agent_agency_profiles (
  agent_id uuid primary key references auth.users(id),
  agency_name text
);
create table public.agent_feed_integrations (
  id uuid primary key,
  agent_id uuid references auth.users(id),
  provider text
);
create table public.property_media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id)
);

-- Mirror the RLS posture migration 20260313 establishes in production for
-- agent_branches and agent_feed_integrations (the base harness stub omits it):
-- RLS enabled + an agent-self ALL policy. Our org-member policies layer on top.
alter table public.agent_branches enable row level security;
create policy "ab_agent_self" on public.agent_branches for all to authenticated
  using (agent_id = (select auth.uid())) with check (agent_id = (select auth.uid()));
alter table public.agent_feed_integrations enable row level security;
create policy "afi_agent_self" on public.agent_feed_integrations for all to authenticated
  using (agent_id = (select auth.uid())) with check (agent_id = (select auth.uid()));
`;

/** Run a query inside an authenticated transaction for the given user. */
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
  db.sql(EXTRA_STUB);
  db.sqlFile(LEDGER);
  db.sqlFile(ORG_MODEL);
  db.sqlFile(ORG_SCOPE);
  db.sqlFile(BACKFILL); // no agencies yet → no-op

  db.sql(
    `insert into auth.users (id, email) values
      ('${AGENT_A}','a@t.test'),('${USER_B}','b@t.test'),('${USER_D}','d@t.test');`,
  );
  db.sql(
    `insert into public.profiles (id) values ('${AGENT_A}'),('${USER_B}'),('${USER_D}');`,
  );
  db.sql(
    `insert into public.organisations (id, name, slug) values
      ('${ORG_1}','Org One','org-one'),('${ORG_2}','Org Two','org-two');`,
  );
  db.sql(
    `insert into public.organisation_memberships (organisation_id, user_id, role, status) values
      ('${ORG_1}','${AGENT_A}','owner','active'),
      ('${ORG_1}','${USER_D}','member','active');`,
  );
  db.sql(
    `insert into public.agent_feed_integrations (id, agent_id, provider, organisation_id)
      values ('${INT_1}','${AGENT_A}','reapit','${ORG_1}');`,
  );
  db.sql(
    `insert into public.feed_import_runs (id, integration_id, agent_id, provider, source_fingerprint, organisation_id)
      values ('${RUN_1}','${INT_1}','${AGENT_A}','reapit','fp-1','${ORG_1}');`,
  );
}, 120_000);

afterAll(() => db?.stop());

describe("organisations model", () => {
  it("creates organisations and organisation_memberships", () => {
    expect(db.sql(`select to_regclass('public.organisations') is not null;`)).toBe("t");
    expect(db.sql(`select to_regclass('public.organisation_memberships') is not null;`)).toBe("t");
  });

  it("is_org_member resolves membership correctly", () => {
    expect(asUser(db, AGENT_A, `select public.is_org_member('${ORG_1}')`)).toBe("t");
    expect(asUser(db, USER_D, `select public.is_org_member('${ORG_1}')`)).toBe("t");
    expect(asUser(db, USER_B, `select public.is_org_member('${ORG_1}')`)).toBe("f");
  });

  it("has_org_role distinguishes owner from member", () => {
    expect(asUser(db, AGENT_A, `select public.has_org_role('${ORG_1}', array['owner'])`)).toBe("t");
    expect(asUser(db, USER_D, `select public.has_org_role('${ORG_1}', array['owner'])`)).toBe("f");
    expect(asUser(db, USER_D, `select public.has_org_role('${ORG_1}', array['owner','member'])`)).toBe("t");
  });

  it("RLS: only members can read their organisation", () => {
    expect(asUser(db, AGENT_A, `select count(*) from public.organisations where id='${ORG_1}'`)).toBe("1");
    expect(asUser(db, USER_B, `select count(*) from public.organisations where id='${ORG_1}'`)).toBe("0");
  });

  it("RLS: a non-agent org member can read the org's import runs (multi-user access)", () => {
    // USER_D is NOT the agent_id on the run, so this proves the org-membership
    // policy grants access — not the legacy agent_id policy.
    expect(asUser(db, USER_D, `select count(*) from public.feed_import_runs`)).toBe("1");
    expect(asUser(db, AGENT_A, `select count(*) from public.feed_import_runs`)).toBe("1");
  });

  it("RLS: an outsider cannot read another org's import runs", () => {
    expect(asUser(db, USER_B, `select count(*) from public.feed_import_runs`)).toBe("0");
  });

  it("RLS: cross-org isolation holds across the whole ingestion surface", () => {
    const BRANCH_A = "a2222222-2222-2222-2222-222222222222";
    const PROP_A = "a3333333-3333-3333-3333-333333333333";
    const LST_A = "a4444444-4444-4444-4444-444444444444";

    // Seed one ORG_1 row in every org-scoped table (service-role / superuser).
    db.sql(`insert into public.agent_branches (id, agent_id, name, organisation_id)
      values ('${BRANCH_A}','${AGENT_A}','Branch A','${ORG_1}');`);
    db.sql(`insert into public.properties (id, address_line1, postcode) values ('${PROP_A}','1 A St','SW1A 1AA');`);
    db.sql(`insert into public.listings (id, property_id, user_id, status, organisation_id)
      values ('${LST_A}','${PROP_A}','${AGENT_A}','active','${ORG_1}');`);
    db.sql(`insert into public.feed_import_items (run_id, integration_id, agent_id, item_type, external_id, payload, payload_sha256, organisation_id)
      values ('${RUN_1}','${INT_1}','${AGENT_A}','listing','X1','{}','h1','${ORG_1}');`);
    db.sql(`insert into public.feed_listing_links (integration_id, agent_id, external_listing_id, organisation_id)
      values ('${INT_1}','${AGENT_A}','L1','${ORG_1}');`);
    db.sql(`insert into public.feed_branch_links (integration_id, agent_id, external_branch_id, organisation_id)
      values ('${INT_1}','${AGENT_A}','B1','${ORG_1}');`);
    db.sql(`insert into public.feed_media_links (integration_id, agent_id, external_media_id, listing_id, organisation_id)
      values ('${INT_1}','${AGENT_A}','M1','${LST_A}','${ORG_1}');`);

    // An outsider (USER_B) sees nothing in any org-scoped table.
    for (const table of [
      "agent_branches",
      "feed_import_items",
      "feed_listing_links",
      "feed_branch_links",
      "feed_media_links",
      "agent_feed_integrations",
    ]) {
      expect(asUser(db, USER_B, `select count(*) from public.${table}`)).toBe("0");
    }

    // A non-agent org member (USER_D) reads the org's branches/items/links.
    expect(asUser(db, USER_D, `select count(*) from public.agent_branches`)).toBe("1");
    expect(asUser(db, USER_D, `select count(*) from public.feed_import_items`)).toBe("1");
    expect(asUser(db, USER_D, `select count(*) from public.feed_listing_links`)).toBe("1");
    expect(asUser(db, USER_D, `select count(*) from public.feed_branch_links`)).toBe("1");
    expect(asUser(db, USER_D, `select count(*) from public.feed_media_links`)).toBe("1");

    // Feed integrations carry secret references: only owner/admin see them, not
    // a plain member.
    expect(asUser(db, USER_D, `select count(*) from public.agent_feed_integrations`)).toBe("0");
    expect(asUser(db, AGENT_A, `select count(*) from public.agent_feed_integrations`)).toBe("1");
  });

  it("trigger rejects an import run whose organisation_id != the integration's org", () => {
    expect(() =>
      db.sql(
        `insert into public.feed_import_runs (integration_id, agent_id, provider, source_fingerprint, organisation_id)
          values ('${INT_1}','${AGENT_A}','reapit','fp-mismatch','${ORG_2}');`,
      ),
    ).toThrow(/organisation mismatch/);
  });

  it("trigger accepts an import run whose organisation_id matches the integration", () => {
    expect(() =>
      db.sql(
        `insert into public.feed_import_runs (integration_id, agent_id, provider, source_fingerprint, organisation_id)
          values ('${INT_1}','${AGENT_A}','reapit','fp-ok','${ORG_1}');`,
      ),
    ).not.toThrow();
  });

  it("backfill creates one org + owner membership per agency and propagates organisation_id, idempotently", () => {
    db.sql(`insert into auth.users (id, email) values ('${AGENT_C}','c@t.test');`);
    db.sql(`insert into public.profiles (id) values ('${AGENT_C}');`);
    db.sql(`insert into public.agent_agency_profiles (agent_id, agency_name) values ('${AGENT_C}','Caine & Co');`);
    db.sql(`insert into public.properties (id, address_line1, postcode) values ('${PROP_C}','1 Caine St','SW1A 1AA');`);
    db.sql(`insert into public.listings (id, property_id, user_id, status) values ('${LST_C}','${PROP_C}','${AGENT_C}','active');`);

    db.sqlFile(BACKFILL);

    expect(
      db.sql(`select count(*) from public.organisation_memberships where user_id='${AGENT_C}' and role='owner' and status='active'`),
    ).toBe("1");
    expect(db.sql(`select organisation_id is not null from public.listings where id='${LST_C}'`)).toBe("t");
    // slug derived from agency name
    expect(
      db.sql(
        `select slug like 'caine-co-%' from public.organisations o
         join public.organisation_memberships m on m.organisation_id=o.id
         where m.user_id='${AGENT_C}'`,
      ),
    ).toBe("t");

    // re-run is idempotent: no duplicate organisation/membership
    db.sqlFile(BACKFILL);
    expect(db.sql(`select count(*) from public.organisation_memberships where user_id='${AGENT_C}'`)).toBe("1");
  });
});
