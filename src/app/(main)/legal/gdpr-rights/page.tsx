import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

const LAST_UPDATED = "13 March 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "introduction", label: "1. Introduction" },
  { id: "right-to-access", label: "2.1 Right of Access" },
  { id: "right-to-erasure", label: "2.2 Right to Erasure" },
  { id: "right-to-portability", label: "2.3 Right to Portability" },
  { id: "right-to-rectification", label: "2.4 Right to Rectification" },
  { id: "right-to-restriction", label: "2.5 Right to Restriction" },
  { id: "right-to-object", label: "2.6 Right to Object" },
  { id: "withdraw-consent", label: "2.7 Withdraw Consent" },
  { id: "lodge-complaint", label: "2.8 Lodge Complaint" },
  { id: "submit-request", label: "3. Submit a Request" },
  { id: "response-timelines", label: "4. Response Timelines" },
  { id: "exemptions", label: "5. Exemptions" },
  { id: "ico-complaint", label: "6. ICO Complaint" },
];

export const metadata: Metadata = {
  title: "GDPR Data Subject Rights | Britestate",
  description: "Exercise your eight rights under UK GDPR — access, erasure, portability, and more.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/gdpr-rights` },
};

export default function GdprRightsPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-primary transition-colors">Legal</Link>
        <span>/</span>
        <span className="text-neutral-900">GDPR Data Subject Rights</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">GDPR Data Subject Rights</h1>
      <p className="mb-8 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="introduction">
          <h2 className="text-2xl font-bold font-heading">1. Introduction</h2>
          <p>
            Under UK GDPR and the Data Protection Act 2018, you have eight rights in relation to your personal data
            held by Britestate Ltd. This page explains each right and how to exercise it. {/* TODO: legal review */}
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold font-heading">2. Your Eight Rights</h2>

          <section id="right-to-access">
            <h3 className="text-xl font-semibold font-heading">2.1 Right of Access</h3>
            <p>You may request a copy of the personal data we hold about you (a Subject Access Request). We will provide this within 30 days. {/* TODO: legal review */}</p>
          </section>

          <section id="right-to-erasure">
            <h3 className="text-xl font-semibold font-heading">2.2 Right to Erasure</h3>
            <p>You may request that we delete your personal data where it is no longer necessary, or where you withdraw consent. Some data must be retained for legal obligations. {/* TODO: legal review */}</p>
          </section>

          <section id="right-to-portability">
            <h3 className="text-xl font-semibold font-heading">2.3 Right to Data Portability</h3>
            <p>Where we process your data based on consent or contract, you may request a machine-readable export of your data. {/* TODO: legal review */}</p>
          </section>

          <section id="right-to-rectification">
            <h3 className="text-xl font-semibold font-heading">2.4 Right to Rectification</h3>
            <p>You may ask us to correct inaccurate personal data. You can update most data directly via your account settings. {/* TODO: legal review */}</p>
          </section>

          <section id="right-to-restriction">
            <h3 className="text-xl font-semibold font-heading">2.5 Right to Restriction</h3>
            <p>You may ask us to restrict processing of your data while a complaint is being resolved or accuracy is disputed. {/* TODO: legal review */}</p>
          </section>

          <section id="right-to-object">
            <h3 className="text-xl font-semibold font-heading">2.6 Right to Object</h3>
            <p>You may object to processing based on legitimate interests, including profiling for direct marketing. {/* TODO: legal review */}</p>
          </section>

          <section id="withdraw-consent">
            <h3 className="text-xl font-semibold font-heading">2.7 Withdraw Consent</h3>
            <p>Where processing is based on consent, you may withdraw it at any time via your account settings or by contacting us. Withdrawal does not affect the lawfulness of prior processing. {/* TODO: legal review */}</p>
          </section>

          <section id="lodge-complaint">
            <h3 className="text-xl font-semibold font-heading">2.8 Lodge a Complaint</h3>
            <p>You have the right to lodge a complaint with the ICO at <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>. {/* TODO: legal review */}</p>
          </section>
        </section>

        <section id="submit-request">
          <h2 className="text-2xl font-bold font-heading">3. Submit a Request</h2>
          <p className="mb-6 text-neutral-600">
            Complete the form below to exercise any of your data subject rights. We will respond within 30 calendar days.
          </p>
          {/* GdprRequestForm — added in Task 11 */}
          <div className="mt-4 p-6 bg-neutral-50 rounded-xl border border-neutral-200">
            <p className="text-sm text-neutral-500">Request form loading&hellip;</p>
          </div>
        </section>

        <section id="response-timelines">
          <h2 className="text-2xl font-bold font-heading">4. Response Timelines</h2>
          <p>We aim to respond to all requests within <strong>30 calendar days</strong>. For complex requests, we may extend this by up to 2 months and will notify you within the initial 30 days. {/* TODO: legal review */}</p>
        </section>

        <section id="exemptions">
          <h2 className="text-2xl font-bold font-heading">5. Exemptions</h2>
          <p>Some exemptions apply under UK GDPR. For example, we may retain financial records for 7 years to comply with HMRC requirements, even if you request erasure. {/* TODO: legal review */}</p>
        </section>

        <section id="ico-complaint">
          <h2 className="text-2xl font-bold font-heading">6. ICO Complaint</h2>
          <p>If you are unsatisfied with our response, you may complain to the Information Commissioner&apos;s Office: <a href="https://ico.org.uk/make-a-complaint" target="_blank" rel="noopener noreferrer">ico.org.uk/make-a-complaint</a>. {/* TODO: legal review */}</p>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "GDPR Data Subject Rights",
            dateModified: LAST_UPDATED,
            publisher: { "@type": "Organization", name: "Britestate Ltd" },
            url: `${BASE_URL}/legal/gdpr-rights`,
          }),
        }}
      />
    </LegalPageShell>
  );
}
