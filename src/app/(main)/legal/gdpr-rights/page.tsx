import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { GdprRequestForm } from "@/components/legal/GdprRequestForm";
import { brandConfig, appBaseUrl } from "@/config/brand";

const LAST_UPDATED = "24 March 2026";
const BASE_URL = appBaseUrl();

const SECTIONS = [
  { id: "your-rights", label: "1. Your Rights" },
  { id: "how-to-make-a-request", label: "2. How to Make a Request" },
  { id: "identity-verification", label: "3. Identity Verification" },
  { id: "response-timeframe", label: "4. Response Timeframe" },
  { id: "fees", label: "5. Fees" },
  { id: "exemptions", label: "6. Exemptions" },
  { id: "complaints", label: "7. Complaints" },
];

export const metadata: Metadata = {
  title: `GDPR Data Subject Rights | ${brandConfig.displayName}`,
  description:
    "Exercise your rights under UK GDPR — access, rectification, erasure, portability, restriction, objection, automated decision-making, and withdrawal of consent.",
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
      <p className="mb-4 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="mb-8 bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-lg p-4 text-sm">
        Under the UK General Data Protection Regulation, you have rights in relation to your personal data held by
        {brandConfig.displayName} Ltd. This page explains each right and how to exercise it. See also our{" "}
        <Link href="/legal/privacy" className="underline">Privacy Policy</Link>.
      </div>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="your-rights">
          <h2 className="text-2xl font-bold font-heading">1. Your Rights</h2>
          <p>
            Under the UK General Data Protection Regulation, you have the following rights in relation to your
            personal data held by {brandConfig.displayName} Ltd:
          </p>

          <p>
            <strong>Right of Access (Art. 15):</strong> Request a copy of all personal data we hold about you,
            together with information about how we process it.
          </p>

          <p>
            <strong>Right to Rectification (Art. 16):</strong> Request correction of any inaccurate or incomplete
            personal data.
          </p>

          <p>
            <strong>Right to Erasure (Art. 17):</strong> Request deletion of your personal data, subject to our
            legal obligations (e.g., AML record retention, tax records).
          </p>

          <p>
            <strong>Right to Restrict Processing (Art. 18):</strong> Request that we temporarily stop processing your
            data while a dispute about accuracy or our grounds for processing is resolved.
          </p>

          <p>
            <strong>Right to Data Portability (Art. 20):</strong> Request a copy of your personal data in a
            structured, commonly used, machine-readable format (JSON). This applies to data you have provided to us
            that we process by automated means on the basis of consent or contract.
          </p>

          <p>
            <strong>Right to Object (Art. 21):</strong> Object to processing based on legitimate interests, including
            profiling for AI-powered property recommendations. We will stop processing unless we have compelling
            legitimate grounds that override your interests.
          </p>

          <p>
            <strong>Rights Related to Automated Decision-Making (Art. 22):</strong> Request human review of any
            decision made solely by automated means that has a significant effect on you. Request meaningful
            information about the logic involved.
          </p>

          <p>
            <strong>Right to Withdraw Consent:</strong> Where we process your data based on consent (e.g., marketing
            emails), you may withdraw consent at any time.
          </p>
        </section>

        <section id="how-to-make-a-request">
          <h2 className="text-2xl font-bold font-heading">2. How to Make a Request</h2>
          <p>
            Use the form below, or email{" "}
            <a href={`mailto:${brandConfig.emails.privacy}`}>{brandConfig.emails.privacy}</a>, or write to: Data Protection
            Officer, {brandConfig.displayName} Ltd, [REGISTERED ADDRESS].
          </p>
          <p>
            Please specify which right you wish to exercise and provide sufficient information for us to verify your
            identity and locate your data.
          </p>
          <div className="mt-6">
            <GdprRequestForm />
          </div>
        </section>

        <section id="identity-verification">
          <h2 className="text-2xl font-bold font-heading">3. Identity Verification</h2>
          <p>
            To protect your data, we must verify your identity before processing your request. We may ask you to
            confirm your email address, provide a copy of photo ID, or answer security questions linked to your
            account.
          </p>
        </section>

        <section id="response-timeframe">
          <h2 className="text-2xl font-bold font-heading">4. Response Timeframe</h2>
          <p>
            We will respond to your request within <strong>30 calendar days</strong> of receiving it (and verifying
            your identity). If your request is complex or we receive a high volume of requests, we may extend this by
            a further 60 days, in which case we will notify you within the first 30 days.
          </p>
        </section>

        <section id="fees">
          <h2 className="text-2xl font-bold font-heading">5. Fees</h2>
          <p>
            Requests are free of charge. However, we may charge a reasonable fee for manifestly unfounded or
            excessive requests, or where you request additional copies of your data.
          </p>
        </section>

        <section id="exemptions">
          <h2 className="text-2xl font-bold font-heading">6. Exemptions</h2>
          <p>
            We may be unable to fully comply with your request where an exemption applies, including: ongoing legal
            proceedings, regulatory obligations (e.g., AML record retention), or the rights and freedoms of others.
            We will explain any exemption that applies.
          </p>
        </section>

        <section id="complaints">
          <h2 className="text-2xl font-bold font-heading">7. Complaints</h2>
          <p>
            If you are not satisfied with our response, you have the right to lodge a complaint with the Information
            Commissioner&rsquo;s Office:
          </p>
          <p>
            ICO, Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF<br />
            Tel: 0303 123 1113<br />
            Web:{" "}
            <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>
          </p>
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
            publisher: { "@type": "Organization", name: `${brandConfig.displayName} Ltd` },
            url: `${BASE_URL}/legal/gdpr-rights`,
          }),
        }}
      />
    </LegalPageShell>
  );
}
