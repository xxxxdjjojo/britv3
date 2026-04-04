import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

const LAST_UPDATED = "1 April 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "platform-status", label: "1. Platform Status" },
  { id: "fca-disclaimer", label: "2. FCA Disclaimer" },
  { id: "property-ombudsman", label: "3. The Property Ombudsman" },
  { id: "data-protection", label: "4. Data Protection" },
  { id: "anti-money-laundering", label: "5. Anti-Money Laundering" },
  { id: "consumer-rights", label: "6. Consumer Rights" },
  { id: "complaints-escalation", label: "7. Complaints Escalation" },
  { id: "contact-regulators", label: "8. Contact Regulators" },
];

export const metadata: Metadata = {
  title: "Regulatory Information | Britestate",
  description:
    "Regulatory status, FCA disclaimer, data protection registration, and consumer rights information for the Britestate property platform.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/regulatory-information` },
  openGraph: {
    title: "Regulatory Information | Britestate",
    description: "Britestate's regulatory status, FCA disclaimer, and consumer rights.",
  },
};

export default function RegulatoryInformationPage() {
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
        <span className="text-foreground">Regulatory Information</span>
      </nav>

      <h1 className="mb-2 font-heading text-2xl font-bold text-foreground">Regulatory Information</h1>
      <p className="mb-4 font-body text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      {/* Purple callout */}
      <div className="mb-8 rounded-xl bg-brand-accent-light dark:bg-brand-accent/20 p-4 ring-1 ring-brand-accent/30 dark:ring-brand-accent/30 font-body text-sm text-brand-accent dark:text-brand-accent">
        Britestate is a technology platform, not a regulated financial services firm. We act as an
        introducer only and do not provide financial, legal, or surveying advice. This page explains
        our regulatory position and your consumer rights.
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <section id="platform-status">
          <h2 className="font-heading text-lg font-semibold text-foreground">1. Platform Status</h2>
          <p>
            1.1. Britestate Ltd is a technology company registered in England and Wales (Company
            Number: 12345678). We operate a property technology platform that connects buyers,
            sellers, landlords, tenants, estate agents, and service providers.
          </p>
          <p>
            1.2. Britestate is <strong>not</strong> authorised or regulated by the Financial Conduct
            Authority (FCA). We do not provide regulated financial services, including mortgage
            advice, insurance mediation, or investment advice.
          </p>
          <p>
            1.3. Where our platform connects users with FCA-regulated professionals (such as
            mortgage brokers), we act as an <strong>introducer only</strong>. We do not assess the
            suitability of any financial product, and any introduction does not constitute a
            personal recommendation.
          </p>
          <p>
            1.4. Britestate does not act as an estate agent, letting agent, surveyor, solicitor, or
            any other regulated professional. See our{" "}
            <Link href="/legal/disclaimer" className="text-brand-primary hover:underline">
              Disclaimer
            </Link>{" "}
            for further detail on our intermediary status.
          </p>
        </section>

        <section id="fca-disclaimer">
          <h2 className="font-heading text-lg font-semibold text-foreground">2. FCA Disclaimer</h2>
          <p>
            2.1. Britestate Ltd is not authorised or regulated by the Financial Conduct Authority.
            Our FCA status can be verified on the{" "}
            <a
              href="https://register.fca.org.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-primary hover:underline"
            >
              FCA Register
            </a>
            .
          </p>
          <p>
            2.2. Where we introduce you to a mortgage broker, financial adviser, or insurance
            provider, we may receive a fee or commission for the introduction. This will always be
            disclosed to you before you proceed.
          </p>
          <p>
            2.3. You should satisfy yourself that any financial professional you engage with
            through our platform is FCA-authorised for the services they provide. You can check
            the FCA Register or call the FCA consumer helpline on 0800 111 6768.
          </p>
          <p>
            2.4. If a financial professional you were introduced to through Britestate provides
            unsuitable advice, your recourse is with that professional and, if applicable, the
            Financial Ombudsman Service &mdash; not with Britestate.
          </p>
        </section>

        <section id="property-ombudsman">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            3. The Property Ombudsman
          </h2>
          <p>
            3.1. Britestate is a member of The Property Ombudsman (TPO) scheme for consumer redress
            relating to our platform services.
          </p>
          <p>
            3.2. If you are unable to resolve a complaint through our internal{" "}
            <Link href="/legal/complaints" className="text-brand-primary hover:underline">
              complaints procedure
            </Link>
            , you may escalate your complaint to The Property Ombudsman free of charge.
          </p>
          <p>
            3.3. The Property Ombudsman can be contacted at:{" "}
            <a
              href="https://www.tpos.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-primary hover:underline"
            >
              tpos.co.uk
            </a>{" "}
            or by post at: The Property Ombudsman, Milford House, 43-55 Milford Street, Salisbury,
            SP1 2BP.
          </p>
        </section>

        <section id="data-protection">
          <h2 className="font-heading text-lg font-semibold text-foreground">4. Data Protection</h2>
          <p>
            4.1. Britestate Ltd is registered with the Information Commissioner&rsquo;s Office (ICO)
            as a data controller. Our ICO registration number is ZB123456.
          </p>
          <p>
            4.2. We process personal data in accordance with the UK General Data Protection
            Regulation (UK GDPR) and the Data Protection Act 2018. Full details of how we collect,
            use, and protect your data are set out in our{" "}
            <Link href="/legal/privacy" className="text-brand-primary hover:underline">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/legal/gdpr-rights" className="text-brand-primary hover:underline">
              GDPR Rights
            </Link>{" "}
            pages.
          </p>
          <p>
            4.3. Our Data Protection Officer can be contacted at{" "}
            <a href="mailto:dpo@britestate.co.uk" className="text-brand-primary hover:underline">
              dpo@britestate.co.uk
            </a>
            .
          </p>
        </section>

        <section id="anti-money-laundering">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            5. Anti-Money Laundering
          </h2>
          <p>
            5.1. Britestate supports UK anti-money laundering (AML) obligations. While we are not
            directly subject to the Money Laundering Regulations 2017 as a technology platform, we
            implement measures to deter and detect financial crime on our platform.
          </p>
          <p>
            5.2. Estate agents and other regulated professionals using our platform are required to
            comply with their own AML obligations, including conducting customer due diligence (CDD)
            and reporting suspicious activity to the National Crime Agency (NCA).
          </p>
          <p>
            5.3. We require identity verification for professional accounts and may request
            additional documentation to support AML checks. See our{" "}
            <Link href="/legal/aml-policy" className="text-brand-primary hover:underline">
              AML Policy
            </Link>{" "}
            for full details.
          </p>
        </section>

        <section id="consumer-rights">
          <h2 className="font-heading text-lg font-semibold text-foreground">6. Consumer Rights</h2>
          <p>
            6.1. Your rights as a consumer are protected under the Consumer Rights Act 2015 (CRA
            2015). Under the CRA 2015, digital content and services supplied by Britestate must be:
          </p>
          <ul>
            <li>Of satisfactory quality</li>
            <li>Fit for a particular purpose</li>
            <li>As described</li>
          </ul>
          <p>
            6.2. If our services do not meet these standards, you may be entitled to a repair,
            replacement, or refund. See our{" "}
            <Link href="/legal/refund-policy" className="text-brand-primary hover:underline">
              Refund Policy
            </Link>{" "}
            for details on how to exercise these rights.
          </p>
          <p>
            6.3. Nothing in our{" "}
            <Link href="/legal/terms" className="text-brand-primary hover:underline">
              Terms of Service
            </Link>{" "}
            excludes or limits your statutory consumer rights.
          </p>
          <p>
            6.4. For paid services purchased online, you have a 14-day cooling-off period under the
            Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013.
          </p>
        </section>

        <section id="complaints-escalation">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            7. Complaints Escalation
          </h2>
          <p>
            7.1. We aim to resolve all complaints within 8 weeks. If you are dissatisfied with our
            response, you may escalate your complaint to the appropriate external body:
          </p>
          <ul>
            <li>
              <strong>Platform services</strong> &mdash; The Property Ombudsman (TPO)
            </li>
            <li>
              <strong>Data protection</strong> &mdash; Information Commissioner&rsquo;s Office (ICO)
            </li>
            <li>
              <strong>Financial services</strong> &mdash; Financial Ombudsman Service (for complaints
              about FCA-regulated firms introduced through our platform)
            </li>
            <li>
              <strong>Consumer disputes</strong> &mdash; Online Dispute Resolution (ODR) platform
              at{" "}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary hover:underline"
              >
                ec.europa.eu/consumers/odr
              </a>
            </li>
          </ul>
          <p>
            7.2. Full details of our internal complaints process are available on our{" "}
            <Link href="/legal/complaints" className="text-brand-primary hover:underline">
              Complaints
            </Link>{" "}
            page.
          </p>
        </section>

        <section id="contact-regulators">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            8. Contact Regulators
          </h2>
          <p>
            8.1. You can contact the following regulators directly:
          </p>
          <ul>
            <li>
              <strong>Financial Conduct Authority (FCA)</strong>:{" "}
              <a href="https://www.fca.org.uk" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
                fca.org.uk
              </a>{" "}
              | 0800 111 6768
            </li>
            <li>
              <strong>The Property Ombudsman (TPO)</strong>:{" "}
              <a href="https://www.tpos.co.uk" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
                tpos.co.uk
              </a>{" "}
              | 01722 333 306
            </li>
            <li>
              <strong>Information Commissioner&rsquo;s Office (ICO)</strong>:{" "}
              <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
                ico.org.uk
              </a>{" "}
              | 0303 123 1113
            </li>
            <li>
              <strong>Financial Ombudsman Service</strong>:{" "}
              <a href="https://www.financial-ombudsman.org.uk" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
                financial-ombudsman.org.uk
              </a>{" "}
              | 0800 023 4567
            </li>
            <li>
              <strong>Citizens Advice</strong>:{" "}
              <a href="https://www.citizensadvice.org.uk" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
                citizensadvice.org.uk
              </a>{" "}
              | 0808 223 1133
            </li>
            <li>
              <strong>Trading Standards</strong>: contact your local authority trading standards
              office via{" "}
              <a href="https://www.gov.uk/find-local-trading-standards-office" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
                gov.uk
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
            name: "Regulatory Information",
            dateModified: LAST_UPDATED,
            publisher: { "@type": "Organization", name: "Britestate Ltd" },
            url: `${BASE_URL}/legal/regulatory-information`,
          }),
        }}
      />
    </LegalPageShell>
  );
}
