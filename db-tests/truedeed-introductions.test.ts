/**
 * RED-phase contract tests for
 * `supabase/migrations/20260612000000_truedeed_introductions.sql`
 * (Truedeed Phase 1 — introductions ledger; design doc §3).
 *
 * The migration does NOT exist yet: `beforeAll` fails when `sqlFile()` cannot
 * read it. Everything below this file's `beforeAll` is the contract the
 * migration must satisfy.
 *
 * Idioms the migration must match (also asserted below):
 *  - hash:    row_hash = encode(sha256(convert_to(coalesce(prev_hash,'genesis')
 *             || id::text || applicant_id::text || listing_id::text
 *             || first_contact_type
 *             || to_char(occurred_at,'YYYY-MM-DD"T"HH24:MI:SS.US'),'utf8')),'hex')
 *             (sessions run with timezone=UTC)
 *  - errors:  'append-only' (forbid_mutation), 'already notified'
 *             (mark_introduction_notified re-call), 'invalid transition'
 *             (transition_introduction)
 *  - RLS JWT: begin; set local role authenticated;
 *             set local request.jwt.claims = '{"sub":"<uuid>"}'; …; commit;
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { fileURLToPath } from "node:url";
import { startPostgres, applyPrerequisites, type DbHarness } from "./harness";

const MIGRATION_PATH = fileURLToPath(
  new URL(
    "../supabase/migrations/20260612000000_truedeed_introductions.sql",
    import.meta.url,
  ),
);

// ===== synthetic fixtures (no real data) =====
const AGENT_A = "aaaaaaaa-0000-4000-8000-000000000001"; // owns every listing/introduction
const AGENT_B = "aaaaaaaa-0000-4000-8000-000000000002"; // unrelated agent
const TEAMMATE = "aaaaaaaa-0000-4000-8000-000000000003"; // member of BRANCH_A only
const APPLICANT = "bbbbbbbb-0000-4000-8000-000000000001";
const APPLICANT_SCRUB = "bbbbbbbb-0000-4000-8000-000000000002"; // GDPR-erased applicant
const ADMIN = "cccccccc-0000-4000-8000-000000000001";
const BRANCH_A = "dddddddd-0000-4000-8000-000000000001";

const USERS = [AGENT_A, AGENT_B, TEAMMATE, APPLICANT, APPLICANT_SCRUB, ADMIN];

// One listing per introduction (introductions are unique per applicant+listing).
const propertyId = (n: number) => `eeeeeeee-0000-4000-8000-00000000000${n}`;
const listingId = (n: number) => `ffffffff-0000-4000-8000-00000000000${n}`;

const INTRO_1 = "99999999-0000-4000-8000-000000000001"; // chain head; notified (future deadline)
const INTRO_2 = "99999999-0000-4000-8000-000000000002"; // notified with past deadline
const INTRO_3 = "99999999-0000-4000-8000-000000000003"; // tamper-detection target
const INTRO_SM1 = "99999999-0000-4000-8000-000000000004"; // state machine: → completed
const INTRO_SM2 = "99999999-0000-4000-8000-000000000005"; // state machine: → rebutted
const INTRO_SCRUB = "99999999-0000-4000-8000-000000000006"; // GDPR scrub target

const INTROS: ReadonlyArray<{ id: string; applicantId: string; listing: number; occurredAt: string }> = [
  { id: INTRO_1, applicantId: APPLICANT, listing: 1, occurredAt: "2026-06-01T10:00:00Z" },
  { id: INTRO_2, applicantId: APPLICANT, listing: 2, occurredAt: "2026-06-01T10:01:00Z" },
  { id: INTRO_3, applicantId: APPLICANT, listing: 3, occurredAt: "2026-06-01T10:02:00Z" },
  { id: INTRO_SM1, applicantId: APPLICANT, listing: 4, occurredAt: "2026-06-01T10:03:00Z" },
  { id: INTRO_SM2, applicantId: APPLICANT, listing: 5, occurredAt: "2026-06-01T10:04:00Z" },
  { id: INTRO_SCRUB, applicantId: APPLICANT_SCRUB, listing: 6, occurredAt: "2026-06-01T10:05:00Z" },
];

/** Canonical recompute expression — must byte-for-byte match set_intro_hash(). */
const RECOMPUTED_HASH_SQL = `encode(sha256(convert_to(
  coalesce(prev_hash, 'genesis') || id::text || applicant_id::text || listing_id::text
  || first_contact_type || to_char(occurred_at, 'YYYY-MM-DD"T"HH24:MI:SS.US'),
'utf8')), 'hex')`;

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
  db.sql(`insert into public.agent_team_members (user_id, branch_id, role) values ('${AGENT_A}', '${BRANCH_A}', 'manager'), ('${TEAMMATE}', '${BRANCH_A}', 'agent');`);
  for (let n = 1; n <= 6; n++) {
    db.sql(`insert into public.properties (id, address_line1, postcode) values ('${propertyId(n)}', '${n} Synthetic Street', 'SW1A 1AA');`);
    db.sql(`insert into public.listings (id, property_id, user_id, status) values ('${listingId(n)}', '${propertyId(n)}', '${AGENT_A}', 'active');`);
  }
}

