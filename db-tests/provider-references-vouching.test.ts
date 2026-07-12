/**
 * RED-first contract tests for the vouching (provider references) DB foundation:
 *   A  supabase/migrations/20260712100001_vouching_reference_status_values.sql
 *   B  supabase/migrations/20260712100002_vouching_provider_references_columns_rls.sql
 *   C  supabase/migrations/20260712100003_vouching_rules_config.sql
 *
 * The core guarantee under test is the SECURITY FIX: the subject trader can no
 * longer INSERT / UPDATE / DELETE their own provider_references rows from the
 * browser (closing the status='verified' + reference_text forgery hole), while
 * still reading their own rows. Admins get read + review-update access.
 *
 * These migrations only extend the pre-existing `provider_references` table
 * (created in 20260316100001), which the harness does NOT apply. So this file
 * seeds a minimal stub of that table + its enums + service_provider_details on
 * top of the shared prerequisites, then applies migrations A/B/C in order.
 *
 * RLS JWT idiom (mirrors truedeed-introductions.test.ts):
 *   begin; set local role authenticated;
 *   set local request.jwt.claims = '{"sub":"<uuid>"}'; …; commit;
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { fileURLToPath } from "node:url";
import { startPostgres, applyPrerequisites, type DbHarness } from "./harness";

const MIGRATION_A = fileURLToPath(
  new URL(
    "../supabase/migrations/20260712100001_vouching_reference_status_values.sql",
    import.meta.url,
  ),
);
const MIGRATION_B = fileURLToPath(
  new URL(
    "../supabase/migrations/20260712100002_vouching_provider_references_columns_rls.sql",
    import.meta.url,
  ),
);
const MIGRATION_C = fileURLToPath(
  new URL(
    "../supabase/migrations/20260712100003_vouching_rules_config.sql",
    import.meta.url,
  ),
);

// ===== synthetic fixtures (no real data) =====
const PROVIDER_A = "aaaaaaaa-0000-4000-8000-000000000001"; // subject trader (owns refs)
const PROVIDER_B = "aaaaaaaa-0000-4000-8000-000000000002"; // unrelated trader
const ADMIN = "cccccccc-0000-4000-8000-000000000001";

const REF_1 = "99999999-0000-4000-8000-000000000001"; // PROVIDER_A peer ref, pending
const REF_2 = "99999999-0000-4000-8000-000000000002"; // PROVIDER_A client ref, pending
const REF_B = "99999999-0000-4000-8000-000000000003"; // PROVIDER_B ref (cross-provider isolation)

/**
 * Minimal stub of the provider_references table + enums + service_provider_details
 * that migrations A/B/C extend. Mirrors 20260316100001 SECTION 5 and 002_marketplace
 * (service_provider_details PK = user_id, no id column). Deliberately permissive
 * grants — the migration's RLS must do the restricting, as on hosted Supabase.
 */
const REFERENCES_PREREQ_SQL = `
-- Shared updated_at trigger fn: on prod this is defined in
-- 20260315000000_billing_tables.sql (long before this migration runs). The
-- harness stubs prod schema rather than replaying it, so stub the fn here too
-- — Migration C attaches a trigger that references it.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create type provider_reference_type as enum ('client', 'peer');
create type provider_reference_status as enum ('pending', 'submitted', 'verified');

create table public.service_provider_details (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  business_name text not null default 'Stub Trader',
  slug text unique not null
);

create table public.provider_references (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.service_provider_details(user_id) on delete cascade,
  reference_type provider_reference_type not null,
  referee_name text not null,
  referee_email text not null,
  referee_phone text,
  relationship text,
  status provider_reference_status not null default 'pending',
  reference_text text,
  requested_at timestamptz not null default now(),
  submitted_at timestamptz,
  verified_at timestamptz
);

alter table public.provider_references enable row level security;

-- Original (insecure) policies that Migration B must rewrite. Recreating them
-- here proves the DROP POLICY IF EXISTS statements actually target real policies.
create policy "provider_references_select_own"
  on public.provider_references for select
  using (provider_id = (select user_id from public.service_provider_details where user_id = auth.uid()));
create policy "provider_references_insert_own"
  on public.provider_references for insert
  with check (provider_id = (select user_id from public.service_provider_details where user_id = auth.uid()));
create policy "provider_references_update_own"
  on public.provider_references for update
  using (provider_id = (select user_id from public.service_provider_details where user_id = auth.uid()))
  with check (provider_id = (select user_id from public.service_provider_details where user_id = auth.uid()));
create policy "provider_references_delete_own"
  on public.provider_references for delete
  using (provider_id = (select user_id from public.service_provider_details where user_id = auth.uid()));

grant select, insert, update, delete on public.service_provider_details
  to anon, authenticated, service_role;
grant select, insert, update, delete on public.provider_references
  to anon, authenticated, service_role;
`;

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

