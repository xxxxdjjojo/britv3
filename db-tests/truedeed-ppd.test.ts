/**
 * RED-phase contract tests for
 * `supabase/migrations/20260612000003_truedeed_ppd.sql`
 * (Truedeed Phase 3 — PPD audit backstop; spec §2 ppd_* tables + §4).
 *
 * The migration does NOT exist yet: `beforeAll` fails (ENOENT) when
 * `sqlFile()` cannot read it. Everything below this file's `beforeAll` is the
 * contract the migration must satisfy. Phases 1 + 2
 * (20260612000000_truedeed_introductions.sql,
 *  20260612000002_truedeed_outcomes.sql) are applied first and must keep
 * passing untouched.
 *
 * Contract (spec §2 "PPD audit backstop" + §4 ingestion/matching):
 *  - ppd_ingest_runs: uuid pk, file_label/file_sha256 not null,
 *    rows_added/rows_changed/rows_deleted int, started_at default now(),
 *    finished_at, status check ('running','succeeded','failed') default
 *    'running'. MUTABLE ops table — no append-only trigger; the ingest job
 *    closes runs out with a plain UPDATE.
 *  - ppd_transactions: ppd_tuid text pk; price_pence bigint not null;
 *    transfer_date date not null; ppd_category not null; address columns;
 *    last_record_status (A/C/D); ingest_run_id fk; updated_at default now().
 *    PPD is a *revisable* dataset (§4.1): upserts apply C rows (UPDATE
 *    allowed) and D rows (DELETE allowed) — no append-only trigger here
 *    either. Indexes: btree on postcode; pg_trgm extension + gin
 *    gin_trgm_ops index `ppd_paon_trgm` on paon.
 *  - ppd_match_candidates: uuid pk, ppd_tuid fk, listing_id fk,
 *    introduction_id fk, mode check ('verification','audit'),
 *    score numeric(4,3) not null, score_components jsonb not null,
 *    status check ('pending_review','branch_queried','confirmed','dismissed')
 *    default 'pending_review', reviewed_by/reviewed_at/review_note,
 *    created_at, unique (ppd_tuid, listing_id).
 *  - invoice_candidates.ppd_match_id: the Phase 2 column gains its real
 *    FOREIGN KEY to ppd_match_candidates(id) (deferred from Phase 2).
 *  - listings: gains paon, saon, uprn text columns (PPD address-shape
 *    mirroring for the matcher).
 *  - RLS (§2.2): all three ppd_* tables — RLS enabled, NO policies for
 *    anon/authenticated at all (service-role/internal ops only); an
 *    authenticated SELECT therefore returns zero rows.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { fileURLToPath } from "node:url";
import { startPostgres, applyPrerequisites, type DbHarness } from "./harness";

const PHASE1_MIGRATION_PATH = fileURLToPath(
  new URL(
    "../supabase/migrations/20260612000000_truedeed_introductions.sql",
    import.meta.url,
  ),
);
const PHASE2_MIGRATION_PATH = fileURLToPath(
  new URL(
    "../supabase/migrations/20260612000002_truedeed_outcomes.sql",
    import.meta.url,
  ),
);
const MIGRATION_PATH = fileURLToPath(
  new URL(
    "../supabase/migrations/20260612000003_truedeed_ppd.sql",
    import.meta.url,
  ),
);

// ===== synthetic fixtures (no real data) =====
// Second uuid group is '3333' so no id collides with the Phase 1 ('0000') or
// Phase 2 ('2222') test files if suites ever share a container.
const AGENT_A = "aaaaaaaa-3333-4000-8000-000000000001"; // owns every listing/introduction
const AGENT_B = "aaaaaaaa-3333-4000-8000-000000000002"; // unrelated agent
const APPLICANT = "bbbbbbbb-3333-4000-8000-000000000001";
const ADMIN = "cccccccc-3333-4000-8000-000000000001";
const BRANCH_A = "dddddddd-3333-4000-8000-000000000001";

const USERS = [AGENT_A, AGENT_B, APPLICANT, ADMIN];

const propertyId = (n: number) => `eeeeeeee-3333-4000-8000-00000000000${n}`;
const listingId = (n: number) => `ffffffff-3333-4000-8000-00000000000${n}`;

const INTRO_1 = "99999999-3333-4000-8000-000000000001";

const RUN_1 = "88888888-3333-4000-8000-000000000001"; // seeded ingest run

// PPD TUIDs are HMLR text identifiers, not uuids.
const TUID_MATCHED = "{TD-3333-MATCHED}"; // referenced by the match candidate
const TUID_CHANGED = "{TD-3333-CHANGED}"; // monthly-update C row → UPDATE target
const TUID_DELETED = "{TD-3333-DELETED}"; // monthly-update D row → DELETE target

const MC_1 = "77777777-3333-4000-8000-000000000001"; // seeded audit-mode candidate

const PPD_TABLES = [
  "ppd_ingest_runs",
  "ppd_transactions",
  "ppd_match_candidates",
] as const;

let db: DbHarness;

/** Run statements as a Supabase `authenticated` user with the given JWT sub. */
function asUser(userId: string, statements: string): string {
  return db.sql(
    `begin;
     set local role authenticated;
     set local request.jwt.claims = '{"sub":"${userId}"}';
     ${statements};
     commit;`,
  );
}