/** Service-path inserts (superuser stands in for service_role; RLS allows neither
 *  anon nor authenticated to insert — asserted in the RLS group). */
function seedLedgerRows(): void {
  // listings.branch_id exists only after the migration.
  db.sql(`update public.listings set branch_id = '${BRANCH_A}';`);
  for (const intro of INTROS) {
    db.sql(
      `insert into public.introductions
         (id, applicant_id, applicant_name, applicant_email, listing_id,
          branch_id, agent_id, first_contact_type, occurred_at, tail_expires_at)
       values
         ('${intro.id}', '${intro.applicantId}', 'Synthetic Applicant',
          'synthetic@example.test', '${listingId(intro.listing)}',
          '${BRANCH_A}', '${AGENT_A}', 'enquiry',
          timestamptz '${intro.occurredAt}',
          timestamptz '${intro.occurredAt}' + interval '6 months');`,
    );
    db.sql(
      `insert into public.introduction_status_history (introduction_id, status, reason, actor)
       values ('${intro.id}', 'active', 'introduction recorded', null);`,
    );
  }
}

describe.skipIf(!process.env.RUN_DB_TESTS)("truedeed introductions migration", () => {
  beforeAll(() => {
    db = startPostgres();
    applyPrerequisites(db);
    seedExistingSchemaRows();
    // RED: the migration file does not exist yet — this line is the failure.
    db.sqlFile(MIGRATION_PATH);
    seedLedgerRows();
  });

  afterAll(() => {
    db?.stop();
  });

  // =========================================================================
  describe("schema", () => {
    it.each([
      "introductions",
      "introduction_status_history",
      "introduction_events",
      "rebuttals",
      "truedeed_audit_log",
    ])("creates public.%s", (table) => {
      expect(db.sql(`select to_regclass('public.${table}') is not null;`)).toBe("t");
    });

    it("adds branch_id to listings referencing agent_branches", () => {
      expect(
        db.sql(
          `select count(*) from information_schema.columns
           where table_schema = 'public' and table_name = 'listings' and column_name = 'branch_id';`,
        ),
      ).toBe("1");
    });

    it("creates the private rebuttal-evidence storage bucket", () => {
      expect(
        db.sql(`select count(*) from storage.buckets where id = 'rebuttal-evidence';`),
      ).toBe("1");
    });
  });

  // =========================================================================
  describe("hash chain", () => {
    it("first introduction has no prev_hash (genesis)", () => {
      expect(db.sql(`select prev_hash is null from introductions where id = '${INTRO_1}';`)).toBe("t");
    });

    it("stored row_hash matches the canonical sha256 recomputation for every row", () => {
      expect(
        db.sql(
          `select bool_and(row_hash = ${RECOMPUTED_HASH_SQL}) from introductions;`,
        ),
      ).toBe("t");
    });

    it("each row's prev_hash links to the previous row's row_hash", () => {
      expect(
        db.sql(
          `select (select prev_hash from introductions where id = '${INTRO_2}')
                = (select row_hash from introductions where id = '${INTRO_1}');`,
        ),
      ).toBe("t");
      expect(
        db.sql(
          `select (select prev_hash from introductions where id = '${INTRO_3}')
                = (select row_hash from introductions where id = '${INTRO_2}');`,
        ),
      ).toBe("t");
    });

    it("detects tampering: superuser edit of occurred_at breaks hash recomputation", () => {
      db.sql(`alter table introductions disable trigger user;`);
      db.sql(`update introductions set occurred_at = occurred_at + interval '1 hour' where id = '${INTRO_3}';`);
      db.sql(`alter table introductions enable trigger user;`);
      expect(
        db.sql(
          `select row_hash <> ${RECOMPUTED_HASH_SQL} from introductions where id = '${INTRO_3}';`,
        ),
      ).toBe("t");
    });
  });

  // =========================================================================
  describe("immutability", () => {
    it("rejects UPDATE of ledgered fields on introductions even for superuser", () => {
      expect(() =>
        db.sql(`update introductions set first_contact_type = 'message' where id = '${INTRO_1}';`),
      ).toThrow(/append-only/);
    });

    it("rejects DELETE on introductions", () => {
      expect(() => db.sql(`delete from introductions where id = '${INTRO_1}';`)).toThrow(/append-only/);
    });

    it("rejects UPDATE and DELETE on introduction_events", () => {
      db.sql(
        `insert into introduction_events (introduction_id, event_type, payload)
         values ('${INTRO_1}', 'viewing_booked', '{"slot":"2026-06-02T09:00:00Z"}');`,
      );
      expect(() =>
        db.sql(`update introduction_events set payload = '{}' where introduction_id = '${INTRO_1}';`),
      ).toThrow(/append-only/);
      expect(() =>
        db.sql(`delete from introduction_events where introduction_id = '${INTRO_1}';`),
      ).toThrow(/append-only/);
    });

    it("rejects UPDATE and DELETE on introduction_status_history", () => {
      expect(() =>
        db.sql(`update introduction_status_history set status = 'expired' where introduction_id = '${INTRO_1}';`),
      ).toThrow(/append-only/);
      expect(() =>
        db.sql(`delete from introduction_status_history where introduction_id = '${INTRO_1}';`),
      ).toThrow(/append-only/);
    });

    it("rejects UPDATE and DELETE on truedeed_audit_log", () => {
      db.sql(
        `insert into truedeed_audit_log (actor, action, entity, entity_id, detail)
         values (null, 'introduction.recorded', 'introductions', '${INTRO_1}', '{}');`,
      );
      expect(() =>
        db.sql(`update truedeed_audit_log set action = 'tampered' where entity_id = '${INTRO_1}';`),
      ).toThrow(/append-only/);
      expect(() =>
        db.sql(`delete from truedeed_audit_log where entity_id = '${INTRO_1}';`),
      ).toThrow(/append-only/);
    });

    it("allows exactly one notified_at/rebuttal_deadline transition via mark_introduction_notified", () => {
      db.sql(
        `select mark_introduction_notified('${INTRO_1}', now(), now() + interval '7 days');`,
      );
      expect(
        db.sql(
          `select notified_at is not null and rebuttal_deadline is not null
           from introductions where id = '${INTRO_1}';`,
        ),
      ).toBe("t");
      expect(() =>
        db.sql(`select mark_introduction_notified('${INTRO_1}', now(), now() + interval '7 days');`),
      ).toThrow(/already notified/i);
    });

    it("rejects a direct UPDATE of notified_at as authenticated", () => {
      expect(() =>
        asUser(AGENT_A, `update introductions set notified_at = now() where id = '${INTRO_3}'`),
      ).toThrow(/permission denied|append-only/);
    });
  });

  // =========================================================================
  describe("state machine", () => {
    it("allows active → converted_sstc → converted_exchanged → converted_completed", () => {
      db.sql(`select transition_introduction('${INTRO_SM1}', 'converted_sstc', 'offer accepted', '${ADMIN}');`);
      db.sql(`select transition_introduction('${INTRO_SM1}', 'converted_exchanged', 'contracts exchanged', '${ADMIN}');`);
      db.sql(`select transition_introduction('${INTRO_SM1}', 'converted_completed', 'completion confirmed', '${ADMIN}');`);
      expect(
        db.sql(
          `select status from introduction_status_history
           where introduction_id = '${INTRO_SM1}'
           order by created_at desc, id desc limit 1;`,
        ),
      ).toBe("converted_completed");
    });

    it("allows active → rebutted", () => {
      db.sql(`select transition_introduction('${INTRO_SM2}', 'rebutted', 'rebuttal upheld', '${ADMIN}');`);
      expect(
        db.sql(
          `select status from introduction_status_history
           where introduction_id = '${INTRO_SM2}'
           order by created_at desc, id desc limit 1;`,
        ),
      ).toBe("rebutted");
    });

    it("rejects converted_completed → active", () => {
      expect(() =>
        db.sql(`select transition_introduction('${INTRO_SM1}', 'active', 'undo', '${ADMIN}');`),
      ).toThrow(/invalid transition/i);
    });

    it("rejects rebutted → converted_sstc", () => {
      expect(() =>
        db.sql(`select transition_introduction('${INTRO_SM2}', 'converted_sstc', 'oops', '${ADMIN}');`),
      ).toThrow(/invalid transition/i);
    });
  });

  // =========================================================================
  describe("row level security", () => {
    it("agent who owns the introductions sees them", () => {
      expect(asUser(AGENT_A, `select count(*) from introductions`)).toBe("6");
    });

    it("an unrelated agent sees zero rows", () => {
      expect(asUser(AGENT_B, `select count(*) from introductions`)).toBe("0");
    });

    it("the applicant sees their own introductions only", () => {
      expect(asUser(APPLICANT, `select count(*) from introductions`)).toBe("5");
    });

    it("a team member of the branch sees the branch's introductions", () => {
      expect(asUser(TEAMMATE, `select count(*) from introductions`)).toBe("6");
    });

    it("rejects INSERT into introductions as authenticated (service-role only)", () => {
      expect(() =>
        asUser(
          AGENT_A,
          `insert into introductions
             (applicant_id, applicant_name, applicant_email, listing_id,
              branch_id, agent_id, first_contact_type, occurred_at, tail_expires_at)
           values
             ('${APPLICANT_SCRUB}', 'Forged', 'forged@example.test', '${listingId(1)}',
              '${BRANCH_A}', '${AGENT_A}', 'enquiry', now(), now() + interval '6 months')`,
        ),
      ).toThrow(/row-level security|permission denied/);
    });
  });

  // =========================================================================
  describe("rebuttal window", () => {
    it("branch agent can submit a rebuttal while the deadline is in the future", () => {
      asUser(
        AGENT_A,
        `insert into rebuttals (introduction_id, submitted_by, evidence_storage_paths, evidence_dated_at)
         values ('${INTRO_1}', '${AGENT_A}', array['rebuttal-evidence/${INTRO_1}/crm.png'], date '2026-01-15')`,
      );
      expect(db.sql(`select count(*) from rebuttals where introduction_id = '${INTRO_1}';`)).toBe("1");
    });

    it("rejects a rebuttal once the deadline has passed", () => {
      db.sql(
        `select mark_introduction_notified('${INTRO_2}', now() - interval '10 days', now() - interval '3 days');`,
      );
      expect(() =>
        asUser(
          AGENT_A,
          `insert into rebuttals (introduction_id, submitted_by, evidence_storage_paths, evidence_dated_at)
           values ('${INTRO_2}', '${AGENT_A}', array['rebuttal-evidence/${INTRO_2}/crm.png'], date '2026-01-15')`,
        ),
      ).toThrow(/row-level security/);
    });

    it("rejects a rebuttal from an agent outside the branch", () => {
      expect(() =>
        asUser(
          AGENT_B,
          `insert into rebuttals (introduction_id, submitted_by, evidence_storage_paths, evidence_dated_at)
           values ('${INTRO_1}', '${AGENT_B}', array['rebuttal-evidence/${INTRO_1}/fake.png'], date '2026-01-15')`,
        ),
      ).toThrow(/row-level security/);
    });
  });

  // =========================================================================
  describe("gdpr scrub", () => {
    it("gdpr_scrub_introductions erases applicant PII without tripping the append-only trigger", () => {
      db.sql(`select gdpr_scrub_introductions('${APPLICANT_SCRUB}');`);
      expect(
        db.sql(
          `select applicant_id is null
              and applicant_name = '[erased]'
              and applicant_email = '[erased]'
           from introductions where id = '${INTRO_SCRUB}';`,
        ),
      ).toBe("t");
    });

    it("rejects the same scrub via a plain UPDATE (superuser without the scrub GUC)", () => {
      expect(() =>
        db.sql(
          `update introductions
           set applicant_id = null, applicant_name = '[erased]', applicant_email = '[erased]'
           where id = '${INTRO_1}';`,
        ),
      ).toThrow(/append-only/);
    });
  });
});
