import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { BriefingSubscribeForm } from "@/components/briefing/BriefingSubscribeForm";
import { BRIEFING_EDITIONS, getBriefingEdition } from "@/content/briefing";

type Props = Readonly<{
  params: Promise<{ slug: string }>;
}>;

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function generateStaticParams(): { slug: string }[] {
  return BRIEFING_EDITIONS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const edition = getBriefingEdition(slug);
  if (!edition) {
    return { title: "Edition not found | The Independent Agent Briefing" };
  }

  return {
    title: `${edition.title} | The Independent Agent Briefing`,
    description: edition.summary,
    alternates: { canonical: `/agent-briefing/archive/${slug}` },
    openGraph: {
      title: edition.title,
      description: edition.summary,
      type: "article",
      url: `/agent-briefing/archive/${slug}`,
      publishedTime: edition.date,
      images: [
        {
          url: `/api/og/briefing?title=${encodeURIComponent(edition.title)}&edition=${encodeURIComponent(`Edition ${edition.edition}`)}`,
          width: 1200,
          height: 630,
          alt: edition.title,
        },
      ],
    },
  };
}

export default async function BriefingEditionPage({ params }: Props) {
  const { slug } = await params;
  const edition = getBriefingEdition(slug);

  if (!edition) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link
        href="/agent-briefing/archive"
        className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary transition-colors hover:text-brand-primary-light"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Briefing archive
      </Link>

      <article className="mt-6">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-primary">
            The Independent Agent Briefing · Edition {edition.edition}
          </p>
          <h1 className="mt-3 font-heading text-3xl font-bold leading-snug text-neutral-900 sm:text-4xl">
            {edition.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-neutral-600">
            {edition.summary}
          </p>
        </header>

        {edition.body.map((section) => (
          <section key={section.heading} className="mt-10">
            <h2 className="font-heading text-2xl font-bold text-neutral-900">
              {section.heading}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p
                key={paragraph.slice(0, 60)}
                className="mt-4 leading-relaxed text-neutral-700"
              >
                {paragraph}
              </p>
            ))}
            {section.sources && section.sources.length > 0 ? (
              <aside className="mt-5 rounded-xl border border-neutral-200 bg-muted/60 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Sources
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {section.sources.map((source) => (
                    <li key={source.url}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-start gap-1.5 text-sm text-brand-primary underline-offset-2 transition-colors hover:underline"
                      >
                        <ExternalLink
                          className="mt-0.5 size-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        {source.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </aside>
            ) : null}
          </section>
        ))}

        <footer className="mt-12 border-t border-neutral-200 pt-6">
          <p className="text-sm text-neutral-500">
            Published {DATE_FORMAT.format(new Date(edition.date))} · The
            Independent Agent Briefing, by TrueDeed
          </p>
        </footer>
      </article>

      {/* Subscribe CTA */}
      <section
        aria-labelledby="subscribe-cta-heading"
        className="mt-12 rounded-2xl border border-brand-primary/20 bg-brand-primary-lighter/40 p-6 sm:p-8"
      >
        <h2
          id="subscribe-cta-heading"
          className="font-heading text-xl font-bold text-neutral-900"
        >
          Get the next edition in your inbox
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          One email a week for independent agents — the CAT case, fee
          benchmarks, and Renters&apos; Rights Act compliance. Not a sales
          letter: TrueDeed appears in the footer. That&apos;s it.
        </p>
        <div className="mt-5">
          <BriefingSubscribeForm source="agent_briefing_archive" />
        </div>
      </section>
    </div>
  );
}