function seedExistingSchemaRows(): void {
  for (const userId of USERS) {
    db.sql(`insert into auth.users (id, email) values ('${userId}', 'user-${userId.slice(-4)}@example.test');`);
    db.sql(`insert into public.profiles (id, display_name, is_admin) values ('${userId}', 'User ${userId.slice(-4)}', ${userId === ADMIN});`);
  }
  db.sql(`insert into public.agent_branches (id, agent_id, name) values ('${BRANCH_A}', '${AGENT_A}', 'Branch A');`);
  db.sql(`insert into public.agent_team_members (user_id, branch_id, role) values ('${AGENT_A}', '${BRANCH_A}', 'manager');`);
  for (const n of [1, 2]) {
    db.sql(`insert into public.properties (id, address_line1, postcode) values ('${propertyId(n)}', '${n} Synthetic Street', 'SW1A 1AA');`);
    db.sql(`insert into public.listings (id, property_id, user_id, status) values ('${listingId(n)}', '${propertyId(n)}', '${AGENT_A}', 'active');`);
  }
}

/** Service-path inserts (superuser stands in for service_role). */
function seedIntroductions(): void {
  // listings.branch_id exists only after the Phase 1 migration.
  db.sql(`update public.listings set branch_id = '${BRANCH_A}';`);
  db.sql(
    `insert into public.introductions
       (id, applicant_id, applicant_name, applicant_email, listing_id,
        branch_id, agent_id, first_contact_type, occurred_at, tail_expires_at)
     values
       ('${INTRO_1}', '${APPLICANT}', 'Synthetic Applicant',
        'synthetic@example.test', '${listingId(1)}',
        '${BRANCH_A}', '${AGENT_A}', 'enquiry',
        timestamptz '2026-06-01T11:00:00Z',
        timestamptz '2026-06-01T11:00:00Z' + interval '6 months');`,
  );
}

/** Phase 3 seeds (service path — RLS denies authenticated, asserted below). */
function seedPpdRows(): void {
  db.sql(
    `insert into public.ppd_ingest_runs (id, file_label, file_sha256)
     values ('${RUN_1}', 'monthly-update-2026-06', '${"ab".repeat(32)}');`,
  );
  for (const tuid of [TUID_MATCHED, TUID_CHANGED, TUID_DELETED]) {
    db.sql(
      `insert into public.ppd_transactions
         (ppd_tuid, price_pence, transfer_date, postcode, property_type,
          new_build, tenure, paon, street, town, ppd_category,
          last_record_status, ingest_run_id)
       values
         ('${tuid}', 35000000, date '2026-04-17', 'SW1A 1AA', 'T',
          false, 'F', '1', 'Synthetic Street', 'London', 'A',
          'A', '${RUN_1}');`,
    );
  }
  db.sql(
    `insert into public.ppd_match_candidates
       (id, ppd_tuid, listing_id, introduction_id, mode, score, score_components)
     values
       ('${MC_1}', '${TUID_MATCHED}', '${listingId(1)}', '${INTRO_1}', 'audit',
        0.812, '{"paon_exact": 0.35, "date_plausibility": 0.15}');`,
  );
}

