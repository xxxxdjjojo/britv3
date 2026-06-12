/**
 * RED-phase contract tests for
 * `supabase/migrations/20260612000002_truedeed_outcomes.sql`
 * (Truedeed Phase 2 — reported outcomes + invoice candidates; spec §2 + §5).
 *
 * The migration does NOT exist yet: `beforeAll` fails (ENOENT) when
 * `sqlFile()` cannot read it. Everything below this file's `beforeAll` is the
 * contract the migration must satisfy. Phase 1
 * (20260612000000_truedeed_introductions.sql) is applied first and must keep
 * passing untouched.
 *
 * Idioms the migration must match (also asserted below):
 *  - append-only: same truedeed_forbid_mutation pattern as Phase 1 —
 *    'append-only table: % blocked on %' — fires even for superuser.
 *    reported_outcomes: UPDATE and DELETE both forbidden.
 *    invoice_candidates: UPDATE forbidden without the review function's
 *    transaction-local GUC; DELETE forbidden always.
 *  - check:   reported_outcomes outcome='completed' requires completion_date
 *             AND agreed_price_pence NOT NULL (table check constraint).
 *  - review:  status transitions ONLY via SECURITY DEFINER
 *             review_invoice_candidate(p_id, p_reviewer, p_new_status, p_note).
 *             Allowed: pending_review→approved|rejected,
 *                      on_hold_branch_query→pending_review.
 *             Errors: 'review note is required' (reject w/ empty/null note),
 *                     'invalid transition' (anything else).
 *  - RLS JWT: begin; set local role authenticated;
 *             set local request.jwt.claims = '{"sub":"<uuid>"}'; …; commit;
 *  - RLS:     reported_outcomes — branch-side INSERT (reported_by = auth.uid()
 *             AND introduction membership, same shape as Phase 1's
 *             rebuttal_insert but with NO deadline condition); branch-side
 *             SELECT; admin SELECT (profiles.is_admin).
 *             invoice_candidates — admin SELECT only; INSERT is service-role
 *             only (default-deny for authenticated).
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
const MIGRATION_PATH = fileURLToPath(
  new URL(
    "../supabase/migrations/20260612000002_truedeed_outcomes.sql",
    import.meta.url,
  ),
);

// ===== synthetic fixtures (no real data) =====
// Second uuid group is '2222' so no id collides with the Phase 1 test file
// (which uses '0000') if both suites ever share a container.
const AGENT_A = "aaaaaaaa-2222-4000-8000-000000000001"; // owns every listing/introduction
const AGENT_B = "aaaaaaaa-2222-4000-8000-000000000002"; // unrelated agent
const APPLICANT = "bbbbbbbb-2222-4000-8000-000000000001";
const ADMIN = "cccccccc-2222-4000-8000-000000000001";
const BRANCH_A = "dddddddd-2222-4000-8000-000000000001";

const USERS = [AGENT_A, AGENT_B, APPLICANT, ADMIN];

const propertyId = (n: number) => `eeeeeeee-2222-4000-8000-00000000000${n}`;
const listingId = (n: number) => `ffffffff-2222-4000-8000-00000000000${n}`;

const INTRO_1 = "99999999-2222-4000-8000-000000000001"; // service-path outcome seeds
const INTRO_2 = "99999999-2222-4000-8000-000000000002"; // branch-agent RLS insert target

const INTROS: ReadonlyArray<{ id: string; listing: number; occurredAt: string }> = [
  { id: INTRO_1, listing: 1, occurredAt: "2026-06-01T11:00:00Z" },
  { id: INTRO_2, listing: 2, occurredAt: "2026-06-01T11:01:00Z" },
];

const OUTCOME_1 = "88888888-2222-4000-8000-000000000001"; // append-only target

const IC_APPROVE = "77777777-2222-4000-8000-000000000001"; // pending → approved
const IC_REJECT = "77777777-2222-4000-8000-000000000002"; // pending → rejected (with note)
const IC_NONOTE = "77777777-2222-4000-8000-000000000003"; // reject without note → error
const IC_HOLD = "77777777-2222-4000-8000-000000000004"; // on_hold_branch_query → pending
const IC_GUARD = "77777777-2222-4000-8000-000000000005"; // direct UPDATE/DELETE guard target

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
  for (const intro of INTROS) {
    db.sql(`insert into public.properties (id, address_line1, postcode) values ('${propertyId(intro.listing)}', '${intro.listing} Synthetic Street', 'SW1A 1AA');`);
    db.sql(`insert into public.listings (id, property_id, user_id, status) values ('${listingId(intro.listing)}', '${propertyId(intro.listing)}', '${AGENT_A}', 'active');`);
  }
}

/** Service-path inserts (superuser stands in for service_role). */
function seedIntroductions(): void {
  // listings.branch_id exists only after the Phase 1 migration.
  db.sql(`update public.listings set branch_id = '${BRANCH_A}';`);
  for (const intro of INTROS) {
    db.sql(
      `insert into public.introductions
         (id, applicant_id, applicant_name, applicant_email, listing_id,
          branch_id, agent_id, first_contact_type, occurred_at, tail_expires_at)
       values
         ('${intro.id}', '${APPLICANT}', 'Synthetic Applicant',
          'synthetic@example.test', '${listingId(intro.listing)}',
          '${BRANCH_A}', '${AGENT_A}', 'enquiry',
          timestamptz '${intro.occurredAt}',
          timestamptz '${intro.occurredAt}' + interval '6 months');`,
    );
  }
}

