import type { Metadata } from "next";
import Link from "next/link";
import { Scale, Users, Accessibility, Megaphone } from "lucide-react";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { LabeledGrid } from "@/components/legal/LabeledGrid";
import { NumberedSteps } from "@/components/legal/NumberedSteps";

const LAST_UPDATED = "16 June 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "our-commitment", label: "Our Commitment" },
  { id: "non-discrimination", label: "Non-Discrimination" },
  { id: "accessibility", label: "Accessibility" },
  { id: "reporting", label: "Reporting Procedures" },
];

export const metadata: Metadata = {
  title: "Fair Housing Policy | Britestate",
  description:
    "Britestate's commitment to equal access to housing and a discrimination-free experience for all buyers, renters, sellers, and landlords under the Equality Act 2010.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/fair-housing` },
  openGraph: {
    title: "Fair Housing Policy | Britestate",
    description: "Our commitment to equality and inclusion in the UK property market.",
  },
};

export default function FairHousingPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-primary transition-colors">Legal</Link>
        <span>/</span>
        <span className="text-neutral-900">Fair Housing Policy</span>
      </nav>

      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
        <Scale size={14} /> Corporate Policy
      </div>
      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">Fair Housing Policy</h1>
      <p className="mb-8 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="mb-8 rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
        This policy statement is drafted for clarity and is pending final review by Britestate&rsquo;s
        legal team. Specific statutory references should be confirmed before publication.
      </div>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="our-commitment" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <Users className="text-primary" size={22} /> Our Commitment
          </h2>
          <p>
            Britestate believes every individual deserves equal access to housing. This policy sets
            out our commitment to equality, diversity, and inclusion across every part of our
            property platform &mdash; search, listings, messaging, offers, and the services
            marketplace.
          </p>
          <p>
            We act in line with the <strong>Equality Act 2010</strong> and the{" "}
            <strong>Human Rights Act 1998</strong>, and we expect the estate agents, landlords, and
            service providers operating on Britestate to do the same.
          </p>
        </section>

        <section id="non-discrimination" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <Scale className="text-primary" size={22} /> Non-Discrimination
          </h2>
          <p>
            We prohibit discrimination in any housing-related transaction on the platform based on
            the protected characteristics defined by the Equality Act 2010, including:
          </p>
          <LabeledGrid
            cells={[
              { title: "Age" },
              { title: "Disability" },
              { title: "Gender reassignment" },
              { title: "Marriage & civil partnership" },
              { title: "Pregnancy & maternity" },
              { title: "Race & ethnicity" },
              { title: "Religion or belief" },
              { title: "Sex" },
              { title: "Sexual orientation" },
            ]}
          />
        </section>

        <section id="accessibility" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <Accessibility className="text-primary" size={22} /> Accessibility
          </h2>
          <div className="not-prose my-6 rounded-2xl bg-primary p-8 text-white">
            <h3 className="text-xl font-bold font-heading">Reasonable adjustments</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/90">
              We aim to ensure disabled users are not put at a substantial disadvantage compared to
              non-disabled users. If you need an adjustment to use Britestate or to engage with a
              listing, we will do our best to help.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-flex rounded-full bg-white px-6 py-2 text-sm font-bold text-primary transition-opacity hover:opacity-90"
            >
              Request an adjustment
            </Link>
          </div>
          <p>
            Our broader accessibility commitments and WCAG status are described in our{" "}
            <Link href="/legal/accessibility" className="text-primary underline hover:no-underline">
              Accessibility Statement
            </Link>
            .
          </p>
        </section>

        <section id="reporting" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <Megaphone className="text-primary" size={22} /> Reporting Procedures
          </h2>
          <p>If you believe you have experienced discrimination on Britestate, please:</p>
          <NumberedSteps
            steps={[
              {
                title: "Document the incident",
                body: "Keep records of correspondence, dates, listings, and the people involved.",
              },
              {
                title: "Raise it with us",
                body: (
                  <>
                    Contact our team at{" "}
                    <a href="mailto:support@britestate.co.uk" className="text-primary underline hover:no-underline">
                      support@britestate.co.uk
                    </a>{" "}
                    or through our{" "}
                    <Link href="/legal/complaints" className="text-primary underline hover:no-underline">
                      Complaints Procedure
                    </Link>
                    .
                  </>
                ),
              },
              {
                title: "Formal review",
                body: "We investigate fair-housing reports promptly and independently of the team involved, and we will keep you informed of the outcome.",
              },
            ]}
          />
        </section>
      </div>
    </LegalPageShell>
  );
}
