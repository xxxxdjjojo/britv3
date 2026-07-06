import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmbargoGate } from "@/components/reports/EmbargoGate";
import { ReportShell } from "@/components/reports/ReportShell";
import { ReportStatRow } from "@/components/reports/ReportStatRow";
import { ReportViewTracker } from "@/components/reports/ReportViewTracker";
import { SourcedFigure } from "@/components/trust/SourcedFigure";
import { PORTAL_COST_ASSUMPTIONS } from "@/config/portal-cost-assumptions";
import {
  PASSTHROUGH_STUDY,
  PASSTHROUGH_STUDY_METHODOLOGY_VERSION,
  PASSTHROUGH_STUDY_MIN_N,
} from "@/content/passthrough-study/results";
import { getFeatureFlags } from "@/services/admin/feature-flag-service";

const TITLE = "The Portal Cost Passthrough Study";
const DESCRIPTION =
  "Do portal subscription costs shape the fees estate agents quote sellers? Published portal figures set the baseline; a founder-run agent survey — methodology fixed before fieldwork — answers the passthrough question.";

const REPORT_KEY = "portal-cost-passthrough";

const { arpaMonthly, commissionRateLow, commissionRateHigh, catClaimAllegedValue } =
  PORTAL_COST_ASSUMPTIONS;

/** Deduplicated real-source list for the methodology footer + JSON-LD. */
const SOURCES = [arpaMonthly, commissionRateLow, catClaimAllegedValue].flatMap(
  (assumption) => (assumption.source ? [assumption.source] : []),
);

const CAVEATS = [
  "Survey findings publish only once fieldwork completes and each finding clears the disclosed minimum sample threshold — nothing on this page is estimated or extrapolated in the meantime.",
  "Portal costs are business overheads; how (and whether) they pass through to seller fees is exactly what the survey measures — it is not assumed.",
  "Figures referencing the Competition Appeal Tribunal claim against Rightmove are allegations from an unproven claim — Rightmove denies it and nothing has been decided.",
  `Methodology version ${PASSTHROUGH_STUDY_METHODOLOGY_VERSION}.`,
];

export const metadata: Metadata = {
  title: `${TITLE} | TrueDeed reports`,
  description: DESCRIPTION,
  alternates: { canonical: "/reports/portal-cost-passthrough" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/reports/portal-cost-passthrough",
    images: [
      {
        url: `/api/og/report?title=${encodeURIComponent(TITLE)}`,
        width: 1200,
        height: 630,
        alt: TITLE,
      },
    ],
  },
};

type Props = Readonly<{
  searchParams: Promise<{ preview?: string }>;
}>;

function formatPounds(value: number): string {
  return `£${value.toLocaleString("en-GB")}`;
}

function formatPct(rate: number): string {
  return `${(rate * 100).toLocaleString("en-GB")}%`;
}