/** Phase 2 seeds (service path — RLS denies authenticated, asserted below). */
function seedOutcomesAndCandidates(): void {
  db.sql(
    `insert into public.reported_outcomes (id, introduction_id, reported_by, outcome)
     values ('${OUTCOME_1}', '${INTRO_1}', '${AGENT_A}', 'offer_accepted');`,
  );
  for (const candidateId of [IC_APPROVE, IC_REJECT, IC_NONOTE, IC_GUARD]) {
    db.sql(
      `insert into public.invoice_candidates (id, source, introduction_id, reported_outcome_id)
       values ('${candidateId}', 'agent_report', '${INTRO_1}', '${OUTCOME_1}');`,
    );
  }
  db.sql(
    `insert into public.invoice_candidates (id, source, introduction_id, status, hold_expires_at)
     values ('${IC_HOLD}', 'audit_match', '${INTRO_1}', 'on_hold_branch_query',
             now() + interval '10 days');`,
  );
}

describe.skipIf(!process.env.RUN_DB_TESTS)("truedeed outcomes migration", () => {
  beforeAll(() => {
    db = startPostgres();
    applyPrerequisites(db);
    seedExistingSchemaRows();
    db.sqlFile(PHASE1_MIGRATION_PATH); // Phase 1 exists — must apply cleanly.
    seedIntroductions();
    // RED: the Phase 2 migration file does not exist yet — this line is the failure.
    db.sqlFile(MIGRATION_PATH);
    seedOutcomesAndCandidates();
  });

  afterAll(() => {
    db?.stop();
  });

  // =========================================================================
  describe("schema", () => {
    it.each(["reported_outcomes", "invoice_candidates"])(
      "creates public.%s",
      (table) => {
        expect(db.sql(`select to_regclass('public.${table}') is not null;`)).toBe("t");
      },
    );

    it("invoice_candidates defaults: £249 + VAT, status pending_review", () => {
      expect(
        db.sql(
          `select amount_pence = 24900 and vat_pence = 4980 and status = 'pending_review'
           from invoice_candidates where id = '${IC_APPROVE}';`,
        ),
      ).toBe("t");
    });
  });

  // =========================================================================
  describe("completed-outcome check constraint", () => {
    it("rejects outcome='completed' without completion_date and agreed_price_pence", () => {
      expect(() =>
        db.sql(
          `insert into reported_outcomes (introduction_id, reported_by, outcome)
           values ('${INTRO_1}', '${AGENT_A}', 'completed');`,
        ),
      ).toThrow(/check constraint/);
    });

    it("accepts outcome='completed' with both fields populated", () => {
      db.sql(
        `insert into reported_outcomes
           (introduction_id, reported_by, outcome, completion_date, agreed_price_pence)
         values ('${INTRO_1}', '${AGENT_A}', 'completed', date '2026-06-10', 35000000);`,
      );
      expect(
        db.sql(
          `select count(*) from reported_outcomes
           where introduction_id = '${INTRO_1}' and outcome = 'completed';`,
        ),
      ).toBe("1");
    });
  });

  // =========================================================================
  describe("append-only reported_outcomes", () => {
    it("rejects UPDATE even for superuser", () => {
      expect(() =>
        db.sql(`update reported_outcomes set outcome = 'fell_through' where id = '${OUTCOME_1}';`),
      ).toThrow(/append-only/);
    });

    it("rejects DELETE even for superuser", () => {
      expect(() =>
        db.sql(`delete from reported_outcomes where id = '${OUTCOME_1}';`),
      ).toThrow(/append-only/);
    });
  });

  // =========================================================================
  describe("invoice_candidates guard", () => {
    it("rejects a direct status UPDATE outside review_invoice_candidate", () => {
      expect(() =>
        db.sql(`update invoice_candidates set status = 'approved' where id = '${IC_GUARD}';`),
      ).toThrow(/append-only table: UPDATE blocked on invoice_candidates/);
    });

    it("rejects DELETE always", () => {
      expect(() =>
        db.sql(`delete from invoice_candidates where id = '${IC_GUARD}';`),
      ).toThrow(/append-only/);
    });
  });

  // =========================================================================
  describe("review_invoice_candidate", () => {
    it("allows pending_review → approved and stamps the reviewer", () => {
      db.sql(
        `select review_invoice_candidate('${IC_APPROVE}', '${ADMIN}', 'approved', 'introduction corroborated');`,
      );
      expect(
        db.sql(
          `select status = 'approved'
              and reviewed_by = '${ADMIN}'
              and reviewed_at is not null
              and review_note = 'introduction corroborated'
           from invoice_candidates where id = '${IC_APPROVE}';`,
        ),
      ).toBe("t");
    });

    it("allows pending_review → rejected when a note is supplied", () => {
      db.sql(
        `select review_invoice_candidate('${IC_REJECT}', '${ADMIN}', 'rejected', 'different buyer confirmed by branch');`,
      );
      expect(
        db.sql(`select status from invoice_candidates where id = '${IC_REJECT}';`),
      ).toBe("rejected");
    });

    it("rejects rejection without a note: 'review note is required'", () => {
      expect(() =>
        db.sql(`select review_invoice_candidate('${IC_NONOTE}', '${ADMIN}', 'rejected', null);`),
      ).toThrow(/review note is required/i);
      expect(() =>
        db.sql(`select review_invoice_candidate('${IC_NONOTE}', '${ADMIN}', 'rejected', '');`),
      ).toThrow(/review note is required/i);
    });

    it("rejects approved → pending_review: 'invalid transition'", () => {
      expect(() =>
        db.sql(`select review_invoice_candidate('${IC_APPROVE}', '${ADMIN}', 'pending_review', 'undo');`),
      ).toThrow(/invalid transition/i);
    });

    it("allows on_hold_branch_query → pending_review", () => {
      db.sql(
        `select review_invoice_candidate('${IC_HOLD}', '${ADMIN}', 'pending_review', 'branch replied');`,
      );
      expect(
        db.sql(`select status from invoice_candidates where id = '${IC_HOLD}';`),
      ).toBe("pending_review");
    });
  });

  // =========================================================================
  describe("row level security", () => {
    it("branch agent inserts an outcome for their own introduction", () => {
      asUser(
        AGENT_A,
        `insert into reported_outcomes (introduction_id, reported_by, outcome)
         values ('${INTRO_2}', '${AGENT_A}', 'offer_accepted')`,
      );
      expect(
        db.sql(`select count(*) from reported_outcomes where introduction_id = '${INTRO_2}';`),
      ).toBe("1");
    });

    it("rejects an outcome from an agent outside the branch", () => {
      expect(() =>
        asUser(
          AGENT_B,
          `insert into reported_outcomes (introduction_id, reported_by, outcome)
           values ('${INTRO_1}', '${AGENT_B}', 'offer_accepted')`,
        ),
      ).toThrow(/row-level security/);
    });

    it("rejects an outcome reported by the applicant", () => {
      expect(() =>
        asUser(
          APPLICANT,
          `insert into reported_outcomes (introduction_id, reported_by, outcome)
           values ('${INTRO_1}', '${APPLICANT}', 'offer_accepted')`,
        ),
      ).toThrow(/row-level security/);
    });

    it("branch side sees its outcomes; an unrelated agent sees zero", () => {
      expect(Number(asUser(AGENT_A, `select count(*) from reported_outcomes`))).toBeGreaterThan(0);
      expect(asUser(AGENT_B, `select count(*) from reported_outcomes`)).toBe("0");
    });

    it("admin sees invoice_candidates", () => {
      expect(asUser(ADMIN, `select count(*) from invoice_candidates`)).toBe("5");
    });

    it("a non-admin agent sees zero invoice_candidates rows", () => {
      expect(asUser(AGENT_A, `select count(*) from invoice_candidates`)).toBe("0");
    });

    it("rejects INSERT into invoice_candidates as authenticated (service-role only)", () => {
      expect(() =>
        asUser(
          ADMIN,
          `insert into invoice_candidates (source, introduction_id)
           values ('agent_report', '${INTRO_1}')`,
        ),
      ).toThrow(/row-level security|permission denied/);
    });
  });
});
