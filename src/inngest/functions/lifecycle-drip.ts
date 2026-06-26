/**
 * Inngest function: role-based lifecycle email drip.
 *
 * Triggered by `lifecycle/role.assigned` (emitted from the auth callback after
 * assign_role_atomic). ONE generic function drives every role sequence — the
 * per-role content lives in LIFECYCLE_SEQUENCES.
 *
 * Flow:
 *   1. Ensure an enrolment row exists for (user, role).
 *   2. For each step: sleep the inter-step delay, then:
 *      - reload the profile; STOP the whole sequence if active_role no longer
 *        equals this role (the user switched roles / was deleted),
 *      - check the role's behaviour stop condition (saved search, listing,
 *        valuation, viewing, job, …); STOP early if the user already activated,
 *      - otherwise send the step (idempotent at the service layer).
 *
 * Event idempotency `lifecycle-${userId}-${role}` caps one run per user+role so
 * a re-emitted event can't start a duplicate sequence.
 */

import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendLifecycleStep } from "@/services/email/lifecycle/lifecycle-email-service";
import {
  LIFECYCLE_SEQUENCES,
  toLifecycleRole,
  type LifecycleRole,
} from "@/services/email/lifecycle/sequences";

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

type StepOutcome =
  | { action: "stopped"; reason: "role_changed" | "activated" }
  | { action: "send"; result: Awaited<ReturnType<typeof sendLifecycleStep>> };

/**
 * Behaviour stop condition per role. Returns true when the user has already
 * performed the activating action for that role, so the sequence should end.
 * Table names are verified against supabase/migrations:
 *   - saved_searches(user_id), saved_properties(user_id), viewings(user_id)
 *   - listings(user_id), valuation_sessions(user_id), service_requests(user_id)
 */
async function hasRowFor(
  supabase: SupabaseAdmin,
  table: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from(table)
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}

async function hasActivated(
  supabase: SupabaseAdmin,
  role: LifecycleRole,
  userId: string,
): Promise<boolean> {
  try {
    switch (role) {
      case "renter":
        // saved a search OR booked/enquired a viewing
        return (
          (await hasRowFor(supabase, "saved_searches", userId)) ||
          (await hasRowFor(supabase, "viewings", userId))
        );
      case "homebuyer":
        // saved a search OR saved a property OR booked a viewing
        return (
          (await hasRowFor(supabase, "saved_searches", userId)) ||
          (await hasRowFor(supabase, "saved_properties", userId)) ||
          (await hasRowFor(supabase, "viewings", userId))
        );
      case "landlord":
        // listed a rental property
        // TODO: also stop on "added a tenancy" / "started referencing" once a
        // user-keyed tenancy/referencing table is confirmed; listings is the
        // reliable signal today.
        return await hasRowFor(supabase, "listings", userId);
      case "seller":
        // requested/completed a valuation OR created a sale listing
        return (
          (await hasRowFor(supabase, "valuation_sessions", userId)) ||
          (await hasRowFor(supabase, "listings", userId))
        );
      case "agent":
        // published first listing OR posted a job
        // TODO: also stop on "completed agency profile" once a user-keyed
        // agency-profile completeness flag is confirmed.
        return (
          (await hasRowFor(supabase, "listings", userId)) ||
          (await hasRowFor(supabase, "service_requests", userId))
        );
      default:
        return false;
    }
  } catch {
    // Fail-open on a query error: don't stop the sequence on an infra blip.
    return false;
  }
}

export const lifecycleDrip = inngest.createFunction(
  {
    id: "lifecycle-drip",
    name: "Role-based lifecycle email drip",
    idempotency: "event.data.userId + '-' + event.data.role",
  },
  { event: "lifecycle/role.assigned" },
  async ({ event, step }) => {
    const { userId, email, role: rawRole } = event.data as {
      userId: string;
      email: string;
      role: string;
    };

    const role = toLifecycleRole(rawRole);
    if (!role || !email) {
      return { status: "skipped", reason: "no_sequence_for_role", role: rawRole };
    }

    const sequence = LIFECYCLE_SEQUENCES[role];

    // Step 0: ensure enrolment (idempotent via unique (user_id, role)).
    await step.run("ensure-enrolment", async () => {
      const supabase = createAdminClient();
      await supabase
        .from("lifecycle_email_enrolments")
        .upsert(
          { user_id: userId, role, status: "active", updated_at: new Date().toISOString() },
          { onConflict: "user_id,role", ignoreDuplicates: true },
        );
      return { enrolled: true };
    });

    let previousDelay = 0;
    let sent = 0;

    for (const drip of sequence) {
      const deltaDays = drip.delayDays - previousDelay;
      previousDelay = drip.delayDays;
      if (deltaDays > 0) {
        await step.sleep(`wait-${drip.key}`, `${deltaDays}d`);
      }

      const outcome: StepOutcome = await step.run(`send-${drip.key}`, async (): Promise<StepOutcome> => {
        const supabase = createAdminClient();

        // Reload the profile — stop the whole sequence if the active role no
        // longer matches (role switch or account deletion).
        const { data: profile } = await supabase
          .from("profiles")
          .select("active_role, display_name")
          .eq("id", userId)
          .single();

        const currentRole = (profile as { active_role?: string } | null)?.active_role;
        if (currentRole !== role) {
          return { action: "stopped", reason: "role_changed" };
        }

        // Behaviour stop condition — end early if the user already activated.
        if (await hasActivated(supabase, role, userId)) {
          return { action: "stopped", reason: "activated" };
        }

        const firstName =
          (profile as { display_name?: string | null } | null)?.display_name?.split(" ")[0] ??
          undefined;

        const result = await sendLifecycleStep({
          userId,
          email,
          role,
          step: drip,
          firstName,
        });
        return { action: "send", result };
      });

      if (outcome.action === "stopped") {
        await step.run(`mark-stopped-${drip.key}`, async () => {
          const supabase = createAdminClient();
          await supabase
            .from("lifecycle_email_enrolments")
            .update({ status: "stopped", updated_at: new Date().toISOString() })
            .eq("user_id", userId)
            .eq("role", role);
          return { stopped: true };
        });
        return { status: "stopped", reason: outcome.reason, sent, role };
      }

      if (outcome.result === "sent") sent += 1;
    }

    await step.run("mark-completed", async () => {
      const supabase = createAdminClient();
      await supabase
        .from("lifecycle_email_enrolments")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("role", role);
      return { completed: true };
    });

    return { status: "completed", sent, role };
  },
);
