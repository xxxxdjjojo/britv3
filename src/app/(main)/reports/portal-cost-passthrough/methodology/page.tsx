import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentVersionStamp } from "@/components/trust/ContentVersionStamp";
import { MethodologyFooter } from "@/components/trust/MethodologyFooter";
import { PORTAL_COST_ASSUMPTIONS } from "@/config/portal-cost-assumptions";
import {
  PASSTHROUGH_STUDY,
  PASSTHROUGH_STUDY_METHODOLOGY_VERSION,
  PASSTHROUGH_STUDY_MIN_N,
} from "@/content/passthrough-study/results";
import { getFeatureFlags } from "@/services/admin/feature-flag-service";

const TITLE = "Portal Cost Passthrough Study methodology";
const DESCRIPTION =
  "How the Portal Cost Passthrough Study works: published portal-cost sources, the founder-run agent survey design, the disclosed minimum sample threshold, known caveats, and the computation version.";

const METHODOLOGY_CHECKED_DATE = "3 July 2026";

const { arpaMonthly, commissionRateLow, catClaimAllegedValue } =
  PORTAL_COST_ASSUMPTIONS;

const SOURCES = [arpaMonthly, commissionRateLow, catClaimAllegedValue].flatMap(
  (assumption) => (assumption.source ? [assumption.source] : []),
);

export const metadata: Metadata = {
  title: `${TITLE} | TrueDeed reports`,
  description: DESCRIPTION,
  alternates: { canonical: "/reports/portal-cost-passthrough/methodology" },
};

const SECTION_HEADING = "font-heading text-xl font-bold text-neutral-900";
const BODY = "mt-3 text-sm leading-relaxed text-neutral-600";
const LINK_CLASS =
  "font-medium text-brand-primary underline underline-offset-2 hover:text-brand-primary-dark";

export default async function PortalCostPassthroughMethodologyPage() {
  const flags = await getFeatureFlags();
  const isOn = flags.some(
    (flag) => flag.key === "portal_cost_passthrough" && flag.enabled,
  );
  if (!isOn) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-12">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-primary">
          TrueDeed reports
        </p>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
          {TITLE}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-neutral-600">
          The complete recipe for the{" "}
          <Link href="/reports/portal-cost-passthrough" className={LINK_CLASS}>
            Portal Cost Passthrough Study
          </Link>
          , published before fieldwork finished so nothing can be tuned after
          the fact. If a figure ever appears on that page, this is exactly how
          it was made — and while none do, this explains why not.
        </p>
      </header>

      <div className="space-y-10">
        <section aria-labelledby="sources-heading">
          <h2 id="sources-heading" className={SECTION_HEADING}>
            Data sources
          </h2>
          <p className={BODY}>
            <strong>Published baseline:</strong> Rightmove&rsquo;s reported
            average revenue per advertiser (ARPA) from its FY2023 results, and
            the HomeOwners Alliance guidance range for sole-agency commission.
            Both carry inline citations on the report page; neither is a
            TrueDeed measurement. <strong>Survey data:</strong> responses
            collected directly from UK estate-agency branch decision-makers by
            TrueDeed&rsquo;s founder — the only primary data in the study.
          </p>
          <p className={BODY}>
            The report also references the collective claim filed at the
            Competition Appeal Tribunal against Rightmove. That claim{" "}
            <strong>alleges</strong> excessive and unfair subscription fees;
            Rightmove denies it and nothing has been decided by the Tribunal.
            It is always presented as an allegation, never as a finding.
          </p>
        </section>

        <section aria-labelledby="instrument-heading">
          <h2 id="instrument-heading" className={SECTION_HEADING}>
            The survey instrument
          </h2>
          <p className={BODY}>
            <strong>Research question:</strong> {PASSTHROUGH_STUDY.question}
          </p>
          <p className={BODY}>{PASSTHROUGH_STUDY.method}</p>
          <p className={BODY}>
            One observation = one branch decision-maker&rsquo;s response.
            Responses are anonymous at branch level; no agent or agency is
            ever named in a finding. Every published finding states the exact
            question wording it answers — findings are never aggregated across
            differently-worded questions.
          </p>
        </section>

        <section aria-labelledby="threshold-heading">
          <h2 id="threshold-heading" className={SECTION_HEADING}>
            Sample sizes and the suppression threshold (disclosed, exact)
          </h2>
          <p className={BODY}>
            A finding publishes only when it is computed from at least{" "}
            <strong>{PASSTHROUGH_STUDY_MIN_N} responses</strong>. Below that,
            it is suppressed — never estimated, interpolated, or padded. The
            threshold was committed in code before fieldwork began, so it
            cannot be lowered to rescue a thin result. Each published finding
            reports its own n alongside the statistic.
          </p>
        </section>

        <section aria-labelledby="caveats-heading">
          <h2 id="caveats-heading" className={SECTION_HEADING}>
            Known caveats
          </h2>
          <p className={BODY}>
            A founder-run survey is not an independent poll: TrueDeed competes
            with the portals the study examines, which is why the instrument,
            threshold, and computation are all published up front and every
            finding carries its raw n. Self-reported answers measure what
            agents say about their pricing, not their accounts. Portal costs
            are business overheads — whether they pass through to seller fees
            is the question under test, never an assumption.
          </p>
        </section>

        <section aria-labelledby="versioning-heading">
          <h2 id="versioning-heading" className={SECTION_HEADING}>
            Editions and versioning
          </h2>
          <p className={BODY}>
            Fieldwork runs in waves; the current edition is{" "}
            <code>{PASSTHROUGH_STUDY.edition}</code>. Every finding is
            computed under methodology version{" "}
            {PASSTHROUGH_STUDY_METHODOLOGY_VERSION}; if the instrument or the
            computation ever changes, the version increments and this page
            documents the change — figures computed under different versions
            are never mixed silently.
          </p>
        </section>
      </div>

      <footer className="mt-14 space-y-6 border-t border-border pt-8">
        <MethodologyFooter
          sources={SOURCES}
          caveats={[
            "Founder-run survey — instrument, threshold, and computation published before fieldwork as the check on that conflict.",
            `Findings below ${PASSTHROUGH_STUDY_MIN_N} responses are suppressed, never estimated.`,
            "The Competition Appeal Tribunal claim against Rightmove is an unproven allegation — Rightmove denies it.",
          ]}
        />
        <ContentVersionStamp
          checkedDate={METHODOLOGY_CHECKED_DATE}
          version={PASSTHROUGH_STUDY_METHODOLOGY_VERSION}
        />
      </footer>
    </main>
  );
}