/** Dataset JSON-LD: the study is a citable open dataset, not just a page. */
function datasetJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${TITLE} — ${PASSTHROUGH_STUDY.edition}`,
    description: DESCRIPTION,
    temporalCoverage: PASSTHROUGH_STUDY.edition,
    creator: { "@type": "Organization", name: "TrueDeed" },
    isBasedOn: SOURCES.map((source) => source.url),
    measurementTechnique: PASSTHROUGH_STUDY.method,
  };
}

function FieldworkInProgress() {
  return (
    <section
      aria-label="Fieldwork in progress"
      className="rounded-2xl border border-border bg-muted p-8"
    >
      <h3 className="font-heading text-xl font-bold text-neutral-900">
        Fieldwork in progress — no findings published yet
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-neutral-600">
        The survey is being run right now, and this page carries no numbers
        until it is done. The question wording, the computation, and the
        minimum sample threshold ({PASSTHROUGH_STUDY_MIN_N} responses per
        finding) were all fixed and published before fieldwork began — read
        them below and in the{" "}
        <Link
          href="/reports/portal-cost-passthrough/methodology"
          className="font-medium text-brand-primary underline underline-offset-2 hover:text-brand-primary-dark"
        >
          full methodology
        </Link>{" "}
        — so results cannot be shaped after the fact. When findings publish,
        every one will state its exact question, its n, and how it was
        computed.
      </p>
    </section>
  );
}

export default async function PortalCostPassthroughPage({ searchParams }: Props) {
  const flags = await getFeatureFlags();
  const isOn = flags.some(
    (flag) => flag.key === "portal_cost_passthrough" && flag.enabled,
  );
  if (!isOn) notFound();

  const { preview } = await searchParams;

  // Empty fieldwork state is public (there is nothing to embargo); findings
  // that exist while the study is still unpublished are the embargo window —
  // journalists open them with a signed preview token.
  const hasFindings = PASSTHROUGH_STUDY.findings.length > 0;
  const published = PASSTHROUGH_STUDY.status === "published" || !hasFindings;

  return (
    <main>
      <script
        type="application/ld+json"
        // Static, code-owned values; escape "<" defensively all the same so
        // no string could ever close the script tag.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(datasetJsonLd()).replace(/</g, "\\u003c"),
        }}
      />
      <EmbargoGate
        published={published}
        reportKey={REPORT_KEY}
        edition={PASSTHROUGH_STUDY.edition}
        previewToken={preview}
      >
        <ReportShell
          eyebrow="TrueDeed reports"
          title={TITLE}
          strapline="Portals publish what they charge agents. Nobody publishes whether that cost shapes the fee a seller is quoted. This study asks agents directly — with the methodology locked before a single answer was collected."
          methodology={{
            sources: SOURCES,
            caveats: CAVEATS,
            methodologyHref: "/reports/portal-cost-passthrough/methodology",
          }}
          shareTitle={`${TITLE} — do portal costs shape seller fees?`}
          shareToolKey="portal_cost_passthrough"
        >
          <ReportViewTracker
            report={`portal_cost_passthrough:${PASSTHROUGH_STUDY.edition}`}
          />

          <section aria-labelledby="baseline-heading">
            <h2
              id="baseline-heading"
              className="font-heading text-2xl font-bold text-neutral-900"
            >
              The published baseline — what portals charge agents
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600">
              These figures come from public publications, each cited inline.
              They are the context for the survey, not its findings.
            </p>
            <div className="mt-6">
              <ReportStatRow
                stats={[
                  {
                    label: "Rightmove ARPA, per branch per month (FY2023)",
                    value: formatPounds(arpaMonthly.value),
                    caption: arpaMonthly.label,
                    source: arpaMonthly.source,
                  },
                  {
                    label: "Typical sole-agency commission range (inc VAT)",
                    value: `${formatPct(commissionRateLow.value)}–${formatPct(commissionRateHigh.value)}`,
                    caption: commissionRateLow.label,
                    source: commissionRateLow.source,
                  },
                ]}
              />
            </div>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-neutral-600">
              Separately, a collective claim filed at the Competition Appeal
              Tribunal alleges that Rightmove abused a dominant position by
              charging agents and new-home developers excessive subscription
              fees — the claim alleges overcharging of up to{" "}
              <SourcedFigure
                value={`£${(catClaimAllegedValue.value / 1_000_000_000).toLocaleString("en-GB")}bn`}
                source={catClaimAllegedValue.source}
              />
              . That is an allegation, not a finding: Rightmove denies the
              claim and nothing has been decided by the Tribunal.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600">
              Want the per-listing arithmetic on these published figures? The{" "}
              <Link
                href="/tools/portal-cost-calculator"
                className="font-medium text-brand-primary underline underline-offset-2 hover:text-brand-primary-dark"
              >
                Portal Cost Calculator
              </Link>{" "}
              works it through with every assumption editable.
            </p>
          </section>

          <section aria-labelledby="survey-heading">
            <h2
              id="survey-heading"
              className="font-heading text-2xl font-bold text-neutral-900"
            >
              The survey — asked before it is answered
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600">
              <strong>The research question:</strong> {PASSTHROUGH_STUDY.question}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600">
              <strong>The method:</strong> {PASSTHROUGH_STUDY.method}
            </p>
          </section>

          <section aria-labelledby="findings-heading">
            <h2
              id="findings-heading"
              className="font-heading text-2xl font-bold text-neutral-900"
            >
              Findings
            </h2>
            <div className="mt-6">
              {hasFindings ? (
                <div className="space-y-4">
                  <ReportStatRow
                    stats={PASSTHROUGH_STUDY.findings.map((finding) => ({
                      label: finding.question,
                      value: finding.statistic,
                      caption: `n=${finding.n.toLocaleString("en-GB")} · ${finding.method}${finding.detail ? ` · ${finding.detail}` : ""}`,
                    }))}
                  />
                </div>
              ) : (
                <FieldworkInProgress />
              )}
            </div>
          </section>
        </ReportShell>
      </EmbargoGate>
    </main>
  );
}