function seedRows(): void {
  for (const [userId, isAdmin] of [
    [PROVIDER_A, false],
    [PROVIDER_B, false],
    [ADMIN, true],
  ] as const) {
    db.sql(
      `insert into auth.users (id, email) values ('${userId}', 'u-${userId.slice(-4)}@example.test');`,
    );
    db.sql(
      `insert into public.profiles (id, display_name, is_admin) values ('${userId}', 'User ${userId.slice(-4)}', ${isAdmin});`,
    );
  }
  // Providers A and B have service_provider_details; ADMIN does not.
  for (const p of [PROVIDER_A, PROVIDER_B]) {
    db.sql(
      `insert into public.service_provider_details (user_id, slug) values ('${p}', 'trader-${p.slice(-4)}');`,
    );
  }
  // Seed reference rows via superuser (service path bypasses RLS).
  db.sql(
    `insert into public.provider_references (id, provider_id, reference_type, referee_name, referee_email, status)
     values
       ('${REF_1}', '${PROVIDER_A}', 'peer',   'Peer One',   'peer1@example.test',   'pending'),
       ('${REF_2}', '${PROVIDER_A}', 'client', 'Client One', 'client1@example.test', 'pending'),
       ('${REF_B}', '${PROVIDER_B}', 'peer',   'Peer Two',   'peer2@example.test',   'pending');`,
  );
}

