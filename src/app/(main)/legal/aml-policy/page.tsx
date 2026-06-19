import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { brandConfig, appBaseUrl } from "@/config/brand";

const LAST_UPDATED = "24 March 2026";
const BASE_URL = appBaseUrl();

const SECTIONS = [
  { id: "policy-statement", label: "1. Policy Statement" },
  { id: "what-aml-means-for-you", label: "2. What AML Means for You" },
  { id: "cdd", label: "3. Customer Due Diligence" },
  { id: "sanctions", label: "4. Sanctions Screening" },
  { id: "suspicious-activity", label: "5. Reporting Suspicious Activity" },
  { id: "regulatory-oversight", label: "6. Regulatory Oversight" },
];

export const metadata: Metadata = {
  title: `Anti-Money Laundering Policy | ${brandConfig.displayName}`,
  description:
    `${brandConfig.displayName}&rsquo;s public AML statement: our obligations under the Money Laundering Regulations 2017 and what users need to know.`,
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/aml-policy` },
  openGraph: {
    title: `Anti-Money Laundering Policy | ${brandConfig.displayName}`,
    description: `${brandConfig.displayName} AML Policy — public statement.`,
  },
};

export default function AmlPolicyPage() {
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
        <span className="text-neutral-900">AML Policy</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">
        Anti-Money Laundering Policy
      </h1>
      <p className="mb-4 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      {/* Yellow info callout */}
      <div className="mb-8 bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-lg p-4 text-sm">
        This is a public summary of our Anti-Money Laundering obligations. Our full internal AML
        policy — including MLRO procedures, SAR processes, and staff training programmes — is
        available on request by contacting{" "}
        <a href={`mailto:${brandConfig.emails.compliance}`} className="underline hover:no-underline">
          {brandConfig.emails.compliance}
        </a>
        .
      </div>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="policy-statement">
          <h2 className="text-2xl font-bold font-heading">1. Policy Statement</h2>
          <p>
            1.1. {brandConfig.displayName} Ltd is committed to preventing the use of its platform for money
            laundering and terrorist financing. This policy sets out our obligations under the Money
            Laundering, Terrorist Financing and Transfer of Funds (Information on the Payer)
            Regulations 2017 (&ldquo;MLR 2017&rdquo;), the Proceeds of Crime Act 2002
            (&ldquo;POCA&rdquo;), the Terrorism Act 2000, and the Sanctions and Anti-Money
            Laundering Act 2018.
          </p>
          <p>
            1.2. {brandConfig.displayName} is registered with HMRC for AML supervision. Our registration reference
            is [HMRC REFERENCE].
          </p>
        </section>

        <section id="what-aml-means-for-you">
          <h2 className="text-2xl font-bold font-heading">2. What AML Means for You</h2>
          <p>
            2.1. As a platform facilitating property transactions, we are required by law to
            conduct checks on users involved in those transactions. This is to prevent the
            platform from being used to launder the proceeds of crime or to finance terrorism.
          </p>
          <p>
            2.2. AML requirements apply to users who are conducting or facilitating property
            transactions through the platform — including buyers, sellers, landlords, and estate
            agents. General browsing and property searching do not trigger AML checks.
          </p>
          <p>
            2.3. We apply a risk-based approach. The level of verification required will depend
            on the nature and value of the transaction, the type of user, and any risk factors
            identified during our assessment.
          </p>
        </section>

        <section id="cdd">
          <h2 className="text-2xl font-bold font-heading">3. Customer Due Diligence</h2>
          <p>
            3.1. Before establishing a business relationship or facilitating a transaction, we may
            require you to provide: proof of identity (full legal name, date of birth, residential
            address); proof of the source of funds for the transaction; and, for corporate entities,
            details of beneficial owners (individuals owning or controlling more than 25%).
          </p>
          <p>
            3.2. We may use technology-assisted identity verification, including document checks
            and biometric verification, provided by regulated third-party providers.
          </p>
          <p>
            3.3. We cannot proceed with a business relationship or transaction where customer due
            diligence cannot be satisfactorily completed. If you are unable to provide the required
            information, we may need to suspend or decline your use of relevant platform features.
          </p>
          <p>
            3.4. Enhanced checks apply where there is a higher risk of money laundering, including
            for transactions involving politically exposed persons (PEPs), high-risk countries
            identified by HM Treasury, or unusually large or complex transactions.
          </p>
        </section>

        <section id="sanctions">
          <h2 className="text-2xl font-bold font-heading">4. Sanctions Screening</h2>
          <p>
            4.1. We screen users involved in property transactions against the Office of Financial
            Sanctions Implementation (OFSI) consolidated sanctions list and other relevant
            sanctions lists maintained by UK and international authorities.
          </p>
          <p>
            4.2. We will not proceed with any transaction where a confirmed sanctions match is
            identified. Sanctions matches are escalated immediately in accordance with our
            internal procedures.
          </p>
        </section>

        <section id="suspicious-activity">
          <h2 className="text-2xl font-bold font-heading">5. Reporting Suspicious Activity</h2>
          <p>
            5.1. If you have concerns about suspected money laundering or financial crime
            connected to activity on the platform, please contact us at{" "}
            <a href={`mailto:${brandConfig.emails.compliance}`}>{brandConfig.emails.compliance}</a>.
          </p>
          <p>
            5.2. You can also report suspected financial crime directly to the National Crime
            Agency (NCA) via the{" "}
            <a
              href="https://www.nationalcrimeagency.gov.uk/what-we-do/crime-threats/money-laundering-and-illicit-finance"
              target="_blank"
              rel="noopener noreferrer"
            >
              NCA website
            </a>
            , or to Action Fraud at actionfraud.police.uk.
          </p>
          <p>
            5.3. Please be aware that it is a criminal offence under POCA to &ldquo;tip off&rdquo;
            a person that a Suspicious Activity Report has been or may be made. If you have
            concerns, contact us privately rather than alerting any third party.
          </p>
        </section>

        <section id="regulatory-oversight">
          <h2 className="text-2xl font-bold font-heading">6. Regulatory Oversight</h2>
          <p>
            6.1. {brandConfig.displayName} Ltd is supervised by HMRC for the purposes of the Money Laundering
            Regulations 2017. HMRC AML supervision registration reference: [HMRC REFERENCE].
          </p>
          <p>
            6.2. A member of our board of directors has been appointed as the officer responsible
            for AML compliance, with oversight of our Money Laundering Reporting Officer (MLRO).
          </p>
          <p>
            6.3. We maintain records of all customer due diligence and transaction records for a
            minimum of five years in accordance with Regulation 40 of the MLR 2017.
          </p>
          <p>
            6.4. For external concerns about money laundering activity on the platform, contact:{" "}
            <a href={`mailto:${brandConfig.emails.compliance}`}>{brandConfig.emails.compliance}</a>
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
            name: "Anti-Money Laundering Policy",
            dateModified: LAST_UPDATED,
            publisher: { "@type": "Organization", name: `${brandConfig.displayName} Ltd` },
            url: `${BASE_URL}/legal/aml-policy`,
          }),
        }}
      />
    </LegalPageShell>
  );
}
