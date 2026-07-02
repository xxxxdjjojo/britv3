import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const TABLE = "newsletter_subscribers";
const UNIQUE_VIOLATION = "23505";

/** Audiences a single email can independently subscribe to. */
export type NewsletterAudience =
  | "consumer"
  | "agent_briefing"
  | "landlord_diary"
  | "ftb_bootcamp";

/** Audiences that require a confirmed double opt-in before sending. */
export const DOUBLE_OPT_IN_AUDIENCES = ["agent_briefing", "landlord_diary"] as const;

const AudienceSchema = z.enum([
  "consumer",
  "agent_briefing",
  "landlord_diary",
  "ftb_bootcamp",
]);

function isDoubleOptIn(audience: NewsletterAudience): boolean {
  return (DOUBLE_OPT_IN_AUDIENCES as readonly string[]).includes(audience);
}

const SubscribeSchema = z.object({
  email: z.string().email(),
  source: z.string().min(1).max(64).default("blog"),
  audience: AudienceSchema.default("consumer"),
});

export type SubscribeInput = z.input<typeof SubscribeSchema>;

export type SubscribeResult =
  | { ok: true; alreadySubscribed: boolean; requiresConfirmation: boolean }
  | { ok: false; error: string };

type AdminClient = ReturnType<typeof createAdminClient>;

async function findByEmailAndAudience(
  client: AdminClient,
  email: string,
  audience: NewsletterAudience,
): Promise<{ id: string; status: string } | null> {
  const { data, error } = await client
    .from(TABLE)
    .select("id, status")
    .eq("email", email)
    .eq("audience", audience)
    .maybeSingle();
  if (error) throw new Error(`newsletter: lookup failed`);
  return data ?? null;
}

/**
 * Subscribe an email to a newsletter audience. Idempotent on
 * (lower(email), audience):
 * - new email → insert; double-opt-in audiences start 'pending' and the
 *   result carries `requiresConfirmation: true`, others start 'subscribed'
 * - existing pending row (double-opt-in) → idempotent, still requires
 *   confirmation
 * - existing subscribed row → `alreadySubscribed: true`
 * - previously unsubscribed → reactivated ('pending' again for double-opt-in
 *   audiences, 'subscribed' otherwise)
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
  const { source, audience } = parsed.data;
  const doubleOptIn = isDoubleOptIn(audience);

  try {
    const client = createAdminClient();

    const existing = await findByEmailAndAudience(client, email, audience);
    if (existing) {
      if (existing.status === "pending" && doubleOptIn) {
        // Re-subscribing before confirming — idempotent, resend the confirm.
        return { ok: true, alreadySubscribed: true, requiresConfirmation: true };
      }
      if (existing.status !== "subscribed") {
        // Previously unsubscribed — reactivate. Double-opt-in audiences must
        // re-confirm, single-opt-in audiences go straight back to subscribed.
        const nextStatus = doubleOptIn ? "pending" : "subscribed";
        const { error: updateError } = await client
          .from(TABLE)
          .update({ status: nextStatus, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (updateError) throw new Error("newsletter: reactivate failed");
        return {
          ok: true,
          alreadySubscribed: true,
          requiresConfirmation: doubleOptIn,
        };
      }
      return { ok: true, alreadySubscribed: true, requiresConfirmation: false };
    }

    const { error: insertError } = await client.from(TABLE).insert({
      email,
      source,
      audience,
      status: doubleOptIn ? "pending" : "subscribed",
    });

    if (insertError) {
      // Concurrent insert of the same (email, audience) — treat as already
      // subscribed.
      if (insertError.code === UNIQUE_VIOLATION) {
        return {
          ok: true,
          alreadySubscribed: true,
          requiresConfirmation: doubleOptIn,
        };
      }
      throw new Error("newsletter: insert failed");
    }

    return { ok: true, alreadySubscribed: false, requiresConfirmation: doubleOptIn };
  } catch {
    return { ok: false, error: "internal_error" };
  }
}

export type ConfirmResult =
  | { ok: true; alreadyConfirmed: boolean }
  | { ok: false; error: string };

/**
 * Confirm a pending double-opt-in subscription. Idempotent: confirming an
 * already-subscribed row is a no-op success. Never throws.
 */
export async function confirmNewsletterSubscription(
  email: string,
  audience: NewsletterAudience,
): Promise<ConfirmResult> {
  const parsedAudience = AudienceSchema.safeParse(audience);
  const parsedEmail = z.string().email().safeParse(email);
  if (!parsedAudience.success || !parsedEmail.success) {
    return { ok: false, error: "invalid_input" };
  }
  const normalisedEmail = parsedEmail.data.trim().toLowerCase();

  try {
    const client = createAdminClient();

    const existing = await findByEmailAndAudience(
      client,
      normalisedEmail,
      parsedAudience.data,
    );
    if (!existing) {
      return { ok: false, error: "not_found" };
    }
    if (existing.status === "subscribed") {
      return { ok: true, alreadyConfirmed: true };
    }

    const { error: updateError } = await client
      .from(TABLE)
      .update({
        status: "subscribed",
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (updateError) throw new Error("newsletter: confirm failed");

    return { ok: true, alreadyConfirmed: false };
  } catch {
    return { ok: false, error: "internal_error" };
  }
}

export type UnsubscribeResult =
  | { ok: true; alreadyUnsubscribed: boolean }
  | { ok: false; error: string };

/**
 * Unsubscribe an email from one audience. Idempotent: unsubscribing an
 * already-unsubscribed (or unknown) address is a no-op success. Never throws.
 */
export async function unsubscribeFromNewsletter(
  email: string,
  audience: NewsletterAudience,
): Promise<UnsubscribeResult> {
  const parsedAudience = AudienceSchema.safeParse(audience);
  const parsedEmail = z.string().email().safeParse(email);
  if (!parsedAudience.success || !parsedEmail.success) {
    return { ok: false, error: "invalid_input" };
  }
  const normalisedEmail = parsedEmail.data.trim().toLowerCase();

  try {
    const client = createAdminClient();

    const existing = await findByEmailAndAudience(
      client,
      normalisedEmail,
      parsedAudience.data,
    );
    if (!existing) {
      return { ok: true, alreadyUnsubscribed: true };
    }
    if (existing.status === "unsubscribed") {
      return { ok: true, alreadyUnsubscribed: true };
    }

    const { error: updateError } = await client
      .from(TABLE)
      .update({ status: "unsubscribed", updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (updateError) throw new Error("newsletter: unsubscribe failed");

    return { ok: true, alreadyUnsubscribed: false };
  } catch {
    return { ok: false, error: "internal_error" };
  }
}
