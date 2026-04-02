/**
 * Seed Demo — Auth Users & Profiles
 *
 * Creates 7 demo Supabase auth users and upserts their profiles
 * and user_roles rows for multi-role support.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { DEMO_PASSWORD, DEMO_PROFILES, DEMO_USERS } from "./config";
import { seedTable } from "./utils";

// ---------------------------------------------------------------------------
// User Roles Configuration
// ---------------------------------------------------------------------------

type DemoUserEntry = (typeof DEMO_USERS)[keyof typeof DEMO_USERS];

/**
 * Build user_roles rows. Each user gets their active_role.
 * The agent also gets 'seller' (agents can list properties).
 */
function buildUserRolesRows(): Array<{
  id: string;
  user_id: string;
  role: string;
}> {
  const rows: Array<{ id: string; user_id: string; role: string }> = [];

  const entries = Object.values(DEMO_USERS) as DemoUserEntry[];
  for (const user of entries) {
    rows.push({
      id: `a0000000-0000-4000-8000-${user.id.slice(-12)}`,
      user_id: user.id,
      role: user.role,
    });
  }

  // Agent also gets 'seller' role
  rows.push({
    id: "a0000000-0000-4000-8000-a00000000005",
    user_id: DEMO_USERS.AGENT.id,
    role: "seller",
  });

  return rows;
}

// ---------------------------------------------------------------------------
// Main Seed Function
// ---------------------------------------------------------------------------

export type SeedUsersResult = {
  usersCreated: number;
  usersSkipped: number;
  profilesSeeded: number;
};

export async function seedUsers(
  supabase: SupabaseClient,
): Promise<SeedUsersResult> {
  let usersCreated = 0;
  let usersSkipped = 0;

  console.log("\n--- Seeding Auth Users ---\n");

  // 1. Create auth users one by one
  const entries = Object.values(DEMO_USERS) as DemoUserEntry[];

  for (const user of entries) {
    console.log(`  Creating auth user: ${user.name} (${user.email})...`);

    const { error } = await supabase.auth.admin.createUser({
      id: user.id,
      email: user.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: user.name },
    });

    if (error) {
      // Handle "user already exists" gracefully
      if (
        error.message?.toLowerCase().includes("already") ||
        error.message?.toLowerCase().includes("unique") ||
        (error as any).status === 422
      ) {
        console.log(`  Skipped (already exists): ${user.email}`);
        usersSkipped++;
        continue;
      }
      // Unexpected error — log but continue
      console.error(`  ERROR creating ${user.email}: ${error.message}`);
      usersSkipped++;
      continue;
    }

    console.log(`  Created: ${user.email}`);
    usersCreated++;
  }

  // 2. Upsert profiles (trigger may have created bare rows)
  console.log("\n--- Seeding Profiles ---\n");

  const profileResult = await seedTable(
    supabase,
    "profiles",
    DEMO_PROFILES as unknown as Record<string, unknown>[],
  );

  // 3. Seed user_roles junction table
  console.log("\n--- Seeding User Roles ---\n");

  const userRolesRows = buildUserRolesRows();
  await seedTable(
    supabase,
    "user_roles",
    userRolesRows as unknown as Record<string, unknown>[],
  );

  // 4. Seed subscriptions so demo users bypass paywalls
  console.log("\n--- Seeding Subscriptions ---\n");

  const subscriptionRows = [
    {
      id: "e4000000-a001-4000-8000-000000000001",
      user_id: DEMO_USERS.LANDLORD.id,
      plan_name: "landlord_pro",
      status: "active",
      stripe_customer_id: "cus_demo_landlord",
      stripe_subscription_id: "sub_demo_landlord",
      current_period_end: new Date(Date.now() + 365 * 86400000).toISOString(),
      cancel_at_period_end: false,
    },
    {
      id: "e4000000-a002-4000-8000-000000000002",
      user_id: DEMO_USERS.AGENT.id,
      plan_name: "agent_enterprise",
      status: "active",
      stripe_customer_id: "cus_demo_agent",
      stripe_subscription_id: "sub_demo_agent",
      current_period_end: new Date(Date.now() + 365 * 86400000).toISOString(),
      cancel_at_period_end: false,
    },
    {
      id: "e4000000-a003-4000-8000-000000000003",
      user_id: DEMO_USERS.PROVIDER.id,
      plan_name: "provider_elite",
      status: "active",
      stripe_customer_id: "cus_demo_provider",
      stripe_subscription_id: "sub_demo_provider",
      current_period_end: new Date(Date.now() + 365 * 86400000).toISOString(),
      cancel_at_period_end: false,
    },
  ];

  await seedTable(
    supabase,
    "subscriptions",
    subscriptionRows as unknown as Record<string, unknown>[],
  );

  const profilesSeeded = profileResult.success ? profileResult.count : 0;

  console.log("\n--- Users Summary ---");
  console.log(`  Auth users created: ${usersCreated}`);
  console.log(`  Auth users skipped: ${usersSkipped}`);
  console.log(`  Profiles seeded:    ${profilesSeeded}`);
  console.log(`  Subscriptions:      ${subscriptionRows.length} (all paywalls bypassed)`);

  return { usersCreated, usersSkipped, profilesSeeded };
}
