/**
 * Inngest function: Landlord Deadline Diary reminder drip (Influence
 * Strategy 3.2).
 *
 * Deadlines are fixed statutory calendar dates shared by every subscriber —
 * so instead of one long-lived step.sleep sequence per subscriber (the
 * lifecycle-drip pattern, which fits per-user relative schedules), a daily
 * cron computes which dated deadlines are exactly T-30 / T-7 / T-1 away and
 * fans a reminder out to every CONFIRMED landlord_diary subscriber. The
 * subscriber list is re-read at send time, so unsubscribes between runs are
 * always respected.
 *
 * Every email carries the per-audience unsubscribe link and the subscriber's
 * .ics calendar link (both HMAC tokens from src/lib/newsletter-token.ts).
 * Sends go through sendLandlordDiaryReminder, which never throws.
 */

import { appUrl } from "@/config/brand";
import { datedDeadlines, type DatedDeadline } from "@/content/rra-deadlines";
import { inngest } from "@/inngest/client";
import { generateNewsletterToken } from "@/lib/newsletter-token";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendLandlordDiaryReminder } from "@/services/email/email-service";

const AUDIENCE = "landlord_diary";

/** Reminder offsets, in days before each dated deadline. */
export const REMINDER_OFFSETS = [30, 7, 1] as const;

export type ReminderOffset = (typeof REMINDER_OFFSETS)[number];

export type DueReminder = Readonly<{
  entry: DatedDeadline;
  daysUntil: ReminderOffset;
}>;

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/**
 * Pure schedule computation: which dated deadlines are exactly 30, 7, or 1
 * whole UTC days away from `now`? Past deadlines never match (daysUntil
 * would be ≤ 0).
 */
export function computeDueReminders(
  entries: ReadonlyArray<DatedDeadline>,
  now: Date,
): DueReminder[] {
  const today = startOfUtcDay(now);
  const due: DueReminder[] = [];
  for (const entry of entries) {
    const deadline = Date.parse(`${entry.date}T00:00:00Z`);
    if (Number.isNaN(deadline)) continue;
    const daysUntil = Math.round((deadline - today) / DAY_MS);
    const offset = REMINDER_OFFSETS.find((o) => o === daysUntil);
    if (offset !== undefined) {
      due.push({ entry, daysUntil: offset });
    }
  }
  return due;
}

const DATE_LABEL = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function buildLinks(email: string): { unsubscribeUrl: string; calendarUrl: string } {
  const unsubscribeToken = generateNewsletterToken(email, AUDIENCE, "unsubscribe");
  const calendarToken = generateNewsletterToken(email, AUDIENCE, "calendar");
  return {
    unsubscribeUrl: appUrl(
      `/api/newsletter/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`,
    ),
    calendarUrl: appUrl(
      `/api/landlords/deadline-diary/${encodeURIComponent(calendarToken)}/calendar.ics`,
    ),
  };
}

export const landlordDeadlineDiary = inngest.createFunction(
  {
    id: "landlord-deadline-diary",
    name: "Landlord Deadline Diary reminders (T-30/T-7/T-1)",
    retries: 3,
  },
  [
    // 08:00 UTC daily — mid-morning UK inbox time year-round.
    { cron: "0 8 * * *" },
    // Manual trigger for ops/backfill.
    { event: "landlord-diary/reminders.requested" },
  ],
  async ({ step }) => {
    const due = computeDueReminders(datedDeadlines(), new Date());
    if (due.length === 0) {
      return { status: "no_reminders_due" };
    }

    const subscribers = await step.run("load-subscribers", async () => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("email")
        .eq("audience", AUDIENCE)
        .eq("status", "subscribed");
      if (error) throw new Error("deadline-diary: subscriber load failed");
      return (data ?? []).map((row: { email: string }) => row.email);
    });

    if (subscribers.length === 0) {
      return { status: "no_subscribers", remindersDue: due.length };
    }

    let sent = 0;
    for (const { entry, daysUntil } of due) {
      const count = await step.run(
        `remind-${entry.id}-t${daysUntil}`,
        async () => {
          let stepSent = 0;
          for (const email of subscribers) {
            const { unsubscribeUrl, calendarUrl } = buildLinks(email);
            await sendLandlordDiaryReminder({
              to: email,
              deadlineTitle: entry.title,
              deadlineDateLabel: DATE_LABEL.format(
                new Date(`${entry.date}T00:00:00Z`),
              ),
              daysUntil,
              summary: entry.summary,
              citationUrl: entry.citations[0]?.url,
              calendarUrl,
              unsubscribeUrl,
            });
            stepSent += 1;
          }
          return stepSent;
        },
      );
      sent += count;
    }

    return { status: "sent", reminders: due.length, sent };
  },
);
