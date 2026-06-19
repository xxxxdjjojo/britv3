/* eslint-disable no-console -- CLI seed script: console output is the intended progress/diagnostic channel (run via `node`/`tsx`, not shipped to the client). */
/**
 * supabase/seed/seed-test-users.ts
 *
 * Seeds the canonical TrueDeed Playwright test users into Supabase Auth +
 * assigns their roles via the existing `assign_role_atomic` RPC. Temporary
 * Britestate aliases are also seeded for compatibility with branches whose
 * E2E auth fixtures have not been rebranded yet. Idempotent — re-running is
 * safe; already-existing users are skipped with a warning.
 *
 * The `admin` user gets `profiles.is_admin = true` instead of an entry in
 * user_roles, because `assign_role_atomic`'s valid_roles list does not include
 * 'admin' (admin status is a boolean flag, not a role enum value — see
 * supabase/migrations/20260324_fix_admin_rls_policies.sql).
 *
 * Canonical email addresses should match `e2e/auth.setup.ts` after that
 * out-of-scope fixture is rebranded. Legacy aliases preserve compatibility
 * until then.
 *
 * Usage:
 *   SUPABASE_URL='https://YOUR-PROJECT.supabase.co' \
 *   SUPABASE_SERVICE_ROLE_KEY='YOUR-SERVICE-ROLE-KEY' \
 *   pnpm tsx supabase/seed/seed-test-users.ts
 *
 * After seeding, run `pnpm test:e2e` once — Playwright's auth.setup.ts will
 * sign each user in and populate `e2e/.auth/*.json` with real auth state.
 */
import { createClient } from "@supabase/supabase-js";

interface TestUserRole {
  localPart: string;
  role: string;
}

interface TestUser {
  email: string;
  role: string;
}

const TRUEDEED_TEST_USER_DOMAIN = "truedeed.test";
const LEGACY_TEST_USER_DOMAIN = "britestate.test";

const TEST_USER_ROLES: ReadonlyArray<TestUserRole> = [
  { localPart: "test-buyer", role: "homebuyer" },
  { localPart: "test-renter", role: "renter" },
  { localPart: "test-seller", role: "seller" },
  { localPart: "test-landlord", role: "landlord" },
  { localPart: "test-agent", role: "agent" },
  { localPart: "test-provider", role: "service_provider" },
  { localPart: "test-broker", role: "mortgage_broker" },
  { localPart: "test-admin", role: "admin" },
];

const TEST_USERS: ReadonlyArray<TestUser> = TEST_USER_ROLES.flatMap(
  ({ localPart, role }) => [
    { email: `${localPart}@${TRUEDEED_TEST_USER_DOMAIN}`, role },
    { email: `${localPart}@${LEGACY_TEST_USER_DOMAIN}`, role },
  ],
);

const PASSWORD = "TestPassword123!";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL environment variable is required");
}
if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

for (const { email, role } of TEST_USERS) {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { role },
  });

  let userId = created?.user?.id;

  if (createError) {
    if (createError.message.toLowerCase().includes("already")) {
      // Already exists — look up the id so we can still ensure the role is set.
      const { data: list, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.error(`Lookup ${email} after create-conflict:`, listError);
        continue;
      }
      userId = list.users.find((u) => u.email === email)?.id;
      console.warn(`! ${email} already exists — ensuring role is set`);
    } else {
      console.error(`Create ${email}:`, createError);
      continue;
    }
  }

  if (!userId) {
    console.error(`No userId resolved for ${email} — skipping role assignment`);
    continue;
  }

  if (role === "admin") {
    // admin is a boolean flag on profiles, not a value in the role enum.
    const { error: adminError } = await supabase
      .from("profiles")
      .update({ is_admin: true })
      .eq("id", userId);
    if (adminError) {
      console.error(`Set is_admin for ${email}:`, adminError);
      continue;
    }
  } else {
    const { error: roleError } = await supabase.rpc("assign_role_atomic", {
      p_user_id: userId,
      p_role: role,
    });
    if (roleError) {
      console.error(`Assign role ${email}:`, roleError);
      continue;
    }
  }

  console.log(`OK ${email} (${role})`);
}

