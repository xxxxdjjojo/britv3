import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

const LAST_UPDATED = "1 April 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "overview", label: "1. Overview" },
  { id: "estate-agent-standards", label: "2. Estate Agent Standards" },
  { id: "landlord-obligations", label: "3. Landlord Obligations" },
  { id: "service-provider-requirements", label: "4. Service Provider Requirements" },
  { id: "mortgage-broker-standards", label: "5. Mortgage Broker Standards" },
  { id: "verification-and-compliance", label: "6. Verification & Compliance" },
  { id: "complaints-and-disputes", label: "7. Complaints & Disputes" },
  { id: "regulatory-bodies", label: "8. Regulatory Bodies" },
];

export const metadata: Metadata = {
  title: "Professional Standards | Britestate",
  description:
    "Professional standards and regulatory requirements for estate agents, landlords, service providers, and mortgage brokers using the Britestate platform.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/professional-standards` },
  openGraph: {
    title: "Professional Standards | Britestate",
    description: "Regulatory and professional standards for Britestate platform users.",
  },
};

export default function ProfessionalStandardsPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 font-body text-sm text-neutral-500">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-foreground transition-colors">
          Legal
        </Link>
        <span>/</span>
        <span className="text-foreground">Professional Standards</span>
      </nav>

      <h1 className="mb-2 font-heading text-2xl font-bold text-foreground">Professional Standards</h1>
      <p className="mb-4 font-body text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      {/* Blue callout */}
      <div className="mb-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4 ring-1 ring-blue-200/60 dark:ring-blue-700/60 font-body text-sm text-blue-800 dark:text-blue-300">
        All professional users on Britestate must meet the regulatory standards for their industry.
        We verify credentials and monitor compliance to protect consumers. See our{" "}
        <Link href="/legal/complaints" className="underline hover:no-underline">
          complaints procedure
        </Link>{" "}
        if you have concerns about a professional on our platform.
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <section id="overview">
          <h2 className="font-heading text-lg font-semibold text-foreground">1. Overview</h2>
          <p>
            1.1. Britestate connects consumers with property professionals, including estate agents,
            landlords, service providers (tradespeople), and mortgage brokers. Each category of
            professional is subject to specific regulatory requirements under UK law.
          </p>
          <p>
            1.2. This document sets out the standards we expect from professional users on our
            platform and the verification processes we use to protect consumers.
          </p>
          <p>
            1.3. Professional users must comply with all applicable laws, regulations, and industry
            codes of practice in addition to our{" "}
            <Link href="/legal/terms" className="text-brand-primary hover:underline">
              Terms of Service
            </Link>
            .
          </p>
        </section>

        <section id="estate-agent-standards">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            2. Estate Agent Standards
          </h2>
          <p>
            2.1. All estate agents using Britestate must comply with the following legislation:
          </p>
          <ul>
            <li>
              <strong>Estate Agents Act 1979</strong> &mdash; agents must declare any personal
              interest in a transaction, maintain client money in separate accounts, and provide
              prescribed information to buyers and sellers.
            </li>
            <li>
              <strong>Consumer Protection from Unfair Trading Regulations 2008</strong> &mdash;
              agents must not engage in misleading actions, misleading omissions, or aggressive
              commercial practices.
            </li>
            <li>
              <strong>Money Laundering, Terrorist Financing and Transfer of Funds Regulations
              2017</strong> &mdash; agents must conduct customer due diligence and report suspicious
              activity.
            </li>
          </ul>
          <p>
            2.2. Estate agents must be registered with an approved redress scheme. Britestate
            requires membership of The Property Ombudsman (TPO) or the Property Redress Scheme (PRS).
          </p>
          <p>
            2.3. Agents must hold appropriate professional indemnity insurance and client money
            protection insurance where applicable.
          </p>
          <p>
            2.4. All property descriptions, photographs, and marketing materials must be accurate
            and not misleading, in accordance with the Property Misdescriptions Act 1991 (as
            superseded by the CPRs) and the ASA CAP Code.
          </p>
        </section>

        <section id="landlord-obligations">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            3. Landlord Obligations
          </h2>
          <p>
            3.1. Landlords listing properties on Britestate must comply with all applicable
            landlord and tenant legislation, including:
          </p>
          <ul>
            <li>
              <strong>Housing Act 2004</strong> &mdash; properties must meet the Housing Health and
              Safety Rating System (HHSRS) standards. HMOs (Houses in Multiple Occupation) must be
              licensed where required.
            </li>
            <li>
              <strong>Landlord and Tenant Act 1985</strong> &mdash; landlords must keep properties
              in a good state of repair, including the structure, exterior, and installations for
              water, gas, electricity, and sanitation.
            </li>
            <li>
              <strong>Gas Safety (Installation and Use) Regulations 1998</strong> &mdash; landlords
              must arrange annual gas safety checks by a Gas Safe registered engineer and provide
              tenants with a copy of the gas safety certificate.
            </li>
            <li>
              <strong>Electrical Safety Standards in the Private Rented Sector (England)
              Regulations 2020</strong> &mdash; landlords must have electrical installations
              inspected every five years.
            </li>
            <li>
              <strong>Tenant Fees Act 2019</strong> &mdash; landlords must not charge tenants
              prohibited fees.
            </li>
          </ul>
          <p>
            3.2. Landlords must protect tenant deposits in a government-authorised tenancy deposit
            scheme within 30 days of receipt.
          </p>
          <p>
            3.3. All rental properties must have a valid Energy Performance Certificate (EPC) with
            a rating of E or above (unless a valid exemption is registered).
          </p>
        </section>

        <section id="service-provider-requirements">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            4. Service Provider Requirements
          </h2>
          <p>
            4.1. Service providers (tradespeople and contractors) must hold the appropriate
            qualifications and registrations for their trade:
          </p>
          <ul>
            <li>
              <strong>Gas Safe Register</strong> &mdash; mandatory for all gas engineers. Only Gas
              Safe registered engineers may carry out gas work.
            </li>
            <li>
              <strong>NICEIC / NAPIT / ELECSA</strong> &mdash; electricians must be registered with
              an approved competent person scheme for notifiable electrical work under Part P of the
              Building Regulations.
            </li>
            <li>
              <strong>TrustMark</strong> &mdash; we encourage (and may require) TrustMark
              registration as evidence of competence and consumer protection, including access to
              dispute resolution.
            </li>
            <li>
              <strong>Construction Industry Scheme (CIS)</strong> &mdash; contractors must be
              registered with HMRC under CIS where applicable.
            </li>
          </ul>
          <p>
            4.2. Service providers must carry appropriate public liability insurance (minimum
            &pound;1,000,000) and, where applicable, professional indemnity insurance.
          </p>
          <p>
            4.3. All work must comply with current Building Regulations, British Standards, and any
            relevant industry codes of practice.
          </p>
        </section>

        <section id="mortgage-broker-standards">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            5. Mortgage Broker Standards
          </h2>
          <p>
            5.1. Mortgage brokers and financial advisers accessible through Britestate must be
            authorised and regulated by the Financial Conduct Authority (FCA).
          </p>
          <p>
            5.2. Brokers must hold a recognised qualification, such as the Certificate in Mortgage
            Advice and Practice (CeMAP) or equivalent, and maintain their competence through
            continuing professional development (CPD).
          </p>
          <p>
            5.3. All mortgage advice must comply with the FCA&rsquo;s Mortgage Conduct of Business
            (MCOB) rules, including requirements to assess affordability, suitability, and to
            provide a Key Facts Illustration (KFI) before a mortgage offer.
          </p>
          <p>
            5.4. Britestate does not provide mortgage advice. We act as an introducer only. See our{" "}
            <Link href="/legal/regulatory-information" className="text-brand-primary hover:underline">
              Regulatory Information
            </Link>{" "}
            page for our FCA status.
          </p>
        </section>

        <section id="verification-and-compliance">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            6. Verification & Compliance
          </h2>
          <p>
            6.1. Britestate verifies professional credentials during the onboarding process. This
            includes:
          </p>
          <ul>
            <li>Checking FCA registration numbers against the FCA Register</li>
            <li>Verifying Gas Safe registration numbers against the Gas Safe Register</li>
            <li>Confirming TPO or PRS membership for estate agents</li>
            <li>Verifying NICEIC, NAPIT, or other competent person scheme registrations</li>
            <li>Confirming valid insurance certificates</li>
          </ul>
          <p>
            6.2. Verification is conducted at onboarding and periodically thereafter. Professionals
            must notify us promptly if their registration, insurance, or regulatory status changes.
          </p>
          <p>
            6.3. Professionals who fail verification or whose credentials lapse will have their
            accounts suspended until valid documentation is provided.
          </p>
        </section>

        <section id="complaints-and-disputes">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            7. Complaints & Disputes
          </h2>
          <p>
            7.1. If you have a complaint about a professional on our platform, you should first
            raise the matter directly with the professional concerned.
          </p>
          <p>
            7.2. If the matter is not resolved, you can escalate through our{" "}
            <Link href="/legal/complaints" className="text-brand-primary hover:underline">
              complaints procedure
            </Link>
            . We will investigate and may take action including issuing warnings, suspending
            accounts, or permanently removing professionals from the platform.
          </p>
          <p>
            7.3. For matters involving regulated professionals, you may also complain directly to
            the relevant regulatory body (see Section 8 below).
          </p>
          <p>
            7.4. Britestate is a member of The Property Ombudsman scheme for dispute resolution
            relating to platform services.
          </p>
        </section>

        <section id="regulatory-bodies">
          <h2 className="font-heading text-lg font-semibold text-foreground">8. Regulatory Bodies</h2>
          <p>
            8.1. The following regulatory bodies oversee the professionals operating on our
            platform:
          </p>
          <ul>
            <li>
              <strong>Financial Conduct Authority (FCA)</strong> &mdash; regulates mortgage brokers
              and financial advisers:{" "}
              <a href="https://www.fca.org.uk" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
                fca.org.uk
              </a>
            </li>
            <li>
              <strong>The Property Ombudsman (TPO)</strong> &mdash; redress scheme for estate agents
              and letting agents:{" "}
              <a href="https://www.tpos.co.uk" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
                tpos.co.uk
              </a>
            </li>
            <li>
              <strong>Gas Safe Register</strong> &mdash; the official register of gas engineers:{" "}
              <a href="https://www.gassaferegister.co.uk" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
                gassaferegister.co.uk
              </a>
            </li>
            <li>
              <strong>NICEIC</strong> &mdash; electrical competent person scheme:{" "}
              <a href="https://www.niceic.com" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
                niceic.com
              </a>
            </li>
            <li>
              <strong>TrustMark</strong> &mdash; government-endorsed quality scheme:{" "}
              <a href="https://www.trustmark.org.uk" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
                trustmark.org.uk
              </a>
            </li>
            <li>
              <strong>Information Commissioner&rsquo;s Office (ICO)</strong> &mdash; data protection
              regulator:{" "}
              <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
                ico.org.uk
              </a>
            </li>
            <li>
              <strong>Health and Safety Executive (HSE)</strong> &mdash; workplace and construction
              safety:{" "}
              <a href="https://www.hse.gov.uk" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
                hse.gov.uk
              </a>
            </li>
          </ul>
        </section>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Professional Standards",
            dateModified: LAST_UPDATED,
            publisher: { "@type": "Organization", name: "Britestate Ltd" },
            url: `${BASE_URL}/legal/professional-standards`,
          }),
        }}
      />
    </LegalPageShell>
  );
}
