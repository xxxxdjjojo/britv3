import { createClient, type SupabaseClient } from "@supabase/supabase-js";
// Relative (not @/ alias): Playwright's esbuild transform doesn't read tsconfig
// `paths`, so a relative import to the shared hashing primitive keeps the seed
// helper runnable without extra module-resolution config.
import { hashReferenceToken } from "../../src/lib/reference-tokens";

/**
 * Seed helper for the vouching (provider-references) E2E specs.
 *
 * The referee surface authenticates purely on the single-use raw token in the
 * URL. Only the SHA-256 HASH of that token is ever stored
 * (provider_references.invite_token_hash) — the raw token exists only in the
 * emailed link. So a deterministic E2E cannot read a real token; it must MINT
 * one it already knows and write the matching hash:
 *
 *   const token = "e2e-...";                    // known raw token (test-only)
 *   invite_token_hash = hashReferenceToken(token)  // same primitive the app uses
 *
 * then navigate to /reference/<token>. We reuse the app's own
 * `hashReferenceToken` (src/lib/reference-tokens.ts) so the hash is byte-for-byte
 * what the referee endpoints compute — no drift.
 *
 * Writes bypass RLS via the service-role client (the invitation/referee code
 * paths do the same in production). Requires:
 *   - NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - a provider whose user id exists in service_provider_details.user_id
 *     (default: the E2E `test-provider@britestate.test` user).
 *
 * Rows are tagged with a per-run marker in referee_email so afterAll cleanup
 * only removes what this run created.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Statuses used by the seeded rows, matching provider_reference_status. */
type SeedStatus = "sent" | "submitted";

export type SeededReference = {
  /** provider_references.id (needed by the admin-review spec). */
  id: string;
  /** The raw token to put in the /reference/<token> URL. */
  token: string;
  referenceType: "client" | "peer";
  status: SeedStatus;
};

export type SeedReferenceInput = Readonly<{
  /** Raw, known token — its hash is stored; this value goes in the URL. */
  token: string;
  referenceType: "client" | "peer";
  status?: SeedStatus;
  /** Days until expiry; negative = already expired. Default 30. */
  expiresInDays?: number;
  /** For `submitted` seeds (admin spec) — the referee's statement. */
  referenceText?: string;
  /** For `submitted` client seeds — ISO date (YYYY-MM-DD), not in the future. */
  workDate?: string;
  rating?: number;
}>;

function serviceClient(): SupabaseClient {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !serviceKey) {
    throw new Error(
      "reference-seed requires NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Resolve the auth user id for an email via the admin API. */
export async function providerUserIdByEmail(email: string): Promise<string> {
  const { data, error } = await serviceClient().auth.admin.listUsers();
  if (error) throw new Error(`listUsers failed: ${error.message}`);
  const user = data.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  if (!user) throw new Error(`No auth user for ${email} — seed the E2E users first.`);
  return user.id;
}

/**
 * Insert one provider_references invitation row with a KNOWN token.
 * Returns the row id + the raw token to navigate to.
 */
export async function seedReference(
  providerId: string,
  refereeEmail: string,
  input: SeedReferenceInput,
): Promise<SeededReference> {
  const status = input.status ?? "sent";
  const expiresInDays = input.expiresInDays ?? 30;
  const expiresAt = new Date(Date.now() + expiresInDays * MS_PER_DAY).toISOString();
  const referenceType = input.referenceType;

  const row: Record<string, unknown> = {
    provider_id: providerId,
    reference_type: referenceType,
    referee_name: "E2E Referee",
    referee_email: refereeEmail,
    relationship: referenceType === "client" ? "Customer" : "Worked together",
    status,
    invite_token_hash: hashReferenceToken(input.token),
    invite_expires_at: expiresAt,
    invite_sent_at: new Date().toISOString(),
    invite_last_sent_at: new Date().toISOString(),
    invite_send_count: 1,
  };

  if (status === "submitted") {
    row.reference_text =
      input.referenceText ?? "They did a solid job — tidy, on time, would use again.";
    row.submitted_at = new Date().toISOString();
    if (referenceType === "client") {
      row.work_date = input.workDate ?? new Date(Date.now() - 30 * MS_PER_DAY).toISOString().slice(0, 10);
      if (typeof input.rating === "number") row.rating = input.rating;
    }
  }

  const { data, error } = await serviceClient()
    .from("provider_references")
    .insert(row)
    .select("id")
    .single();

  if (error) throw new Error(`seedReference insert failed: ${error.message}`);
  return { id: (data as { id: string }).id, token: input.token, referenceType, status };
}

/** Remove every reference row for a given referee_email (per-run cleanup). */
export async function cleanupReferencesByEmail(refereeEmail: string): Promise<void> {
  await serviceClient()
    .from("provider_references")
    .delete()
    .eq("referee_email", refereeEmail);
}
