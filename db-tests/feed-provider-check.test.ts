/**
 * DB-test: widen provider CHECK on agent_feed_integrations
 * (migration 20260619150000_widen_provider_check.sql)
 *
 * Boots an ephemeral postgres:15-alpine container, stubs the minimal schema,
 * applies the base agent_feed_integrations table with the OLD constraint
 * (reapit/alto/jupix only), then applies the new migration's ALTER.
 *
 * Asserts:
 *   - csv + sandbox insert → success
 *   - not_a_provider insert → rejected by CHECK
 */
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyPrerequisites, startPostgres, type DbHarness } from "./harness";

const MIG_WIDEN = join(
  process.cwd(),
  "supabase/migrations/20260619150000_widen_provider_check.sql",
);

const AGENT_1 = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

// Stub the agent_feed_integrations table with the OLD provider CHECK
// (mirrors what migration 20260313_agent_dashboard.sql does in prod).
const SCHEMA_STUB = `
create table public.agent_feed_integrations (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references auth.users(id),
  provider text not null check (provider in ('reapit', 'alto', 'jupix'))
);
`;

let db: DbHarness;

beforeAll(() => {
  db = startPostgres();
  applyPrerequisites(db);
  db.sql(SCHEMA_STUB);
  db.sql(
    `insert into auth.users (id, email) values ('${AGENT_1}', 'agent@t.test');`,
  );
  // Apply the widening migration (this is what we're testing)
  db.sqlFile(MIG_WIDEN);
}, 120_000);

afterAll(() => db?.stop());

describe("feed-provider-check: widened CHECK constraint", () => {
  it("accepts csv as a valid provider", () => {
    expect(() =>
      db.sql(
        `insert into public.agent_feed_integrations (agent_id, provider)
         values ('${AGENT_1}', 'csv');`,
      ),
    ).not.toThrow();
  });

  it("accepts sandbox as a valid provider", () => {
    expect(() =>
      db.sql(
        `insert into public.agent_feed_integrations (agent_id, provider)
         values ('${AGENT_1}', 'sandbox');`,
      ),
    ).not.toThrow();
  });

  it("accepts generic_feed as a valid provider", () => {
    expect(() =>
      db.sql(
        `insert into public.agent_feed_integrations (agent_id, provider)
         values ('${AGENT_1}', 'generic_feed');`,
      ),
    ).not.toThrow();
  });

  it("still accepts existing providers (reapit, alto, jupix)", () => {
    for (const provider of ["reapit", "alto", "jupix"]) {
      expect(() =>
        db.sql(
          `insert into public.agent_feed_integrations (agent_id, provider)
           values ('${AGENT_1}', '${provider}');`,
        ),
      ).not.toThrow();
    }
  });

  it("rejects a junk provider value", () => {
    expect(() =>
      db.sql(
        `insert into public.agent_feed_integrations (agent_id, provider)
         values ('${AGENT_1}', 'not_a_provider');`,
      ),
    ).toThrow(/violates check constraint/);
  });
});
