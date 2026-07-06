"use client";

import { useId, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { CalendarPlus, MailCheck, ShieldAlert } from "lucide-react";

import {
  RRA_DEADLINES_CHECKED_DATE,
  type AppliesTo,
  type DeadlineEntry,
} from "@/content/rra-deadlines";
import {
  trackBriefingSubscribed,
  trackToolStarted,
} from "@/lib/analytics/influence-events";

type Region = "england" | "wales" | "scotland" | "northern_ireland";

type ProfileAnswers = Readonly<{
  tenancyPreMay?: boolean;
  region?: Region;
  hasAgent?: boolean;
}>;

type FormStatus = "idle" | "submitting" | "check_inbox" | "confirmed" | "error";

type Props = Readonly<{
  entries: ReadonlyArray<DeadlineEntry>;
  /** True when arriving from the confirm email (?subscribed=1). */
  initialConfirmed: boolean;
}>;

const GROUPS: ReadonlyArray<{ key: AppliesTo; heading: string; blurb: string }> = [
  {
    key: "all_landlords",
    heading: "Every landlord in England",
    blurb: "These apply to your whole lettings position, however your tenancies started.",
  },
  {
    key: "pre_may_tenancies",
    heading: "Tenancies that began before 1 May 2026",
    blurb: "Transitional rules for tenancies converted from the old assured shorthold system.",
  },
  {
    key: "new_tenancies",
    heading: "Tenancies starting on or after 1 May 2026",
    blurb: "Rules that only bite on lets set up under the new system.",
  },
];

const DATE_LABEL = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const MESSAGES: Record<Exclude<FormStatus, "idle" | "submitting">, string> = {
  check_inbox:
    "Check your inbox to confirm — reminders only start once you click the link.",
  confirmed: "You're confirmed. Deadline reminders will land in your inbox.",
  error: "Something went wrong. Please try again.",
};

function sortEntries(entries: ReadonlyArray<DeadlineEntry>): DeadlineEntry[] {
  const dated = entries.filter((e) => e.kind === "dated");
  const triggers = entries.filter((e) => e.kind === "trigger");
  return [
    ...dated.slice().sort((a, b) => a.date.localeCompare(b.date)),
    ...triggers,
  ];
}

function DeadlineCard({
  entry,
  hasAgent,
}: Readonly<{ entry: DeadlineEntry; hasAgent?: boolean }>) {
  // Pure render: "already in force" is judged against the content checked
  // date (the same date stamped on the page), not wall-clock time.
  const isPast = entry.kind === "dated" && entry.date < RRA_DEADLINES_CHECKED_DATE;

  return (
    <li className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">
          {entry.kind === "dated"
            ? DATE_LABEL.format(new Date(`${entry.date}T00:00:00Z`))
            : "Date not yet announced"}
        </p>
        {isPast && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            Already in force
          </span>
        )}
      </div>
      <h3 className="mt-2 font-heading text-lg font-semibold text-neutral-900">
        {entry.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">{entry.summary}</p>
      {entry.kind === "trigger" && (
        <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">When the clock starts:</span>{" "}
          {entry.trigger}
        </p>
      )}
      {hasAgent && entry.agentUsuallyHandles && (
        <p className="mt-3 text-xs font-medium text-brand-primary">
          Your managing agent usually handles this day-to-day — the legal duty
          stays with you.
        </p>
      )}
      <p className="mt-3 text-xs text-neutral-500">
        Source:{" "}
        {entry.citations.map((citation, index) => (
          <span key={citation.url}>
            {index > 0 && " · "}
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-neutral-300 underline-offset-2 hover:text-brand-primary"
            >
              {citation.instrument}, {citation.section}
            </a>
          </span>
        ))}
      </p>
    </li>
  );
}

export function DeadlineDiaryClient({ entries, initialConfirmed }: Props) {
  const emailId = useId();
  const regionId = useId();

  const [email, setEmail] = useState("");
  const [tenancyPreMay, setTenancyPreMay] = useState<boolean | undefined>(undefined);
  const [region, setRegion] = useState<Region | undefined>(undefined);
  const [hasAgent, setHasAgent] = useState<boolean | undefined>(undefined);
  const [status, setStatus] = useState<FormStatus>(
    initialConfirmed ? "confirmed" : "idle",
  );
  const [calendarUrl, setCalendarUrl] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  // Personalisation applies as soon as answers are given — no submit needed.
  const answers: ProfileAnswers = { tenancyPreMay, region, hasAgent };

  const sorted = useMemo(() => sortEntries(entries), [entries]);

  const submitting = status === "submitting";
  const isDone = status === "check_inbox" || status === "confirmed";
  const message =
    status === "idle" || status === "submitting" ? null : MESSAGES[status];

  function markStarted() {
    if (!started) {
      setStarted(true);
      trackToolStarted("deadline_diary");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || isDone) return;

    setStatus("submitting");

    try {
      const [subscribeRes, profileRes] = await Promise.all([
        fetch("/api/newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            source: "deadline_diary_landing",
            audience: "landlord_diary",
          }),
        }),
        fetch("/api/landlords/deadline-diary/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, tenancyPreMay, region, hasAgent }),
        }),
      ]);

      const subscribeData: { ok?: boolean; requiresConfirmation?: boolean } =
        await subscribeRes.json().catch(() => ({}));
      if (!subscribeRes.ok || !subscribeData.ok) {
        setStatus("error");
        return;
      }

      // Profile capture is best-effort: personalisation already works from
      // local state, so a profile failure must not fail the subscription.
      const profileData: { ok?: boolean; calendarUrl?: string } = profileRes.ok
        ? await profileRes.json().catch(() => ({}))
        : {};
      if (profileData.calendarUrl) {
        setCalendarUrl(profileData.calendarUrl);
      }

      trackBriefingSubscribed("landlord_diary");
      setStatus(subscribeData.requiresConfirmation ? "check_inbox" : "confirmed");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="space-y-12">
      {/* Signup + profile questions */}
      <section
        aria-labelledby="diary-signup-heading"
        className="rounded-2xl border border-border bg-white p-6 shadow-lg sm:p-8"
      >
        <h2
          id="diary-signup-heading"
          className="font-heading text-xl font-semibold text-neutral-900"
        >
          Get your personalised deadline diary
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Answer three quick questions and we&apos;ll tailor the timeline below
          — then confirm your email to get reminders 30, 7, and 1 day before
          each dated deadline, plus a calendar feed.
        </p>

        {isDone ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-6 flex items-start gap-3 rounded-xl border border-brand-primary/20 bg-brand-primary-lighter/40 p-4"
          >
            <MailCheck
              className="mt-0.5 size-5 shrink-0 text-brand-primary"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-medium text-brand-primary">{message}</p>
              {calendarUrl && (
                <a
                  href={calendarUrl}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary underline underline-offset-2"
                >
                  <CalendarPlus className="size-4" aria-hidden="true" />
                  Add the dated deadlines to your calendar (.ics)
                </a>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
            <fieldset onChange={markStarted}>
              <legend className="text-sm font-medium text-neutral-900">
                Do you have a tenancy that began before 1 May 2026?
              </legend>
              <div className="mt-2 flex gap-4">
                {[
                  { label: "Yes", value: true },
                  { label: "No", value: false },
                ].map((option) => (
                  <label
                    key={option.label}
                    className="flex items-center gap-2 text-sm text-neutral-700"
                  >
                    <input
                      type="radio"
                      name="tenancy-pre-may"
                      checked={tenancyPreMay === option.value}
                      onChange={() => setTenancyPreMay(option.value)}
                      className="accent-brand-primary"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label
                htmlFor={regionId}
                className="text-sm font-medium text-neutral-900"
              >
                Where are your properties?
              </label>
              <select
                id={regionId}
                value={region ?? ""}
                onChange={(event) => {
                  markStarted();
                  setRegion((event.target.value || undefined) as Region | undefined);
                }}
                className="mt-2 w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 shadow-sm outline-none focus:ring-2 focus:ring-brand-primary/30"
              >
                <option value="">Select a nation…</option>
                <option value="england">England</option>
                <option value="wales">Wales</option>
                <option value="scotland">Scotland</option>
                <option value="northern_ireland">Northern Ireland</option>
              </select>
            </div>

            <fieldset onChange={markStarted}>
              <legend className="text-sm font-medium text-neutral-900">
                Does a managing agent look after your tenancies?
              </legend>
              <div className="mt-2 flex gap-4">
                {[
                  { label: "Yes", value: true },
                  { label: "No", value: false },
                ].map((option) => (
                  <label
                    key={option.label}
                    className="flex items-center gap-2 text-sm text-neutral-700"
                  >
                    <input
                      type="radio"
                      name="has-agent"
                      checked={hasAgent === option.value}
                      onChange={() => setHasAgent(option.value)}
                      className="accent-brand-primary"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor={emailId} className="sr-only">
                Email address
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id={emailId}
                  type="email"
                  required
                  value={email}
                  onChange={(event) => {
                    markStarted();
                    setEmail(event.target.value);
                  }}
                  placeholder="you@example.co.uk"
                  autoComplete="email"
                  disabled={submitting}
                  aria-invalid={status === "error" ? true : undefined}
                  className="flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm outline-none transition-colors placeholder:text-neutral-400 focus:ring-2 focus:ring-brand-primary/30 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="shrink-0 rounded-lg bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-light disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? "Subscribing…" : "Get deadline reminders"}
                </button>
              </div>
              <p
                role="status"
                aria-live="polite"
                className={`mt-3 min-h-[1.25rem] text-sm ${status === "error" ? "text-red-600" : "text-brand-primary"}`}
              >
                {message}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                Double opt-in — nothing is sent until you confirm. Unsubscribe
                in one click from every email; no data shared with anyone.
              </p>
            </div>
          </form>
        )}
      </section>

      {/* Personalisation notices */}
      {answers.region && answers.region !== "england" && (
        <div
          role="note"
          className="flex items-start gap-3 rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground"
        >
          <ShieldAlert
            className="mt-0.5 size-5 shrink-0 text-brand-primary"
            aria-hidden="true"
          />
          <p>
            <span className="font-medium text-foreground">
              The Renters&apos; Rights Act 2025 tenancy reforms apply in England.
            </span>{" "}
            Wales, Scotland, and Northern Ireland have separate rental regimes —
            the timeline below covers your English lettings only.
          </p>
        </div>
      )}

      {/* Timeline, grouped by who it applies to */}
      {GROUPS.map((group) => {
        const groupEntries = sorted.filter((entry) =>
          entry.appliesTo.includes(group.key),
        );
        if (groupEntries.length === 0) return null;

        const dimmed =
          group.key === "pre_may_tenancies" && answers.tenancyPreMay === false;

        return (
          <section key={group.key} aria-labelledby={`group-${group.key}`}>
            <h2
              id={`group-${group.key}`}
              className="font-heading text-2xl font-semibold text-neutral-900"
            >
              {group.heading}
            </h2>
            <p className="mt-1 text-sm text-neutral-600">{group.blurb}</p>
            {dimmed && (
              <p className="mt-2 text-sm font-medium text-brand-primary">
                Based on your answers this section doesn&apos;t apply to you —
                kept here for reference.
              </p>
            )}
            <ul className={`mt-5 space-y-4 ${dimmed ? "opacity-60" : ""}`}>
              {groupEntries.map((entry) => (
                <DeadlineCard
                  key={`${group.key}-${entry.id}`}
                  entry={entry}
                  hasAgent={answers.hasAgent}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
