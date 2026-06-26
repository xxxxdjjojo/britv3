import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const TABLE = "newsletter_subscribers";
const UNIQUE_VIOLATION = "23505";

const SubscribeSchema = z.object({
  email: z.string().email(),
  source: z.string().min(1).max(64).default("blog"),
});

export type SubscribeInput = z.input<typeof SubscribeSchema>;

export type SubscribeResult =
  | { ok: true; alreadySubscribed: boolean }
  | { ok: false; error: string };

type AdminClient = ReturnType<typeof createAdminClient>;

async function findByEmail(
  client: AdminClient,
  email: string,
): Promise<{ id: string; status: string } | null> {
  const { data, error } = await client
    .from(TABLE)
    .select("id, status")
    .eq("email", email)
    .maybeSingle();
  if (error) throw new Error(`newsletter: lookup failed`);
  return data ?? null;
}

/**
 * Subscribe an email to the newsletter. Idempotent on lower(email):
 * - new email → insert, returns `alreadySubscribed: false`
 * - existing email → returns `alreadySubscribed: true`; if it was
 *   previously unsubscribed, reactivate it.
 *
 * Never throws to the caller — failures come back as `{ ok: false }`.
 */
export async function subscribeToNewsletter(
  input: SubscribeInput,
): Promise<SubscribeResult> {
  const parsed = SubscribeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid_email" };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const source = parsed.data.source;

  try {
    const client = createAdminClient();

    const existing = await findByEmail(client, email);
    if (existing) {
      if (existing.status !== "subscribed") {
        const { error: updateError } = await client
          .from(TABLE)
          .update({ status: "subscribed", updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (updateError) throw new Error("newsletter: reactivate failed");
      }
      return { ok: true, alreadySubscribed: true };
    }

    const { error: insertError } = await client
      .from(TABLE)
      .insert({ email, source });

    if (insertError) {
      // Concurrent insert of the same email — treat as already subscribed.
      if (insertError.code === UNIQUE_VIOLATION) {
        return { ok: true, alreadySubscribed: true };
      }
      throw new Error("newsletter: insert failed");
    }

    return { ok: true, alreadySubscribed: false };
  } catch {
    return { ok: false, error: "internal_error" };
  }
}
