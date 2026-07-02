import Link from "next/link";

import type { Pledge } from "@/config/pledges";

import { PledgeViewTracker } from "./PledgeViewTracker";

/**
 * Shared renderer for a single pledge page. Renders entirely from the
 * `Pledge` config object (src/config/pledges.ts) so published wording can
 * never drift between pages. Server Component; the analytics ping is a tiny
 * client mount component.
 */
export function PledgeArticle({ pledge }: Readonly<{ pledge: Pledge }>) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <PledgeViewTracker slug={pledge.slug} />

      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-8 flex items-center gap-2 text-sm text-neutral-500"
      >
        <Link href="/" className="transition-colors hover:text-brand-primary">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href="/pledges"
          className="transition-colors hover:text-brand-primary"
        >
          Pledges
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-neutral-900">{pledge.title}</span>
      </nav>

      <article>
        {/* The pledge — one sentence, big */}
        <header className="mb-12">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-primary">
            A public pledge
          </p>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
            {pledge.title}
          </h1>
          <p className="mt-6 border-l-4 border-brand-primary pl-5 font-heading text-xl leading-relaxed text-neutral-800 sm:text-2xl">
            {pledge.oneSentence}
          </p>
        </header>

        {/* What it binds us to */}
        <section id="what-it-binds-us-to" className="mb-12">
          <h2 className="mb-4 font-heading text-2xl font-bold text-neutral-900">
            What it binds us to
          </h2>
          <ul className="space-y-3">
            {pledge.whatItBindsUsTo.map((item) => (
              <li key={item} className="flex gap-3 text-neutral-700">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-primary"
                />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* How to verify */}
        <section id="how-to-verify" className="mb-12">
          <h2 className="mb-4 font-heading text-2xl font-bold text-neutral-900">
            How to verify we keep it
          </h2>
          <ol className="space-y-3">
            {pledge.howToVerify.map((item, index) => (
              <li key={item} className="flex gap-3 text-neutral-700">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-primary-lighter text-xs font-bold text-brand-primary">
                  {index + 1}
                </span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Dated changelog */}
        <section
          id="changelog"
          className="rounded-2xl border border-neutral-200 bg-muted p-6"
        >
          <h2 className="mb-4 font-heading text-lg font-bold text-neutral-900">
            Changelog
          </h2>
          <p className="mb-4 text-sm text-neutral-600">
            Every change to this pledge is recorded here, dated. If this list
            is short, that is the point.
          </p>
          <ul className="space-y-2">
            {pledge.changelog.map((entry) => (
              <li
                key={`${entry.date}-${entry.change}`}
                className="flex flex-wrap items-baseline gap-x-3 text-sm"
              >
                <time
                  dateTime={entry.date}
                  className="font-mono text-neutral-500"
                >
                  {entry.date}
                </time>
                <span className="text-neutral-800">{entry.change}</span>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </div>
  );
}
