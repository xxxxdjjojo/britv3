/**
 * RED-phase contract tests for
 * `supabase/migrations/20260612000004_truedeed_billing.sql`
 * (Truedeed Phase 4 — GoCardless billing: mandate columns, VAT invoices,
 *  sequential numbering, invoice_events ledger, dunning state machine).
 *
 * The migration does NOT exist yet: `beforeAll` fails (ENOENT) when
 * `sqlFile()` cannot read it. Everything below this file's `beforeAll` is the
 * contract the migration must satisfy. Phases 1–3
 * (20260612000000_truedeed_introductions.sql,
 *  20260612000002_truedeed_outcomes.sql,
 *  20260612000003_truedeed_ppd.sql) are applied first and must keep passing.
 *
 * Contract source: docs/truedeed/billing-flow-gocardless.md §1–§2 and §5.
 *  - agent_agency_profiles gains gocardless_customer_id text,
 *    gocardless_mandate_id text, mandate_status text check
 *    ('pending','submitted','active','failed','cancelled','expired') null,
 *    billing_suspended_at timestamptz. The harness stub LACKS
 *    agent_agency_profiles, so this file creates a minimal stub
 *    (id uuid pk, agent_id uuid) in prerequisites-extension SQL FIRST —
 *    before any migration — so the migration's `alter table if exists`
 *    statements apply and are testable.
 *  - invoices: uuid pk; invoice_number text not null unique; org_agent_id
 *    uuid not null; invoice_candidate_id uuid unique → invoice_candidates;
 *    introduction_id uuid → introductions; net/vat/gross_pence bigint not
 *    null; issued_at default now(); due_at not null; state check
 *    ('open','collecting','paid','overdue','final_notice','suspended',
 *     'disputed','charged_back','cancelled') default 'open';
 *    state_before_dispute; gocardless_payment_id; paid_at.
 *  - Sequential VAT numbering (§2.1): sequence + SECURITY DEFINER
 *    next_invoice_number() → 'TD-2026-NNNN' (zero-padded 4); trigger fills
 *    invoice_number on insert when null.
 *  - invoice_events: bigint identity pk, invoice_id fk, event_type not null,
 *    detail jsonb default '{}', created_at default now(); append-only
 *    (truedeed_forbid_mutation, even superuser).
 *  - State changes ONLY via SECURITY DEFINER transition_invoice(p_id,
 *    p_event, p_days_overdue default null, p_actor default null) — the §5
 *    dunning lattice. Direct UPDATE of invoices.state →
 *    'state changes only via transition_invoice'; other-column updates pass.
 *  - RLS: agent SELECT own invoices (org_agent_id = auth.uid()); admin
 *    SELECT all; no authenticated INSERT. invoice_events: SELECT via the
 *    invoice join only, no authenticated INSERT.
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
const MIGRATION_PATH = fileURLToPath(
  new URL(
    "../supabase/migrations/20260612000004_truedeed_billing.sql",
    import.meta.url,
  ),
);

// ===== synthetic fixtures (no real data) =====
// Second uuid group is '4444' so no id collides with the Phase 1 ('0000'),
// Phase 2 ('2222') or Phase 3 ('3333') test files if suites ever share a
// container.
const AGENT_A = "aaaaaaaa-4444-4000-8000-000000000001"; // the billed agent
const AGENT_B = "aaaaaaaa-4444-4000-8000-000000000002"; // unrelated agent
const APPLICANT = "bbbbbbbb-4444-4000-8000-000000000001";
const ADMIN = "cccccccc-4444-4000-8000-000000000001";
const BRANCH_A = "dddddddd-4444-4000-8000-000000000001";
const PROFILE_A = "dddddddd-4444-4000-8000-0000000000aa"; // agency profile stub row

const USERS = [AGENT_A, AGENT_B, APPLICANT, ADMIN];

const PROPERTY_1 = "eeeeeeee-4444-4000-8000-000000000001";
const LISTING_1 = "ffffffff-4444-4000-8000-000000000001";
const INTRO_1 = "99999999-4444-4000-8000-000000000001";

// approved invoice_candidates (one per invoice — invoice_candidate_id is unique)
const candidateId = (n: number) => `88888888-4444-4000-8000-00000000000${n}`;

// invoices: INV_1 walks the full happy/dunning lattice then charges back;
// INV_2 = dispute-rejected path; INV_3 = dispute-upheld path.
const INV_1 = "dddddddd-4444-4000-8000-000000000101";
const INV_2 = "dddddddd-4444-4000-8000-000000000102";
const INV_3 = "dddddddd-4444-4000-8000-000000000103";

const INVOICE_NUMBER_RE = /^TD-\d{4}-\d{4}$/;

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

function invoiceState(invoiceId: string): string {
  return db.sql(`select state from invoices where id = '${invoiceId}';`);
}

/**
 * Prerequisites-extension: the harness stub lacks agent_agency_profiles, but
 * the migrations alter it with `alter table if exists`. Create a minimal stub
 * FIRST (before Phase 1) so every alter applies and the new billing columns
 * are real and testable.
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

/** Phase 4 seeds (service path — billing:create-invoice worker, §2). */
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