describe.skipIf(!process.env.RUN_DB_TESTS)("vouching provider-references migrations", () => {
  beforeAll(() => {
    db = startPostgres();
    applyPrerequisites(db);
    db.sql(REFERENCES_PREREQ_SQL);
    // RED before the migrations exist: sqlFile ENOENTs on these paths.
    db.sqlFile(MIGRATION_A);
    db.sqlFile(MIGRATION_B);
    db.sqlFile(MIGRATION_C);
    seedRows();
  });

  afterAll(() => {
    db?.stop();
  });

  // =========================================================================
  describe("A — enum values", () => {
    it.each(["sent", "declined", "expired", "revoked", "rejected", "flagged"])(
      "adds provider_reference_status value %s",
      (value) => {
        expect(
          db.sql(
            `select count(*) from pg_enum e
             join pg_type t on t.oid = e.enumtypid
             where t.typname = 'provider_reference_status' and e.enumlabel = '${value}';`,
          ),
        ).toBe("1");
      },
    );
  });

  // =========================================================================
  describe("B — columns", () => {
    it.each([
      "invite_token_hash",
      "invite_expires_at",
      "invite_sent_at",
      "invite_last_sent_at",
      "invite_send_count",
      "work_date",
      "rating",
      "declined_reason",
      "declined_at",
      "revoked_at",
      "reviewed_at",
      "reviewed_by",
      "review_reason",
    ])("adds provider_references.%s", (column) => {
      expect(
        db.sql(
          `select count(*) from information_schema.columns
           where table_schema = 'public' and table_name = 'provider_references'
             and column_name = '${column}';`,
        ),
      ).toBe("1");
    });

    it("enforces rating BETWEEN 1 AND 5", () => {
      expect(() =>
        db.sql(`update public.provider_references set rating = 6 where id = '${REF_1}';`),
      ).toThrow(/provider_references_rating_check|check constraint/i);
    });
  });

  // =========================================================================
  describe("B — RLS: trader forgery is BLOCKED", () => {
    it("trader can still SELECT their own rows", () => {
      expect(asUser(PROVIDER_A, `select count(*) from public.provider_references`)).toBe("2");
    });

    it("trader sees ZERO of another provider's rows", () => {
      // PROVIDER_A queries; only their own 2 rows are visible, never REF_B.
      expect(
        asUser(
          PROVIDER_A,
          `select count(*) from public.provider_references where id = '${REF_B}'`,
        ),
      ).toBe("0");
    });

    it("rejects trader INSERT (service-role only now)", () => {
      expect(() =>
        asUser(
          PROVIDER_A,
          `insert into public.provider_references
             (provider_id, reference_type, referee_name, referee_email, status)
           values ('${PROVIDER_A}', 'peer', 'Forged', 'forged@example.test', 'verified')`,
        ),
      ).toThrow(/row-level security|permission denied/);
    });

    it("trader forging status='verified' + reference_text via UPDATE has NO effect", () => {
      // With no UPDATE policy, the row is not updatable for the trader: the
      // UPDATE matches zero rows (Postgres raises no error, but nothing changes).
      // The security guarantee is that the forgery does not land.
      const affected = asUser(
        PROVIDER_A,
        `with upd as (
           update public.provider_references
             set status = 'verified', reference_text = 'forged endorsement'
           where id = '${REF_1}' returning 1
         ) select count(*) from upd`,
      );
      expect(affected).toBe("0");
      expect(
        db.sql(
          `select status = 'pending' and reference_text is null
           from public.provider_references where id = '${REF_1}';`,
        ),
      ).toBe("t");
    });

    it("trader DELETE of their own row has NO effect", () => {
      const affected = asUser(
        PROVIDER_A,
        `with del as (
           delete from public.provider_references where id = '${REF_1}' returning 1
         ) select count(*) from del`,
      );
      expect(affected).toBe("0");
      expect(
        db.sql(`select count(*) from public.provider_references where id = '${REF_1}';`),
      ).toBe("1");
    });
  });

  // =========================================================================
  describe("B — RLS: admin access WORKS", () => {
    it("admin SELECT returns all providers' rows (both A and B)", () => {
      // Absolute count is order-dependent (later describe blocks insert more
      // rows), so assert the admin can see across the tenant boundary instead:
      // at least the 3 seeded rows, including PROVIDER_B's REF_B.
      expect(
        Number(asUser(ADMIN, `select count(*) from public.provider_references`)),
      ).toBeGreaterThanOrEqual(3);
      expect(
        asUser(
          ADMIN,
          `select count(*) from public.provider_references where id = '${REF_B}'`,
        ),
      ).toBe("1");
    });

    it("admin UPDATE (verify + reviewed_by) succeeds", () => {
      asUser(
        ADMIN,
        `update public.provider_references
           set status = 'verified', reviewed_by = '${ADMIN}', reviewed_at = now()
         where id = '${REF_2}'`,
      );
      expect(
        db.sql(
          `select status = 'verified' and reviewed_by = '${ADMIN}'
           from public.provider_references where id = '${REF_2}';`,
        ),
      ).toBe("t");
    });

    it("admin UPDATE of status/review fields still succeeds (identity-trigger regression guard)", () => {
      // The identity-immutability trigger must NOT block legitimate review
      // writes that leave provider_id / referee_email / reference_type untouched.
      asUser(
        ADMIN,
        `update public.provider_references
           set status = 'flagged', review_reason = 'needs a second look', reviewed_at = now()
         where id = '${REF_1}'`,
      );
      expect(
        db.sql(
          `select status = 'flagged' and review_reason = 'needs a second look'
           from public.provider_references where id = '${REF_1}';`,
        ),
      ).toBe("t");
    });

    it("admin UPDATE reassigning provider_id to another provider is REJECTED by the immutability trigger", () => {
      // Tenant-boundary break: moving REF_2 from PROVIDER_A to PROVIDER_B must
      // RAISE (the BEFORE UPDATE trigger fires for admin writes too), and the
      // row's provider_id must be unchanged.
      expect(() =>
        asUser(
          ADMIN,
          `update public.provider_references set provider_id = '${PROVIDER_B}' where id = '${REF_2}'`,
        ),
      ).toThrow(/identity columns .* are immutable/i);
      expect(
        db.sql(
          `select provider_id = '${PROVIDER_A}'
           from public.provider_references where id = '${REF_2}';`,
        ),
      ).toBe("t");
    });
  });

  // =========================================================================
  describe("B — unique indexes", () => {
    it("rejects a second ACTIVE invite for same (provider, lower(email), type)", () => {
      // REF_1 is PROVIDER_A + peer1@example.test + peer (status pending = active).
      expect(() =>
        db.sql(
          `insert into public.provider_references
             (provider_id, reference_type, referee_name, referee_email, status)
           values ('${PROVIDER_A}', 'peer', 'Dup', 'PEER1@example.test', 'sent');`,
        ),
      ).toThrow(/uq_provider_references_active_invite|duplicate key/i);
    });

    it("allows a new invite once the first is moved to a non-active status", () => {
      db.sql(`update public.provider_references set status = 'declined' where id = '${REF_1}';`);
      const inserted = db.sql(
        `insert into public.provider_references
           (provider_id, reference_type, referee_name, referee_email, status)
         values ('${PROVIDER_A}', 'peer', 'Reinvite', 'peer1@example.test', 'sent')
         returning id;`,
      );
      expect(inserted).toMatch(/[0-9a-f-]{36}/);
    });

    it("enforces the unique invite_token_hash index", () => {
      db.sql(
        `update public.provider_references set invite_token_hash = 'deadbeef' where id = '${REF_2}';`,
      );
      expect(() =>
        db.sql(
          `update public.provider_references set invite_token_hash = 'deadbeef' where id = '${REF_B}';`,
        ),
      ).toThrow(/uq_provider_references_token_hash|duplicate key/i);
    });
  });

  // =========================================================================
  describe("C — verification_vouch_rules", () => {
    it("creates the singleton row with defaults", () => {
      expect(
        db.sql(
          `select required_peer_vouches = 3 and required_client_vouches = 3
              and client_recency_days = 90 and invite_expiry_days = 30
              and resend_cooldown_hours = 24 and gate_enabled = false
           from verification_vouch_rules where id = true;`,
        ),
      ).toBe("t");
    });

    it("enforces the single-row constraint (id must be TRUE)", () => {
      expect(() =>
        db.sql(`insert into verification_vouch_rules (id) values (false);`),
      ).toThrow(/check constraint|verification_vouch_rules/i);
    });

    it("authenticated can SELECT", () => {
      expect(
        asUser(PROVIDER_A, `select count(*) from verification_vouch_rules`),
      ).toBe("1");
    });

    it("non-admin authenticated UPDATE has NO effect", () => {
      const affected = asUser(
        PROVIDER_A,
        `with upd as (
           update verification_vouch_rules set gate_enabled = true where id = true returning 1
         ) select count(*) from upd`,
      );
      expect(affected).toBe("0");
      expect(db.sql(`select gate_enabled from verification_vouch_rules where id = true;`)).toBe("f");
    });

    it("allows admin UPDATE", () => {
      asUser(
        ADMIN,
        `update verification_vouch_rules set gate_enabled = true, updated_by = '${ADMIN}' where id = true`,
      );
      expect(db.sql(`select gate_enabled from verification_vouch_rules where id = true;`)).toBe("t");
    });
  });
});