describe.skipIf(!process.env.RUN_DB_TESTS)("truedeed ppd migration", () => {
  beforeAll(() => {
    db = startPostgres();
    applyPrerequisites(db);
    seedExistingSchemaRows();
    db.sqlFile(PHASE1_MIGRATION_PATH); // Phase 1 exists — must apply cleanly.
    seedIntroductions();
    db.sqlFile(PHASE2_MIGRATION_PATH); // Phase 2 exists — must apply cleanly.
    // RED: the Phase 3 migration file does not exist yet — this line is the failure.
    db.sqlFile(MIGRATION_PATH);
    seedPpdRows();
  });

  afterAll(() => {
    db?.stop();
  });

  // =========================================================================
  describe("schema", () => {
    it.each(PPD_TABLES)("creates public.%s", (table) => {
      expect(db.sql(`select to_regclass('public.${table}') is not null;`)).toBe("t");
    });

    it("ppd_transactions: ppd_tuid is the primary key", () => {
      expect(
        db.sql(
          `select a.attname
           from pg_index i
           join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
           where i.indrelid = 'public.ppd_transactions'::regclass and i.indisprimary;`,
        ),
      ).toBe("ppd_tuid");
    });

    it("ppd_transactions: price_pence, transfer_date, ppd_category are NOT NULL", () => {
      expect(() =>
        db.sql(
          `insert into ppd_transactions (ppd_tuid, transfer_date, ppd_category)
           values ('{TD-3333-NN1}', date '2026-04-01', 'A');`,
        ),
      ).toThrow(/not-null constraint/);
      expect(() =>
        db.sql(
          `insert into ppd_transactions (ppd_tuid, price_pence, ppd_category)
           values ('{TD-3333-NN2}', 100, 'A');`,
        ),
      ).toThrow(/not-null constraint/);
      expect(() =>
        db.sql(
          `insert into ppd_transactions (ppd_tuid, price_pence, transfer_date)
           values ('{TD-3333-NN3}', 100, date '2026-04-01');`,
        ),
      ).toThrow(/not-null constraint/);
    });

    it("ppd_match_candidates.score is numeric(4,3)", () => {
      expect(
        db.sql(
          `select numeric_precision || ',' || numeric_scale
           from information_schema.columns
           where table_schema = 'public' and table_name = 'ppd_match_candidates'
             and column_name = 'score';`,
        ),
      ).toBe("4,3");
    });

    it("listings gains paon, saon, uprn text columns", () => {
      expect(
        db.sql(
          `select count(*) from information_schema.columns
           where table_schema = 'public' and table_name = 'listings'
             and column_name in ('paon', 'saon', 'uprn')
             and data_type = 'text';`,
        ),
      ).toBe("3");
    });

    it("invoice_candidates.ppd_match_id now has a real FK to ppd_match_candidates(id)", () => {
      expect(
        db.sql(
          `select count(*)
           from information_schema.table_constraints tc
           join information_schema.key_column_usage kcu
             on kcu.constraint_name = tc.constraint_name
            and kcu.table_schema = tc.table_schema
           join information_schema.constraint_column_usage ccu
             on ccu.constraint_name = tc.constraint_name
            and ccu.table_schema = tc.table_schema
           where tc.table_schema = 'public'
             and tc.table_name = 'invoice_candidates'
             and tc.constraint_type = 'FOREIGN KEY'
             and kcu.column_name = 'ppd_match_id'
             and ccu.table_name = 'ppd_match_candidates'
             and ccu.column_name = 'id';`,
        ),
      ).toBe("1");
    });
  });

  // =========================================================================
  describe("matcher indexes", () => {
    it("btree index on ppd_transactions (postcode)", () => {
      expect(
        db.sql(
          `select count(*) >= 1 from pg_indexes
           where schemaname = 'public' and tablename = 'ppd_transactions'
             and indexdef ilike '%using btree (postcode)%';`,
        ),
      ).toBe("t");
    });

    it("pg_trgm extension installed + gin gin_trgm_ops index ppd_paon_trgm on paon", () => {
      expect(db.sql(`select count(*) from pg_extension where extname = 'pg_trgm';`)).toBe("1");
      expect(
        db.sql(
          `select count(*) from pg_indexes
           where schemaname = 'public' and tablename = 'ppd_transactions'
             and indexname = 'ppd_paon_trgm'
             and indexdef ilike '%using gin%'
             and indexdef ilike '%paon gin_trgm_ops%';`,
        ),
      ).toBe("1");
    });
  });

  // =========================================================================
  describe("ppd_ingest_runs (mutable ops table)", () => {
    it("defaults: status='running', started_at stamped, finished_at null", () => {
      expect(
        db.sql(
          `select status = 'running' and started_at is not null and finished_at is null
           from ppd_ingest_runs where id = '${RUN_1}';`,
        ),
      ).toBe("t");
    });

    it("rejects a status outside running/succeeded/failed", () => {
      expect(() =>
        db.sql(
          `insert into ppd_ingest_runs (file_label, file_sha256, status)
           values ('monthly-update-2026-07', '${"cd".repeat(32)}', 'cancelled');`,
        ),
      ).toThrow(/check constraint/);
    });

    it("close-out UPDATE succeeds — no append-only trigger on this table", () => {
      db.sql(
        `update ppd_ingest_runs
         set status = 'succeeded', finished_at = now(),
             rows_added = 1200, rows_changed = 40, rows_deleted = 3
         where id = '${RUN_1}';`,
      );
      expect(
        db.sql(
          `select status = 'succeeded' and finished_at is not null
              and rows_added = 1200 and rows_changed = 40 and rows_deleted = 3
           from ppd_ingest_runs where id = '${RUN_1}';`,
        ),
      ).toBe("t");
    });
  });

  // =========================================================================
  describe("ppd_transactions (revisable dataset — §4.1 A/C/D)", () => {
    it("UPDATE succeeds (monthly-update C row applied by upsert)", () => {
      db.sql(
        `update ppd_transactions
         set price_pence = 36000000, last_record_status = 'C'
         where ppd_tuid = '${TUID_CHANGED}';`,
      );
      expect(
        db.sql(
          `select price_pence = 36000000 and last_record_status = 'C'
              and updated_at is not null
           from ppd_transactions where ppd_tuid = '${TUID_CHANGED}';`,
        ),
      ).toBe("t");
    });

    it("DELETE succeeds (monthly-update D row applied by upsert)", () => {
      db.sql(`delete from ppd_transactions where ppd_tuid = '${TUID_DELETED}';`);
      expect(
        db.sql(`select count(*) from ppd_transactions where ppd_tuid = '${TUID_DELETED}';`),
      ).toBe("0");
    });
  });

  // =========================================================================
  describe("ppd_match_candidates", () => {
    it("defaults: status='pending_review', created_at stamped, review fields empty", () => {
      expect(
        db.sql(
          `select status = 'pending_review' and created_at is not null
              and reviewed_by is null and reviewed_at is null and review_note is null
           from ppd_match_candidates where id = '${MC_1}';`,
        ),
      ).toBe("t");
    });

    it("rejects a mode outside verification/audit and a status outside the review states", () => {
      expect(() =>
        db.sql(
          `insert into ppd_match_candidates
             (ppd_tuid, listing_id, mode, score, score_components)
           values ('${TUID_CHANGED}', '${listingId(2)}', 'fuzzy', 0.700, '{}');`,
        ),
      ).toThrow(/check constraint/);
      expect(() =>
        db.sql(
          `insert into ppd_match_candidates
             (ppd_tuid, listing_id, mode, score, score_components, status)
           values ('${TUID_CHANGED}', '${listingId(2)}', 'audit', 0.700, '{}', 'approved');`,
        ),
      ).toThrow(/check constraint/);
    });

    it("rejects a duplicate (ppd_tuid, listing_id) pair", () => {
      expect(() =>
        db.sql(
          `insert into ppd_match_candidates
             (ppd_tuid, listing_id, mode, score, score_components)
           values ('${TUID_MATCHED}', '${listingId(1)}', 'verification', 0.901, '{}');`,
        ),
      ).toThrow(/duplicate key|unique constraint/);
    });
  });

  // =========================================================================
  describe("row level security (§2.2 — internal/service-role only)", () => {
    it.each(PPD_TABLES)(
      "%s: RLS enabled, zero policies, authenticated sees zero rows",
      (table) => {
        // RLS is on…
        expect(
          db.sql(`select relrowsecurity from pg_class where oid = 'public.${table}'::regclass;`),
        ).toBe("t");
        // …with NO policies at all (anon/authenticated get nothing; service
        // role bypasses RLS and needs none).
        expect(
          db.sql(
            `select count(*) from pg_policies
             where schemaname = 'public' and tablename = '${table}';`,
          ),
        ).toBe("0");
        // Rows exist on the service path…
        expect(db.sql(`select count(*) > 0 from public.${table};`)).toBe("t");
        // …but an authenticated branch agent sees zero.
        expect(asUser(AGENT_A, `select count(*) from public.${table}`)).toBe("0");
      },
    );

    it("rejects INSERT into ppd_transactions as authenticated — even an admin", () => {
      expect(() =>
        asUser(
          ADMIN,
          `insert into ppd_transactions (ppd_tuid, price_pence, transfer_date, ppd_category)
           values ('{TD-3333-RLS1}', 100, date '2026-04-01', 'A')`,
        ),
      ).toThrow(/row-level security|permission denied/);
    });
  });
});