// ---------------------------------------------------------------------------
// Provider business record for the E2E provider user.
//
// `dashboard/provider/layout.tsx` → `resolveProviderId()` queries
// `service_provider_details` for the current user and redirects away (404) when
// no row exists. The demo SQL seed only creates a row for a different user, so
// the E2E provider users have none. Seed minimal valid rows here so all
// provider routes render under canonical TrueDeed and legacy Britestate E2E auth.
//
// Required columns (per migration 002_marketplace.sql): user_id (PK),
// business_name (NOT NULL), slug (UNIQUE NOT NULL). `services` and
// `service_postcodes` are NOT NULL but have defaults. Values mirror the demo
// seed's shape; slugs are unique to each compatibility user to avoid UNIQUE
// collisions.
// Idempotent: keyed on user_id with onConflict ignore.
const PROVIDER_FIXTURES: ReadonlyArray<{
  email: string;
  businessName: string;
  slug: string;
}> = [
  {
    email: `test-provider@${TRUEDEED_TEST_USER_DOMAIN}`,
    businessName: "TrueDeed Test Plumbing",
    slug: "truedeed-test-plumbing",
  },
  {
    email: `test-provider@${LEGACY_TEST_USER_DOMAIN}`,
    businessName: "Britestate Test Plumbing",
    slug: "britestate-test-plumbing",
  },
];

const { data: providerList, error: providerListError } =
  await supabase.auth.admin.listUsers();
if (providerListError) {
  console.error("Lookup E2E provider user:", providerListError);
} else {
  for (const { email, businessName, slug } of PROVIDER_FIXTURES) {
    const providerUserId = providerList.users.find((u) => u.email === email)?.id;

    if (!providerUserId) {
      console.error(`No userId resolved for ${email} — skipping provider record`);
      continue;
    }

    const { error: providerDetailsError } = await supabase
      .from("service_provider_details")
      .upsert(
        {
          user_id: providerUserId,
          business_name: businessName,
          slug,
        },
        { onConflict: "user_id", ignoreDuplicates: true },
      );
    if (providerDetailsError) {
      console.error(`Upsert service_provider_details for ${email}:`, providerDetailsError);
    } else {
      console.log(`OK service_provider_details for ${email}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Subscription + verification state for the gated roles.
//
// `middleware.ts` gates /dashboard/{agent,landlord,provider}/* behind an active
// subscription, and /dashboard/{agent,provider}/* behind a verified status —
// via a DB query whenever the `jwt_claims_middleware` flag is off (the default).
// Without this state, every non-exempt gated route 307-redirects to billing
// checkout / verification, so the smoke would exercise those pages instead of
// the real dashboards, and the negative-path 404 test (landlord) would see the
// redirect instead of a true HTTP 404. Hosted's test users had this state set up
// out-of-band; replicate it here so the local gate is faithful and meaningful.
//
// NOTE: middleware checks `provider_verification_status === "approved"`, but the
// enum has no "approved" value (unverified|pending_review|verified|suspended|
// rejected). So provider non-exempt routes still redirect to /verification even
// with status "verified" set below — tracked as finding F12. The correct data is
// still seeded so the fix is a one-line middleware change, not a data change.
const GATED_ROLE_BASE: ReadonlyArray<{
  localPart: string;
  verificationLevel?: string;
  providerStatus?: string;
}> = [
  { localPart: "test-landlord" },
  { localPart: "test-agent", verificationLevel: "professional" },
  { localPart: "test-provider", providerStatus: "verified" },
];

const GATED_ROLE_STATE: ReadonlyArray<{
  email: string;
  verificationLevel?: string;
  providerStatus?: string;
}> = GATED_ROLE_BASE.flatMap(({ localPart, verificationLevel, providerStatus }) => [
  {
    email: `${localPart}@${TRUEDEED_TEST_USER_DOMAIN}`,
    verificationLevel,
    providerStatus,
  },
  {
    email: `${localPart}@${LEGACY_TEST_USER_DOMAIN}`,
    verificationLevel,
    providerStatus,
  },
]);

const { data: gatedUsers, error: gatedListError } =
  await supabase.auth.admin.listUsers();
if (gatedListError) {
  console.error("Lookup gated-role users:", gatedListError);
} else {
  for (const { email, verificationLevel, providerStatus } of GATED_ROLE_STATE) {
    const userId = gatedUsers.users.find((u) => u.email === email)?.id;
    if (!userId) {
      console.error(`No userId resolved for ${email} — skipping gated state`);
      continue;
    }

    const { error: subError } = await supabase.from("subscriptions").upsert(
      { user_id: userId, status: "active", plan_name: "professional" },
      { onConflict: "user_id" },
    );
    if (subError) {
      console.error(`Upsert subscription for ${email}:`, subError);
    }

    const profileUpdate: Record<string, string> = {};
    if (verificationLevel) profileUpdate.verification_level = verificationLevel;
    if (providerStatus) profileUpdate.provider_verification_status = providerStatus;
    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", userId);
      if (profileError) {
        console.error(`Update verification for ${email}:`, profileError);
      }
    }

    console.log(`OK gated-role state for ${email}`);
  }
}

console.log("Seed complete.");
