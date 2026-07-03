import type { Metadata } from "next";

import { ContentVersionStamp } from "@/components/trust/ContentVersionStamp";
import { NotLegalAdviceBanner } from "@/components/trust/NotLegalAdviceBanner";
import {
  RRA_DEADLINES,
  RRA_DEADLINES_CHECKED_DATE,
  RRA_DEADLINES_VERSION,
} from "@/content/rra-deadlines";
import { DeadlineDiaryClient } from "./DeadlineDiaryClient";

const TITLE = "Landlord Deadline Diary — Renters' Rights Act 2025";
const DESCRIPTION =
  "Every Renters' Rights Act 2025 compliance deadline for landlords in England, with statutory sources. Personalise the timeline, get email reminders 30, 7, and 1 day before each dated deadline, and subscribe to the calendar feed.";

export const metadata: Metadata = {
  title: `${TITLE} | TrueDeed`,
  description: DESCRIPTION,
  alternates: { canonical: "/landlords/deadline-diary" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/landlords/deadline-diary",
  },
};

type Props = Readonly<{
  searchParams: Promise<{ subscribed?: string }>;
}>;

export default async function DeadlineDiaryPage({ searchParams }: Props) {
  const { subscribed } = await searchParams;
  const justConfirmed = subscribed === "1";

  return (
    <div>
      {/* Hero */}
      <section
        aria-labelledby="diary-heading"
        className="bg-brand-primary text-white"
      >
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-brand-primary-lighter">
            Free · For landlords in England · Renters&apos; Rights Act 2025
          </p>
          <h1
            id="diary-heading"
            className="font-heading text-4xl font-bold leading-tight sm:text-5xl"
          >
            The Landlord Deadline Diary
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-white/85">
            The Renters&apos; Rights Act 2025 lands in phases — some deadlines
            have published dates, others are still waiting on regulations.
            This diary keeps both honest: every dated deadline cited to its
            statutory source, every unannounced one labelled as exactly that.
          </p>
          <p className="mt-4 text-base leading-relaxed text-white/70">
            Subscribe and we&apos;ll remind you 30, 7, and 1 day before each
            dated deadline — and email you when an &quot;expected&quot; date
            becomes a real one.
          </p>
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:px-6">
        <NotLegalAdviceBanner variant="rights" />
        <DeadlineDiaryClient
          entries={RRA_DEADLINES}
          initialConfirmed={justConfirmed}
        />
        <ContentVersionStamp
          checkedDate={RRA_DEADLINES_CHECKED_DATE}
          version={RRA_DEADLINES_VERSION}
        />
      </div>
    </div>
  );
}
