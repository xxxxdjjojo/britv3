/**
 * RED-phase contract tests for
 * `supabase/migrations/20260612000005_truedeed_disputes.sql`
 * (Truedeed Phase 5 — invoice disputes: clause 9.5 Properly Raised Disputes,
 *  playbook categories D1–D5, admin decision function, dunning re-entry).
 *
 * The migration does NOT exist yet: `beforeAll` fails (ENOENT) when
 * `sqlFile()` cannot read it. Everything below this file's `beforeAll` is the
 * contract the migration must satisfy. Phases 1–4
 * (20260612000000_truedeed_introductions.sql,
 *  20260612000002_truedeed_outcomes.sql,
 *  20260612000003_truedeed_ppd.sql,
 *  20260612000004_truedeed_billing.sql) are applied first and must keep
 * passing.
 *
 * Contract source: docs/truedeed/dispute-playbook.md (D1–D5 + operating
 * principles) and docs/truedeed/billing-flow-gocardless.md clause 9.5
 * ("within 10 business days of invoice, via platform, with grounds +
 * evidence" — the dunning state machine freezes for that invoice only).
 *  - invoice_disputes: id uuid pk; invoice_id uuid not null → invoices;
 *    raised_by uuid not null; grounds text not null; evidence_storage_paths
 *    text[] default '{}'; category text null check in ('D1_source',
 *    'D2_fell_through','D3_different_applicant','D4_no_tail_agreement',
 *    'D5_fee_level') — the ADMIN assigns the playbook category at decision
 *    time, not the branch; raised_at default now(); properly_raised boolean
 *    not null default true; status check ('open','conceded','rejected')
 *    default 'open'; decided_by/decided_at/decision_reason; unique(invoice_id)
 *    — one dispute per invoice.
 *  - Mutations ONLY via SECURITY DEFINER decide_invoice_dispute(p_id,
 *    p_admin, p_decision, p_category, p_reason): decision in
 *    ('conceded','rejected'); a non-empty reason is required for BOTH
 *    decisions (concede "in writing; once" — playbook principle 2); category
 *    required; deciding twice → 'already decided'. Direct UPDATE →
 *    'append-only table: UPDATE blocked on invoice_disputes'; DELETE always
 *    blocked.
 *  - decide_invoice_dispute drives transition_invoice (Phase 4): 'conceded'
 *    → dispute_resolved-upheld (invoice → cancelled); 'rejected' →
 *    dispute_resolved-rejected (invoice resumes at state_before_dispute —
 *    "Resolution restarts the clock where it stopped").
 *  - RLS: agent SELECT/INSERT own disputes via the invoice join
 *    (org_agent_id = auth.uid(), raised_by = auth.uid()); admin SELECT all;
 *    no authenticated UPDATE/DELETE.
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
const PHASE3_MIGRATION_PATH = fileURLToPath(
  new URL(
    "../supabase/migrations/20260612000003_truedeed_ppd.sql",
    import.meta.url,
  ),
);
const PHASE4_MIGRATION_PATH = fileURLToPath(
  new URL(
    "../supabase/migrations/20260612000004_truedeed_billing.sql",
    import.meta.url,
  ),
);
const MIGRATION_PATH = fileURLToPath(
  new URL(
    "../supabase/migrations/20260612000005_truedeed_disputes.sql",
    import.meta.url,
  ),
);

// ===== synthetic fixtures (no real data) =====
// Second uuid group is '5555' so no id collides with the Phase 1 ('0000'),
// Phase 2 ('2222'), Phase 3 ('3333') or Phase 4 ('4444') test files if suites
// ever share a container. Dispute rows themselves use the 'eeeeeeee' prefix.
const AGENT_A = "aaaaaaaa-5555-4000-8000-000000000001"; // the disputing agent
const AGENT_B = "aaaaaaaa-5555-4000-8000-000000000002"; // unrelated agent
const APPLICANT = "bbbbbbbb-5555-4000-8000-000000000001";
const ADMIN = "cccccccc-5555-4000-8000-000000000001";
const BRANCH_A = "dddddddd-5555-4000-8000-000000000001";
const PROFILE_A = "dddddddd-5555-4000-8000-0000000000aa"; // agency profile stub row

const USERS = [AGENT_A, AGENT_B, APPLICANT, ADMIN];

const PROPERTY_1 = "eeeeeeee-5555-4000-8000-000000000001";
const LISTING_1 = "ffffffff-5555-4000-8000-000000000001";
const INTRO_1 = "99999999-5555-4000-8000-000000000001";

// approved invoice_candidates (one per invoice — invoice_candidate_id is unique)
const candidateId = (n: number) => `88888888-5555-4000-8000-00000000000${n}`;

// invoices: INV_1 = dispute conceded → cancelled; INV_2 = dispute rejected →
// back to overdue; INV_3 stays open and dispute-free for the RLS insert tests.
const INV_1 = "eeeeeeee-5555-4000-8000-000000000101";
const INV_2 = "eeeeeeee-5555-4000-8000-000000000102";
const INV_3 = "eeeeeeee-5555-4000-8000-000000000103";

// disputes seeded via the service path (superuser stands in for service_role)
const DISPUTE_1 = "eeeeeeee-5555-4000-8000-000000000201"; // on INV_1
const DISPUTE_2 = "eeeeeeee-5555-4000-8000-000000000202"; // on INV_2

const CATEGORIES = [
  "D1_source",
  "D2_fell_through",
  "D3_different_applicant",
  "D4_no_tail_agreement",
  "D5_fee_level",
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

function transition(invoiceId: string, event: string, days?: number): string {
  const daysArg = days === undefined ? "null" : String(days);
  return db.sql(
    `select transition_invoice('${invoiceId}', '${event}', ${daysArg});`,
  );
}

function decide(
  disputeId: string,
  decision: string,
  category: string | null,
  reason: string,
): string {
  const categoryArg = category === null ? "null" : `'${category}'`;
  return db.sql(
    `select decide_invoice_dispute('${disputeId}', '${ADMIN}', '${decision}',
                                   ${categoryArg}, '${reason}');`,
  );
}

function invoiceState(invoiceId: string): string {
  return db.sql(`select state from invoices where id = '${invoiceId}';`);
}

/**
 * Prerequisites-extension: the harness stub lacks agent_agency_profiles, but
 * the migrations alter it with `alter table if exists`. Create a minimal stub
 * FIRST (before Phase 1) so every alter applies and the billing/dispute
 * columns are real and testable. (Same approach as truedeed-billing.test.ts.)
 */
