import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

const LAST_UPDATED = "24 March 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "introduction", label: "1. Introduction" },
  { id: "what-you-can-complain-about", label: "2. What You Can Complain About" },
  { id: "how-to-complain", label: "3. How to Complain" },
  { id: "escalation", label: "4. Escalation" },
  { id: "complaints-about-estate-agents", label: "5. Complaints About Estate Agents" },
];

export const metadata: Metadata = {
  title: "Complaints Procedure | Britestate",
  description:
    "How to make a complaint to Britestate, our investigation and response timelines, and your escalation options including the ICO, Property Ombudsman, and ADR providers.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/complaints` },
  openGraph: {
    title: "Complaints Procedure | Britestate",
    description: "How to raise a complaint with Britestate and available escalation options.",
  },
};

export default function ComplaintsPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-primary transition-colors">
          Legal
        </Link>
        <span>/</span>
        <span className="text-neutral-900">Complaints Procedure</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">
        Complaints Procedure
      </h1>
      <p className="mb-4 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      {/* Yellow info callout */}
      <div className="mb-8 bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-lg p-4 text-sm">
        Britestate Ltd takes all complaints seriously and aims to resolve them fairly and promptly.
        To raise a complaint, email{" "}
        <a
          href="mailto:complaints@britestate.co.uk"
          className="underline hover:no-underline"
        >
          complaints@britestate.co.uk
        </a>{" "}
        or use the{" "}
        <Link href="/help" className="underline hover:no-underline">
          Help &amp; Support
        </Link>{" "}
        section of the platform.
      </div>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="introduction">
          <h2 className="text-2xl font-bold font-heading">1. Introduction</h2>
          <p>
            Britestate Ltd takes all complaints seriously and aims to resolve them fairly and
            promptly. This procedure explains how to make a complaint and what to expect from us
            throughout the process.
          </p>
        </section>

        <section id="what-you-can-complain-about">
          <h2 className="text-2xl font-bold font-heading">2. What You Can Complain About</h2>
          <p>
            You may complain about: the platform&rsquo;s services, features, or performance; the
            conduct of another user (including an estate agent or service provider); data protection
            concerns; billing or payment disputes; content moderation decisions; or accessibility
            issues.
          </p>
        </section>

        <section id="how-to-complain">
          <h2 className="text-2xl font-bold font-heading">3. How to Complain</h2>
          <p>
            <strong>Step 1 &mdash; Contact Us.</strong> Email{" "}
            <a href="mailto:complaints@britestate.co.uk">complaints@britestate.co.uk</a> or use the
            &ldquo;Help &amp; Support&rdquo; section of the platform. Please include your name,
            email address, a description of the issue, and any relevant evidence (screenshots,
            reference numbers).
          </p>
          <p>
            <strong>Step 2 &mdash; Acknowledgement.</strong> We will acknowledge your complaint
            within 2 working days and assign a reference number.
          </p>
          <p>
            <strong>Step 3 &mdash; Investigation.</strong> We will investigate your complaint and
            aim to provide a full response within 15 working days. If the matter is complex, we may
            extend this to 30 working days, notifying you of the delay and the reason.
          </p>
          <p>
            <strong>Step 4 &mdash; Resolution.</strong> Our response will explain our findings and
            any action we have taken or propose to take.
          </p>
        </section>

        <section id="escalation">
          <h2 className="text-2xl font-bold font-heading">4. Escalation</h2>
          <p>If you are not satisfied with our response:</p>
          <p>
            <strong>4.1. Internal Escalation.</strong> You may request a review by a senior manager
            within 14 days of receiving our response. The review will be completed within 15 working
            days.
          </p>
          <p>
            <strong>4.2. External Escalation.</strong> If you remain dissatisfied, you may refer
            your complaint to:
          </p>
          <ul>
            <li>
              <strong>For data protection matters:</strong> The Information Commissioner&rsquo;s
              Office (
              <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">
                ico.org.uk
              </a>
              , 0303 123 1113)
            </li>
            <li>
              <strong>For estate agent conduct:</strong> The Property Ombudsman (
              <a href="https://www.tpos.co.uk" target="_blank" rel="noopener noreferrer">
                tpos.co.uk
              </a>
              ) or the Property Redress Scheme (
              <a href="https://www.theprs.co.uk" target="_blank" rel="noopener noreferrer">
                theprs.co.uk
              </a>
              )
            </li>
            <li>
              <strong>For consumer disputes:</strong> You may use an ADR provider certified by the
              Chartered Trading Standards Institute. Details of applicable ADR providers will be
              included in our final response to your complaint.
            </li>
            <li>
              <strong>For online disputes (consumers):</strong> The Online Dispute Resolution
              platform at{" "}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
              >
                ec.europa.eu/consumers/odr
              </a>
            </li>
          </ul>
        </section>

        <section id="complaints-about-estate-agents">
          <h2 className="text-2xl font-bold font-heading">5. Complaints About Estate Agents</h2>
          <p>
            If your complaint relates to an estate agent registered on the platform, we will:
            forward the complaint to the agent for their response; facilitate communication where
            appropriate; and if the matter is not resolved, advise you to contact the
            agent&rsquo;s redress scheme directly.
          </p>
          <p>
            Britestate is not responsible for the professional conduct of estate agents or service
            providers on the platform.
          </p>
        </section>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Complaints Procedure",
            dateModified: LAST_UPDATED,
            publisher: { "@type": "Organization", name: "Britestate Ltd" },
            url: `${BASE_URL}/legal/complaints`,
          }),
        }}
      />
    </LegalPageShell>
  );
}
