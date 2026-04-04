import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { GdprRequestForm } from "@/components/legal/GdprRequestForm";

const LAST_UPDATED = "24 March 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

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
  title: "GDPR Data Subject Rights | Britestate",
  description:
    "Exercise your rights under UK GDPR — access, rectification, erasure, portability, restriction, objection, automated decision-making, and withdrawal of consent.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/gdpr-rights` },
};

export default function GdprRightsPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 font-body text-sm text-neutral-500">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-foreground transition-colors">Legal</Link>
        <span>/</span>
        <span className="text-foreground">GDPR Data Subject Rights</span>
      </nav>

      <h1 className="mb-2 font-heading text-2xl font-bold text-foreground">GDPR Data Subject Rights</h1>
      <p className="mb-4 font-body text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="mb-8 rounded-xl bg-warning-light dark:bg-warning/10 p-4 ring-1 ring-warning/30 dark:ring-warning/40 font-body text-sm text-warning dark:text-warning">
        Under the UK General Data Protection Regulation, you have rights in relation to your personal data held by
        Britestate Ltd. This page explains each right and how to exercise it. See also our{" "}
        <Link href="/legal/privacy" className="underline">Privacy Policy</Link>.
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <section id="your-rights">
          <h2 className="font-heading text-lg font-semibold text-foreground">1. Your Rights</h2>
          <p>
            Under the UK General Data Protection Regulation, you have the following rights in relation to your
            personal data held by Britestate Ltd:
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
          <h2 className="font-heading text-lg font-semibold text-foreground">2. How to Make a Request</h2>
          <p>
            Use the form below, or email{" "}
            <a href="mailto:privacy@britestate.co.uk">privacy@britestate.co.uk</a>, or write to: Data Protection
            Officer, Britestate Ltd, [REGISTERED ADDRESS].
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
          <h2 className="font-heading text-lg font-semibold text-foreground">3. Identity Verification</h2>
          <p>
            To protect your data, we must verify your identity before processing your request. We may ask you to
            confirm your email address, provide a copy of photo ID, or answer security questions linked to your
            account.
          </p>
        </section>

        <section id="response-timeframe">
          <h2 className="font-heading text-lg font-semibold text-foreground">4. Response Timeframe</h2>
          <p>
            We will respond to your request within <strong>30 calendar days</strong> of receiving it (and verifying
            your identity). If your request is complex or we receive a high volume of requests, we may extend this by
            a further 60 days, in which case we will notify you within the first 30 days.
          </p>
        </section>

        <section id="fees">
          <h2 className="font-heading text-lg font-semibold text-foreground">5. Fees</h2>
          <p>
            Requests are free of charge. However, we may charge a reasonable fee for manifestly unfounded or
            excessive requests, or where you request additional copies of your data.
          </p>
        </section>

        <section id="exemptions">
          <h2 className="font-heading text-lg font-semibold text-foreground">6. Exemptions</h2>
          <p>
            We may be unable to fully comply with your request where an exemption applies, including: ongoing legal
            proceedings, regulatory obligations (e.g., AML record retention), or the rights and freedoms of others.
            We will explain any exemption that applies.
          </p>
        </section>

        <section id="complaints">
          <h2 className="font-heading text-lg font-semibold text-foreground">7. Complaints</h2>
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
            publisher: { "@type": "Organization", name: "Britestate Ltd" },
            url: `${BASE_URL}/legal/gdpr-rights`,
          }),
        }}
      />
    </LegalPageShell>
  );
}