function createAgencyProfilesStub(): void {
  db.sql(
    `create table public.agent_agency_profiles (
       id uuid primary key default gen_random_uuid(),
       agent_id uuid references auth.users(id)
     );`,
  );
}

function seedExistingSchemaRows(): void {
  for (const userId of USERS) {
    db.sql(`insert into auth.users (id, email) values ('${userId}', 'user-${userId.slice(-4)}@example.test');`);
    db.sql(`insert into public.profiles (id, display_name, is_admin) values ('${userId}', 'User ${userId.slice(-4)}', ${userId === ADMIN});`);
  }
  db.sql(`insert into public.agent_branches (id, agent_id, name) values ('${BRANCH_A}', '${AGENT_A}', 'Branch A');`);
  db.sql(`insert into public.agent_team_members (user_id, branch_id, role) values ('${AGENT_A}', '${BRANCH_A}', 'manager');`);
  db.sql(`insert into public.agent_agency_profiles (id, agent_id) values ('${PROFILE_A}', '${AGENT_A}');`);
  db.sql(`insert into public.properties (id, address_line1, postcode) values ('${PROPERTY_1}', '1 Synthetic Street', 'SW1A 1AA');`);
  db.sql(`insert into public.listings (id, property_id, user_id, status) values ('${LISTING_1}', '${PROPERTY_1}', '${AGENT_A}', 'active');`);
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
        'synthetic@example.test', '${LISTING_1}',
        '${BRANCH_A}', '${AGENT_A}', 'enquiry',
        timestamptz '2026-06-01T11:00:00Z',
        timestamptz '2026-06-01T11:00:00Z' + interval '6 months');`,
  );
}

/** Phase 4 seeds (service path — billing:create-invoice worker). */
function seedBillingRows(): void {
  for (const n of [1, 2, 3]) {
    db.sql(
      `insert into public.invoice_candidates (id, source, introduction_id, status)
       values ('${candidateId(n)}', 'agent_report', '${INTRO_1}', 'approved');`,
    );
  }
  for (const [invoiceId, n] of [
    [INV_1, 1],
    [INV_2, 2],
    [INV_3, 3],
  ] as const) {
    db.sql(
      `insert into public.invoices
         (id, org_agent_id, invoice_candidate_id, introduction_id,
          net_pence, vat_pence, gross_pence, due_at)
       values
         ('${invoiceId}', '${AGENT_A}', '${candidateId(n)}', '${INTRO_1}',
          24900, 4980, 29880, now() + interval '14 days');`,
    );
  }
}

/**
 * Phase 5 seeds. Per clause 9.5 the SERVICE raises the dunning freeze
 * (dispute_raised) and then records the dispute row: INV_1/INV_2 are walked
 * to overdue and frozen at 'disputed' (state_before_dispute = 'overdue');
 * INV_3 stays open and dispute-free for the RLS insert tests.
 */
function seedDisputeRows(): void {
  for (const invoiceId of [INV_1, INV_2]) {
    transition(invoiceId, "collection_started");
    transition(invoiceId, "payment_failed");
    transition(invoiceId, "dispute_raised");
  }
  for (const [disputeId, invoiceId] of [
    [DISPUTE_1, INV_1],
    [DISPUTE_2, INV_2],
  ] as const) {
    db.sql(
      `insert into public.invoice_disputes (id, invoice_id, raised_by, grounds)
       values ('${disputeId}', '${invoiceId}', '${AGENT_A}',
               'That buyer came from a portal, not you');`,
    );
  }
}

describe.skipIf(!process.env.RUN_DB_TESTS)("truedeed disputes migration", () => {
  beforeAll(() => {
    db = startPostgres();
    applyPrerequisites(db);
    createAgencyProfilesStub(); // BEFORE migrations — see function docstring.
    seedExistingSchemaRows();
    db.sqlFile(PHASE1_MIGRATION_PATH); // Phase 1 exists — must apply cleanly.
    seedIntroductions();
    db.sqlFile(PHASE2_MIGRATION_PATH); // Phase 2 exists — must apply cleanly.
    db.sqlFile(PHASE3_MIGRATION_PATH); // Phase 3 exists — must apply cleanly.
    db.sqlFile(PHASE4_MIGRATION_PATH); // Phase 4 exists — must apply cleanly.
    seedBillingRows();
    // RED: the Phase 5 migration file does not exist yet — this line is the failure.
    db.sqlFile(MIGRATION_PATH);
    seedDisputeRows();
  });

  afterAll(() => {
    db?.stop();
  });

  // =========================================================================
  describe("schema", () => {
    it("creates public.invoice_disputes", () => {
      expect(db.sql(`select to_regclass('public.invoice_disputes') is not null;`)).toBe("t");
    });

    it("defaults: status='open', properly_raised, raised_at stamped, evidence '{}', category null (admin assigns)", () => {
      expect(
        db.sql(
          `select status = 'open' and properly_raised and raised_at is not null
              and evidence_storage_paths = '{}'::text[] and category is null
              and decided_by is null and decided_at is null and decision_reason is null
           from invoice_disputes where id = '${DISPUTE_1}';`,
        ),
      ).toBe("t");
    });

    it("invoice_id and grounds are NOT NULL (clause 9.5 — 'with grounds')", () => {
      expect(() =>
        db.sql(
          `insert into invoice_disputes (raised_by, grounds)
           values ('${AGENT_A}', 'orphan dispute');`,
        ),
      ).toThrow(/not-null constraint/);
      expect(() =>
        db.sql(
          `insert into invoice_disputes (invoice_id, raised_by)
           values ('${INV_3}', '${AGENT_A}');`,
        ),
      ).toThrow(/not-null constraint/);
    });

    it("category accepts only the five playbook codes D1–D5", () => {
      for (const category of CATEGORIES) {
        expect(
          db.sql(`select '${category}'::text = any('{${CATEGORIES.join(",")}}');`),
        ).toBe("t");
      }
      expect(() =>
        db.sql(
          `insert into invoice_disputes (invoice_id, raised_by, grounds, category)
           values ('${INV_3}', '${AGENT_A}', 'synthetic', 'D6_vibes');`,
        ),
      ).toThrow(/check constraint/);
    });

    it("status outside ('open','conceded','rejected') is rejected", () => {
      expect(() =>
        db.sql(
          `insert into invoice_disputes (invoice_id, raised_by, grounds, status)
           values ('${INV_3}', '${AGENT_A}', 'synthetic', 'escalated');`,
        ),
      ).toThrow(/check constraint/);
    });

    it("unique(invoice_id): a second dispute for the same invoice is a unique violation", () => {
      expect(() =>
        db.sql(
          `insert into invoice_disputes (invoice_id, raised_by, grounds)
           values ('${INV_1}', '${AGENT_A}', 'second bite at the cherry');`,
        ),
      ).toThrow(/duplicate key|unique constraint/);
    });
  });

  // =========================================================================
  describe("decide_invoice_dispute() — the only mutation path", () => {
    it("decide_invoice_dispute() is SECURITY DEFINER", () => {
      expect(
        db.sql(
          `select prosecdef from pg_proc
           where proname = 'decide_invoice_dispute'
             and pronamespace = 'public'::regnamespace;`,
        ),
      ).toBe("t");
    });

    it("blocks a direct UPDATE outside the function, even as superuser", () => {
      expect(() =>
        db.sql(`update invoice_disputes set status = 'conceded' where id = '${DISPUTE_1}';`),
      ).toThrow(/append-only table: UPDATE blocked on invoice_disputes/);
      expect(
        db.sql(`select status from invoice_disputes where id = '${DISPUTE_1}';`),
      ).toBe("open");
    });

    it("blocks DELETE always, even as superuser (append-only)", () => {
      expect(() =>
        db.sql(`delete from invoice_disputes where id = '${DISPUTE_1}';`),
      ).toThrow(/append-only/);
    });

    it("rejects a decision outside ('conceded','rejected')", () => {
      expect(() => decide(DISPUTE_1, "upheld", "D1_source", "synthetic")).toThrow();
      expect(
        db.sql(`select status from invoice_disputes where id = '${DISPUTE_1}';`),
      ).toBe("open");
    });

    it("requires a non-empty reason for BOTH decisions (concede 'in writing; once')", () => {
      expect(() => decide(DISPUTE_1, "conceded", "D2_fell_through", "")).toThrow(
        /decision reason is required/,
      );
      expect(() => decide(DISPUTE_1, "rejected", "D1_source", "")).toThrow(
        /decision reason is required/,
      );
    });

    it("requires a playbook category", () => {
      expect(() =>
        decide(DISPUTE_1, "conceded", null, "Genuine fall-through, nothing was due"),
      ).toThrow(/playbook category is required/);
    });

    it("conceded end-to-end: stamps the dispute and cancels the invoice (dispute_resolved-upheld)", () => {
      decide(
        DISPUTE_1,
        "conceded",
        "D2_fell_through",
        "Genuine fall-through; concede fast, in writing, once (clause 7.2)",
      );
      expect(
        db.sql(
          `select status = 'conceded' and decided_by = '${ADMIN}'
              and decided_at is not null and category = 'D2_fell_through'
              and decision_reason like 'Genuine fall-through%'
           from invoice_disputes where id = '${DISPUTE_1}';`,
        ),
      ).toBe("t");
      expect(invoiceState(INV_1)).toBe("cancelled");
    });

    it("deciding an already-decided dispute fails", () => {
      expect(() =>
        decide(DISPUTE_1, "rejected", "D1_source", "second-guessing the concession"),
      ).toThrow(/already decided/);
      expect(
        db.sql(`select status from invoice_disputes where id = '${DISPUTE_1}';`),
      ).toBe("conceded");
      expect(invoiceState(INV_1)).toBe("cancelled");
    });

    it("rejected end-to-end: invoice resumes at state_before_dispute (clock restarts where it stopped)", () => {
      expect(invoiceState(INV_2)).toBe("disputed");
      decide(
        DISPUTE_2,
        "rejected",
        "D1_source",
        "Rebuttal window expired with no pre-dated same-property evidence (clause 3.3)",
      );
      expect(
        db.sql(
          `select status = 'rejected' and decided_by = '${ADMIN}'
              and decided_at is not null and category = 'D1_source'
           from invoice_disputes where id = '${DISPUTE_2}';`,
        ),
      ).toBe("t");
      expect(invoiceState(INV_2)).toBe("overdue");
    });
  });

  // =========================================================================
  describe("row level security", () => {
    it("foreign agent INSERT is blocked (not their invoice / not their sub)", () => {
      expect(() =>
        asUser(
          AGENT_B,
          `insert into invoice_disputes (invoice_id, raised_by, grounds)
           values ('${INV_3}', '${AGENT_B}', 'forged dispute')`,
        ),
      ).toThrow(/row-level security|permission denied/);
      expect(() =>
        asUser(
          AGENT_B,
          `insert into invoice_disputes (invoice_id, raised_by, grounds)
           values ('${INV_3}', '${AGENT_A}', 'spoofed raised_by')`,
        ),
      ).toThrow(/row-level security|permission denied/);
    });

    it("agent INSERTs a dispute on their own invoice with raised_by = auth.uid()", () => {
      asUser(
        AGENT_A,
        `insert into invoice_disputes (invoice_id, raised_by, grounds)
         values ('${INV_3}', '${AGENT_A}', 'The fee is too high for a £62,000 flat')`,
      );
      expect(
        db.sql(`select count(*) from invoice_disputes where invoice_id = '${INV_3}';`),
      ).toBe("1");
    });

    it("agent SELECTs own disputes only, via the invoice join (org_agent_id = auth.uid())", () => {
      const total = db.sql(`select count(*) from invoice_disputes;`);
      expect(Number(total)).toBeGreaterThan(0);
      expect(asUser(AGENT_A, `select count(*) from invoice_disputes`)).toBe(total);
      expect(asUser(AGENT_B, `select count(*) from invoice_disputes`)).toBe("0");
    });

    it("admin SELECTs all disputes (profiles.is_admin)", () => {
      expect(asUser(ADMIN, `select count(*) from invoice_disputes`)).toBe(
        db.sql(`select count(*) from invoice_disputes;`),
      );
    });

    it("no authenticated UPDATE or DELETE path exists", () => {
      expect(() =>
        asUser(
          AGENT_A,
          `update invoice_disputes set status = 'conceded' where invoice_id = '${INV_3}'`,
        ),
      ).toThrow(/permission denied|row-level security|append-only/);
      expect(() =>
        asUser(
          AGENT_A,
          `delete from invoice_disputes where invoice_id = '${INV_3}'`,
        ),
      ).toThrow(/permission denied|row-level security|append-only/);
    });
  });
});
