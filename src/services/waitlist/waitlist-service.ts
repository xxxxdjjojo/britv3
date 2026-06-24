import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { nanoid } from "nanoid";
import { REFERRAL_BOOST, WAITLIST_BASELINE } from "@/lib/coming-soon/config";
import type {
  JoinResult,
  JoinWaitlistInput,
  QueueStatus,
} from "@/types/waitlist";

const TABLE = "waitlist_signups";
const MAX_CODE_RETRIES = 3;
const UNIQUE_VIOLATION = "23505";

type AdminClient = ReturnType<typeof createAdminClient>;

function genCode(): string {
  return nanoid(8).toUpperCase();
}

/** Never leak raw DB errors to callers. */
function fail(operation: string): never {
  throw new Error(`waitlist: ${operation} failed`);
}

async function totalReal(client: AdminClient): Promise<number> {
  const { count, error } = await client
    .from(TABLE)
    .select("*", { count: "exact", head: true });
  if (error) fail("count");
  return count ?? 0;
}

/** Total people on the list including the deliberate baseline offset. */
export async function getWaitlistCount(): Promise<number> {
  const client = createAdminClient();
  return (await totalReal(client)) + WAITLIST_BASELINE;
}

async function statusFor(
  client: AdminClient,
  code: string,
  createdAt: string,
): Promise<QueueStatus> {
  // 1-based head count: how many rows joined at or before this row.
  const { count: rawPositionCount, error: posError } = await client
    .from(TABLE)
    .select("*", { count: "exact", head: true })
    .lte("created_at", createdAt);
  if (posError) fail("position");
  const rawPosition = rawPositionCount ?? 1;

  const { count: referralCountRaw, error: refError } = await client
    .from(TABLE)
    .select("*", { count: "exact", head: true })
    .eq("referred_by", code);
  if (refError) fail("referralCount");
  const referralCount = referralCountRaw ?? 0;

  const realTotal = await totalReal(client);
  const total = realTotal + WAITLIST_BASELINE;

  const position = Math.max(
    1,
    rawPosition + WAITLIST_BASELINE - referralCount * REFERRAL_BOOST,
  );

  return { code, position, referralCount, total };
}

async function findByEmail(
  client: AdminClient,
  email: string,
): Promise<{ referral_code: string; created_at: string } | null> {
  const { data, error } = await client
    .from(TABLE)
    .select("referral_code, created_at")
    .eq("email", email)
    .maybeSingle();
  if (error) fail("lookup");
  return data ?? null;
}

export async function joinWaitlist(
  input: JoinWaitlistInput,
): Promise<JoinResult> {
  const client = createAdminClient();
  const email = input.email.trim().toLowerCase();

  const existing = await findByEmail(client, email);
  if (existing) {
    const status = await statusFor(
      client,
      existing.referral_code,
      existing.created_at,
    );
    return { ...status, alreadyJoined: true };
  }

  for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
    const code = genCode();
    const { data, error } = await client
      .from(TABLE)
      .insert({
        email,
        referral_code: code,
        referred_by: input.referredBy ?? null,
        variant: input.variant ?? null,
      })
      .select("referral_code, created_at")
      .single();

    if (!error && data) {
      const status = await statusFor(
        client,
        data.referral_code,
        data.created_at,
      );
      return { ...status, alreadyJoined: false };
    }

    if (error?.code === UNIQUE_VIOLATION) {
      // Email race: another request inserted the same email concurrently.
      const raced = await findByEmail(client, email);
      if (raced) {
        const status = await statusFor(
          client,
          raced.referral_code,
          raced.created_at,
        );
        return { ...status, alreadyJoined: true };
      }
      // Otherwise the collision was on the referral_code — retry a fresh code.
      continue;
    }

    fail("insert");
  }

  fail("insert");
}

export async function getQueueStatus(
  code: string,
): Promise<QueueStatus | null> {
  const client = createAdminClient();
  const { data, error } = await client
    .from(TABLE)
    .select("referral_code, created_at")
    .eq("referral_code", code)
    .maybeSingle();
  if (error) fail("status lookup");
  if (!data) return null;
  return statusFor(client, data.referral_code, data.created_at);
}
