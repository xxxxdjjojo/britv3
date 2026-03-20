import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

const LAST_UPDATED = "13 March 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "policy-statement", label: "1. Policy Statement" },
  { id: "risk-assessment", label: "2. Risk Assessment Approach" },
  { id: "cdd", label: "3. Customer Due Diligence" },
  { id: "edd", label: "4. Enhanced Due Diligence" },
  { id: "sar-obligations", label: "5. Suspicious Activity Reporting" },
  { id: "record-keeping", label: "6. Record Keeping" },
  { id: "staff-training", label: "7. Staff Training" },
  { id: "mlro-contact", label: "8. MLRO Contact" },
];

export const metadata: Metadata = {
  title: "Anti-Money Laundering Policy",
  description: "Britestate's AML obligations under the Money Laundering Regulations 2017.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/aml-policy` },
  openGraph: { title: "Anti-Money Laundering Policy", description: "Britestate AML Policy." },
};

export default function AmlPolicyPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-primary transition-colors">Legal</Link>
        <span>/</span>
        <span className="text-neutral-900">AML Policy</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">Anti-Money Laundering Policy</h1>
      <p className="mb-8 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="policy-statement">
          <h2 className="text-2xl font-bold font-heading">1. Policy Statement</h2>
          <p>
            Britestate Ltd is committed to preventing money laundering and terrorist financing in accordance with the
            Proceeds of Crime Act 2002 and the Money Laundering Regulations 2017. All staff and partners are obliged
            to comply with this policy. {/* TODO: legal review */}
          </p>
        </section>

        <section id="risk-assessment">
          <h2 className="text-2xl font-bold font-heading">2. Risk Assessment Approach</h2>
          <p>
            We apply a risk-based approach to AML, assessing the risk of money laundering and terrorist financing
            presented by each customer, transaction, and jurisdiction. Risk factors include transaction value,
            customer type, and geographic risk. {/* TODO: legal review */}
          </p>
        </section>

        <section id="cdd">
          <h2 className="text-2xl font-bold font-heading">3. Customer Due Diligence</h2>
          <p>
            We apply customer due diligence (CDD) to all users conducting or facilitating property transactions above
            relevant thresholds. CDD includes verification of identity (name, date of birth, address) and source of
            funds. {/* TODO: legal review */}
          </p>
        </section>

        <section id="edd">
          <h2 className="text-2xl font-bold font-heading">4. Enhanced Due Diligence</h2>
          <p>
            Enhanced due diligence (EDD) is applied to high-risk customers, politically exposed persons (PEPs),
            and transactions from high-risk jurisdictions. EDD requires senior management approval and additional
            identity verification. {/* TODO: legal review */}
          </p>
        </section>

        <section id="sar-obligations">
          <h2 className="text-2xl font-bold font-heading">5. Suspicious Activity Reporting</h2>
          <p>
            All staff are required to report suspicions of money laundering to the Money Laundering Reporting Officer
            (MLRO) immediately. The MLRO will assess reports and submit Suspicious Activity Reports (SARs) to the
            National Crime Agency (NCA) as required under the Proceeds of Crime Act 2002. {/* TODO: legal review */}
          </p>
        </section>

        <section id="record-keeping">
          <h2 className="text-2xl font-bold font-heading">6. Record Keeping</h2>
          <p>
            All CDD records, transaction records, and SARs must be retained for a minimum of <strong>5 years</strong>{" "}
            from the end of the business relationship, as required by the Money Laundering Regulations 2017. {/* TODO: legal review */}
          </p>
        </section>

        <section id="staff-training">
          <h2 className="text-2xl font-bold font-heading">7. Staff Training</h2>
          <p>
            All relevant staff receive AML training on appointment and at regular intervals thereafter. Training
            covers recognition of suspicious activity, CDD procedures, and SAR obligations. {/* TODO: legal review */}
          </p>
        </section>

        <section id="mlro-contact">
          <h2 className="text-2xl font-bold font-heading">8. MLRO Contact</h2>
          <p>
            {/* TODO: confirm MLRO contact */}
            Money Laundering Reporting Officer:{" "}
            <a href="mailto:compliance@britestate.co.uk">compliance@britestate.co.uk</a>
          </p>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Anti-Money Laundering Policy",
            dateModified: LAST_UPDATED,
            publisher: { "@type": "Organization", name: "Britestate Ltd" },
            url: `${BASE_URL}/legal/aml-policy`,
          }),
        }}
      />
    </LegalPageShell>
  );
}
