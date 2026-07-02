import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BRIEFING_EDITIONS } from "@/content/briefing";

export const metadata: Metadata = {
  title: "Briefing archive | The Independent Agent Briefing | TrueDeed",
  description:
    "Every past edition of the Independent Agent Briefing — CAT case updates, fee benchmarks, and Renters' Rights Act compliance for independent agents.",
  alternates: { canonical: "/agent-briefing/archive" },
};

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default function BriefingArchivePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link
        href="/agent-briefing"
        className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary transition-colors hover:text-brand-primary-light"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        The Independent Agent Briefing
      </Link>
      <h1 className="mt-4 font-heading text-3xl font-bold text-neutral-900 sm:text-4xl">
        Briefing archive
      </h1>
      <p className="mt-3 text-neutral-600">
        Every edition we&apos;ve sent, in full. Newest first.
      </p>
      <ul className="mt-10 space-y-4">
        {BRIEFING_EDITIONS.map((edition) => (
          <li key={edition.slug}>
            <Link
              href={`/agent-briefing/archive/${edition.slug}`}
              className="group block rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-colors hover:border-brand-primary/40"
            >
              <span className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                Edition {edition.edition} ·{" "}
                {DATE_FORMAT.format(new Date(edition.date))}
              </span>
              <span className="mt-1 block font-heading text-xl font-semibold text-neutral-900 transition-colors group-hover:text-brand-primary">
                {edition.title}
              </span>
              <span className="mt-2 block text-sm leading-relaxed text-neutral-600">
                {edition.summary}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
