import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, Gavel, PoundSterling, Scale } from "lucide-react";
import { BriefingSubscribeForm } from "@/components/briefing/BriefingSubscribeForm";
import { BRIEFING_EDITIONS } from "@/content/briefing";

const TITLE = "The Independent Agent Briefing";
const DESCRIPTION =
  "A weekly email for independent estate and lettings agents: the Rightmove CAT case, portal fee benchmarks, and Renters' Rights Act compliance. Not a sales letter.";

export const metadata: Metadata = {
  title: `${TITLE} | TrueDeed`,
  description: DESCRIPTION,
  alternates: { canonical: "/agent-briefing" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/agent-briefing",
    images: [
      {
        url: `/api/og/briefing?title=${encodeURIComponent(TITLE)}`,
        width: 1200,
        height: 630,
        alt: TITLE,
      },
    ],
  },
};

const COVERAGE = [
  {
    icon: Gavel,
    title: "CAT case tracking",
    body: "Plain-English updates on the collective claim against Rightmove — what the claim alleges, procedural dates, and what each step actually decides. Alleged means alleged: we report the case, we don't prejudge it.",
  },
  {
    icon: PoundSterling,
    title: "Fee benchmarks",
    body: "What agents are actually paying across portals and software, sourced and dated, so you can negotiate your own stack from evidence rather than anecdote.",
  },
  {
    icon: Scale,
    title: "Renters' Rights Act compliance",
    body: "Deadlines, guidance changes, and practical checklists as the Renters' Rights Act rolls out — what changes for your lettings book and when.",
  },
] as const;

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

type Props = Readonly<{
  searchParams: Promise<{ subscribed?: string }>;
}>;

export default async function AgentBriefingPage({ searchParams }: Props) {
  const { subscribed } = await searchParams;
  const justConfirmed = subscribed === "1";
  const latestEditions = BRIEFING_EDITIONS.slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section
        aria-labelledby="briefing-heading"
        className="bg-brand-primary text-white"
      >
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-brand-primary-lighter">
            Weekly · Free · For independent agents
          </p>
          <h1
            id="briefing-heading"
            className="font-heading text-4xl font-bold leading-tight sm:text-5xl"
          >
            The Independent Agent Briefing
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-white/85">
            One email a week for independent estate and lettings agents: what
            is happening in the Rightmove Competition Appeal Tribunal case,
            what agents are actually paying for their portal stack, and what
            the Renters&apos; Rights Act requires of you next.
          </p>
          <p className="mt-4 text-base leading-relaxed text-white/70">
            What it is not: a sales letter. No pitches, no &quot;book a
            demo&quot;. TrueDeed appears in the footer. That&apos;s it.
          </p>
          <div className="mt-8 rounded-2xl bg-white p-6 shadow-lg">
            <BriefingSubscribeForm
              source="agent_briefing_landing"
              initialConfirmed={justConfirmed}
            />
          </div>
        </div>
      </section>

      {/* What we'll cover */}
      <section
        aria-labelledby="coverage-heading"
        className="mx-auto max-w-5xl px-4 py-16 sm:px-6"
      >
        <h2
          id="coverage-heading"
          className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl"
        >
          What we&apos;ll cover
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {COVERAGE.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-lg bg-brand-primary-lighter">
                <Icon className="size-5 text-brand-primary" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-heading text-lg font-semibold text-neutral-900">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                {body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* From the archive */}
      <section
        aria-labelledby="archive-heading"
        className="border-t border-neutral-200 bg-muted"
      >
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2
              id="archive-heading"
              className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl"
            >
              From the archive
            </h2>
            <Link
              href="/agent-briefing/archive"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary transition-colors hover:text-brand-primary-light"
            >
              Browse all editions
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <ul className="mt-8 space-y-4">
            {latestEditions.map((edition) => (
              <li key={edition.slug}>
                <Link
                  href={`/agent-briefing/archive/${edition.slug}`}
                  className="group flex items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-colors hover:border-brand-primary/40"
                >
                  <span className="mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary-lighter">
                    <FileText className="size-4 text-brand-primary" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Edition {edition.edition} ·{" "}
                      {DATE_FORMAT.format(new Date(edition.date))}
                    </span>
                    <span className="mt-1 block font-heading text-lg font-semibold text-neutral-900 transition-colors group-hover:text-brand-primary">
                      {edition.title}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-neutral-600">
                      {edition.summary}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