describe.skipIf(!process.env.RUN_DB_TESTS)("truedeed billing migration", () => {
  beforeAll(() => {
    db = startPostgres();
    applyPrerequisites(db);
    createAgencyProfilesStub(); // BEFORE migrations — see function docstring.
    seedExistingSchemaRows();
    db.sqlFile(PHASE1_MIGRATION_PATH); // Phase 1 exists — must apply cleanly.
    seedIntroductions();
    db.sqlFile(PHASE2_MIGRATION_PATH); // Phase 2 exists — must apply cleanly.
    db.sqlFile(PHASE3_MIGRATION_PATH); // Phase 3 exists — must apply cleanly.
    // RED: the Phase 4 migration file does not exist yet — this line is the failure.
    db.sqlFile(MIGRATION_PATH);
    seedBillingRows();
  });

  afterAll(() => {
    db?.stop();
  });

  // =========================================================================
  describe("schema", () => {
    it.each(["invoices", "invoice_events"] as const)("creates public.%s", (table) => {
      expect(db.sql(`select to_regclass('public.${table}') is not null;`)).toBe("t");
    });

    it("agent_agency_profiles gains the four GoCardless billing columns (§1)", () => {
      expect(
        db.sql(
          `select count(*) from information_schema.columns
           where table_schema = 'public' and table_name = 'agent_agency_profiles'
             and ((column_name in ('gocardless_customer_id', 'gocardless_mandate_id',
                                   'mandate_status')
                   and data_type = 'text')
               or (column_name = 'billing_suspended_at'
                   and data_type = 'timestamp with time zone'));`,
        ),
      ).toBe("4");
    });

    it("mandate_status accepts the GoCardless lifecycle states and rejects others", () => {
      db.sql(
        `update agent_agency_profiles
         set gocardless_customer_id = 'CU-synthetic',
             gocardless_mandate_id = 'MD-synthetic',
             mandate_status = 'active'
         where id = '${PROFILE_A}';`,
      );
      expect(
        db.sql(`select mandate_status from agent_agency_profiles where id = '${PROFILE_A}';`),
      ).toBe("active");
      expect(() =>
        db.sql(
          `update agent_agency_profiles set mandate_status = 'dormant'
           where id = '${PROFILE_A}';`,
        ),
      ).toThrow(/check constraint/);
    });

    it("invoices defaults: state='open', issued_at stamped, paid_at null", () => {
      expect(
        db.sql(
          `select state = 'open' and issued_at is not null and paid_at is null
           from invoices where id = '${INV_1}';`,
        ),
      ).toBe("t");
    });

    it("invoices: net/vat/gross_pence and due_at are NOT NULL", () => {
      expect(() =>
        db.sql(
          `insert into invoices (org_agent_id, vat_pence, gross_pence, due_at)
           values ('${AGENT_A}', 4980, 29880, now() + interval '14 days');`,
        ),
      ).toThrow(/not-null constraint/);
      expect(() =>
        db.sql(
          `insert into invoices (org_agent_id, net_pence, vat_pence, gross_pence)
           values ('${AGENT_A}', 24900, 4980, 29880);`,
        ),
      ).toThrow(/not-null constraint/);
    });

    it("invoices rejects a state outside the §5 lattice", () => {
      expect(() =>
        db.sql(
          `insert into invoices (org_agent_id, net_pence, vat_pence, gross_pence, due_at, state)
           values ('${AGENT_A}', 24900, 4980, 29880, now() + interval '14 days', 'written_off');`,
        ),
      ).toThrow(/check constraint/);
    });

    it("invoice_candidate_id is unique — one invoice per approved candidate", () => {
      expect(() =>
        db.sql(
          `insert into invoices
             (org_agent_id, invoice_candidate_id, net_pence, vat_pence, gross_pence, due_at)
           values
             ('${AGENT_A}', '${candidateId(1)}', 24900, 4980, 29880,
              now() + interval '14 days');`,
        ),
      ).toThrow(/duplicate key|unique constraint/);
    });
  });

  // =========================================================================
  describe("sequential VAT invoice numbering (§2.1)", () => {
    it("next_invoice_number() is SECURITY DEFINER", () => {
      expect(
        db.sql(
          `select prosecdef from pg_proc
           where proname = 'next_invoice_number'
             and pronamespace = 'public'::regnamespace;`,
        ),
      ).toBe("t");
    });

    it("two consecutive calls match TD-YYYY-NNNN and differ by exactly 1", () => {
      const first = db.sql(`select next_invoice_number();`);
      const second = db.sql(`select next_invoice_number();`);
      expect(first).toMatch(INVOICE_NUMBER_RE);
      expect(second).toMatch(INVOICE_NUMBER_RE);
      const serial = (value: string) => Number(value.split("-")[2]);
      expect(serial(second) - serial(first)).toBe(1);
    });

    it("trigger fills invoice_number on insert when null — seeded invoices have distinct TD numbers", () => {
      for (const invoiceId of [INV_1, INV_2, INV_3]) {
        expect(
          db.sql(`select invoice_number from invoices where id = '${invoiceId}';`),
        ).toMatch(INVOICE_NUMBER_RE);
      }
      expect(
        db.sql(`select count(distinct invoice_number) from invoices;`),
      ).toBe(db.sql(`select count(*) from invoices;`));
    });
  });

  // =========================================================================
  describe("invoice_events (append-only evidence ledger, §5)", () => {
    it("id is a bigint identity column; detail defaults '{}'; created_at stamped", () => {
      expect(
        db.sql(
          `select count(*) from information_schema.columns
           where table_schema = 'public' and table_name = 'invoice_events'
             and column_name = 'id' and data_type = 'bigint'
             and is_identity = 'YES';`,
        ),
      ).toBe("1");
      db.sql(
        `insert into invoice_events (invoice_id, event_type)
         values ('${INV_1}', 'email_sent');`,
      );
      expect(
        db.sql(
          `select detail = '{}'::jsonb and created_at is not null
           from invoice_events
           where invoice_id = '${INV_1}' and event_type = 'email_sent';`,
        ),
      ).toBe("t");
    });

    it("blocks UPDATE even as superuser (append-only)", () => {
      expect(() =>
        db.sql(`update invoice_events set event_type = 'tampered' where invoice_id = '${INV_1}';`),
      ).toThrow(/append-only/);
    });

    it("blocks DELETE even as superuser (append-only)", () => {
      expect(() =>
        db.sql(`delete from invoice_events where invoice_id = '${INV_1}';`),
      ).toThrow(/append-only/);
    });
  });

  // =========================================================================
  describe("dunning state machine — transition_invoice() (§2 timeline + §5)", () => {
    it("transition_invoice() is SECURITY DEFINER", () => {
      expect(
        db.sql(
          `select prosecdef from pg_proc
           where proname = 'transition_invoice'
             and pronamespace = 'public'::regnamespace;`,
        ),
      ).toBe("t");
    });

    it("walks open → collecting → overdue → final_notice → suspended → paid, logging one event each", () => {
      const eventsBefore = Number(
        db.sql(`select count(*) from invoice_events where invoice_id = '${INV_1}';`),
      );

      transition(INV_1, "collection_started"); // I+14: DD collection attempt
      expect(invoiceState(INV_1)).toBe("collecting");

      transition(INV_1, "payment_failed"); // dunning day 0
      expect(invoiceState(INV_1)).toBe("overdue");

      transition(INV_1, "day_tick", 14); // D+14: formal notice
      expect(invoiceState(INV_1)).toBe("final_notice");

      transition(INV_1, "day_tick", 21); // D+21: clause 11.1(a) suspension
      expect(invoiceState(INV_1)).toBe("suspended");

      transition(INV_1, "payment_confirmed"); // payment received any time
      expect(
        db.sql(`select state = 'paid' and paid_at is not null from invoices where id = '${INV_1}';`),
      ).toBe("t");

      expect(
        Number(db.sql(`select count(*) from invoice_events where invoice_id = '${INV_1}';`)),
      ).toBe(eventsBefore + 5);
    });

    it("rejects an illegal transition: payment_failed on a paid invoice", () => {
      expect(() => transition(INV_1, "payment_failed")).toThrow(
        /invalid dunning transition/,
      );
      expect(invoiceState(INV_1)).toBe("paid");
    });

    it("charged_back: paid → charged_back (clause 8.6 — debt survives, ops-only path)", () => {
      const eventsBefore = Number(
        db.sql(`select count(*) from invoice_events where invoice_id = '${INV_1}';`),
      );
      transition(INV_1, "charged_back");
      expect(invoiceState(INV_1)).toBe("charged_back");
      expect(
        Number(db.sql(`select count(*) from invoice_events where invoice_id = '${INV_1}';`)),
      ).toBe(eventsBefore + 1);
    });

    it("dispute freeze + rejected resolution: overdue → disputed (state_before_dispute stored) → overdue", () => {
      transition(INV_2, "collection_started");
      transition(INV_2, "payment_failed");
      transition(INV_2, "dispute_raised");
      expect(
        db.sql(
          `select state = 'disputed' and state_before_dispute = 'overdue'
           from invoices where id = '${INV_2}';`,
        ),
      ).toBe("t");

      transition(INV_2, "dispute_resolved-rejected"); // clock resumes where it stopped
      expect(invoiceState(INV_2)).toBe("overdue");
    });

    it("dispute upheld: disputed → cancelled", () => {
      transition(INV_3, "collection_started");
      transition(INV_3, "payment_failed");
      transition(INV_3, "dispute_raised");
      expect(invoiceState(INV_3)).toBe("disputed");

      transition(INV_3, "dispute_resolved-upheld");
      expect(invoiceState(INV_3)).toBe("cancelled");
    });

    it("blocks a direct UPDATE of invoices.state outside the function", () => {
      expect(() =>
        db.sql(`update invoices set state = 'paid' where id = '${INV_2}';`),
      ).toThrow(/state changes only via transition_invoice/);
      expect(invoiceState(INV_2)).toBe("overdue");
    });

    it("allows direct UPDATE of non-state columns (e.g. gocardless_payment_id)", () => {
      db.sql(
        `update invoices set gocardless_payment_id = 'PM-synthetic-1'
         where id = '${INV_1}';`,
      );
      expect(
        db.sql(`select gocardless_payment_id from invoices where id = '${INV_1}';`),
      ).toBe("PM-synthetic-1");
    });
  });

  // =========================================================================
  describe("row level security", () => {
    it("agent SELECTs own invoices only (org_agent_id = auth.uid())", () => {
      expect(asUser(AGENT_A, `select count(*) from invoices`)).toBe("3");
      expect(asUser(AGENT_B, `select count(*) from invoices`)).toBe("0");
    });

    it("admin SELECTs all invoices (profiles.is_admin)", () => {
      expect(asUser(ADMIN, `select count(*) from invoices`)).toBe(
        db.sql(`select count(*) from invoices;`),
      );
    });

    it("rejects INSERT into invoices as authenticated — invoices are worker-created only", () => {
      expect(() =>
        asUser(
          AGENT_A,
          `insert into invoices (org_agent_id, net_pence, vat_pence, gross_pence, due_at)
           values ('${AGENT_A}', 24900, 4980, 29880, now() + interval '14 days')`,
        ),
      ).toThrow(/row-level security|permission denied/);
    });

    it("invoice_events: agent/admin SELECT via the invoice join; no authenticated INSERT", () => {
      const total = db.sql(`select count(*) from invoice_events;`);
      expect(Number(total)).toBeGreaterThan(0);
      expect(asUser(AGENT_A, `select count(*) from invoice_events`)).toBe(total);
      expect(asUser(ADMIN, `select count(*) from invoice_events`)).toBe(total);
      expect(asUser(AGENT_B, `select count(*) from invoice_events`)).toBe("0");
      expect(() =>
        asUser(
          AGENT_A,
          `insert into invoice_events (invoice_id, event_type)
           values ('${INV_1}', 'forged_event')`,
        ),
      ).toThrow(/row-level security|permission denied/);
    });
  });
});
