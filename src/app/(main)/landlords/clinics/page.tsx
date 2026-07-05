/**
 * Landlord Transition Clinics — /landlords/clinics
 * Influence Strategy 3.3
 *
 * Informational page only (no legal/rights advice given in clinics).
 * FAQPage JSON-LD follows the faq-jsonld helper pattern used elsewhere.
 */

import type { Metadata } from "next";
import Link from "next/link";

import {
  CLINICS_CONTENT_VERSION,
  PAST_SESSIONS,
  UPCOMING_SESSION,
} from "@/content/clinics/sessions";
import { faqJsonLd } from "@/lib/seo/faq-jsonld";

const TITLE = "Landlord Transition Clinics — Renters' Rights Act 2025";
const DESCRIPTION =
  "Free live Q&A clinics for landlords navigating the Renters' Rights Act 2025. Watch recordings, read extracted FAQs, and sign up to be notified of the next session.";

export const metadata: Metadata = {
  title: `${TITLE} | TrueDeed`,
  description: DESCRIPTION,
  alternates: { canonical: "/landlords/clinics" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/landlords/clinics",
  },
};

/** Collect every FAQ across all past sessions for the JSON-LD block. */
function allFaqs() {
  return PAST_SESSIONS.flatMap((s) =>
    s.faqs.map((faq) => ({ question: faq.q, answer: faq.a })),
  );
}

export default function ClinicsPage() {
  const faqs = allFaqs();
  const jsonLd = faqJsonLd(faqs);

  return (
    <div>
      {/* FAQPage JSON-LD — always emitted; mainEntity is empty until sessions are added */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section
        aria-labelledby="clinics-heading"
        className="bg-brand-primary text-white"
      >
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-brand-primary-lighter">
            Free · For landlords in England · Renters&apos; Rights Act 2025
          </p>
          <h1
            id="clinics-heading"
            className="font-heading text-4xl font-bold leading-tight sm:text-5xl"
          >
            Landlord Transition Clinics
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-white/85">
            Live Q&amp;A sessions where landlords ask the questions that matter.
            Each clinic covers a specific aspect of the Renters&apos; Rights Act
            2025 — recordings and extracted FAQs stay here permanently.
          </p>
        </div>
      </section>

      {/* Body */}
      <div className="mx-auto max-w-3xl space-y-12 px-4 py-12 sm:px-6">

        {/* Next session block */}
        <section aria-labelledby="next-session-heading">
          <h2 id="next-session-heading" className="text-2xl font-bold mb-4">
            Next Session
          </h2>

          {UPCOMING_SESSION ? (
            <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-6 space-y-3">
              {UPCOMING_SESSION.date && (
                <p className="text-sm font-semibold text-brand-primary">
                  <time dateTime={UPCOMING_SESSION.date}>
                    {new Date(UPCOMING_SESSION.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                </p>
              )}
              <h3 className="text-xl font-semibold">{UPCOMING_SESSION.title}</h3>
              <p className="text-muted-foreground">{UPCOMING_SESSION.description}</p>
              {/* Webinar link stub — populated when booking URL is available */}
              <p className="text-sm text-muted-foreground italic">
                Registration link coming soon.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-6">
              <p className="text-base text-muted-foreground">
                No upcoming sessions currently scheduled.{" "}
                <Link
                  href="/landlords/deadline-diary?utm_source=clinics"
                  className="font-medium text-brand-primary underline underline-offset-2 hover:no-underline"
                >
                  Sign up to the Landlord Deadline Diary
                </Link>{" "}
                to be notified when the next clinic is announced.
              </p>
            </div>
          )}
        </section>

        {/* Past sessions library */}
        {PAST_SESSIONS.length > 0 && (
          <section aria-labelledby="past-sessions-heading">
            <h2 id="past-sessions-heading" className="text-2xl font-bold mb-6">
              Past Sessions
            </h2>
            <div className="space-y-10">
              {PAST_SESSIONS.map((session) => (
                <article
                  key={session.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4"
                >
                  {session.date && (
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <time dateTime={session.date}>
                        {new Date(session.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </time>
                    </p>
                  )}
                  <h3 className="text-xl font-semibold">{session.title}</h3>
                  <p className="text-muted-foreground text-sm">{session.description}</p>

                  {/* Recording embed stub */}
                  {session.recordingUrl && (
                    <div className="rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-video flex items-center justify-center">
                      <a
                        href={session.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-primary font-medium underline underline-offset-2 hover:no-underline text-sm"
                      >
                        Watch recording ↗
                      </a>
                    </div>
                  )}

                  {/* Transcript excerpt */}
                  {session.transcriptExcerpt && (
                    <blockquote className="border-l-2 border-brand-primary/40 pl-4 text-sm text-muted-foreground italic">
                      {session.transcriptExcerpt}
                    </blockquote>
                  )}

                  {/* Extracted FAQ items */}
                  {session.faqs.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Questions from this session
                      </h4>
                      <div className="space-y-2">
                        {session.faqs.map((faq, i) => (
                          <details
                            key={i}
                            className="group border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
                          >
                            <summary className="flex items-center justify-between p-4 cursor-pointer font-medium text-sm list-none hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              {faq.q}
                            </summary>
                            <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                              {faq.a}
                            </div>
                          </details>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Reminder signup — always visible */}
        <section
          aria-labelledby="reminder-heading"
          className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-6 space-y-3"
        >
          <h2 id="reminder-heading" className="text-lg font-semibold">
            Never miss a clinic
          </h2>
          <p className="text-sm text-muted-foreground">
            Subscribe to the Landlord Deadline Diary and we&apos;ll notify you
            when new clinic sessions are announced — plus reminders before every
            Renters&apos; Rights Act 2025 compliance deadline.
          </p>
          <Link
            href="/landlords/deadline-diary?utm_source=clinics"
            className="inline-block rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary/90 transition-colors"
          >
            Sign up to the Landlord Deadline Diary
          </Link>
        </section>

        {/* Content version */}
        <p className="text-xs text-muted-foreground">
          Clinics content v{CLINICS_CONTENT_VERSION}
        </p>
      </div>
    </div>
  );
}
