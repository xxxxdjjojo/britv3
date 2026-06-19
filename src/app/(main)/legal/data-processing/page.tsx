import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { brandConfig, appBaseUrl } from "@/config/brand";

const LAST_UPDATED = "24 March 2026";
const BASE_URL = appBaseUrl();

const SECTIONS = [
  { id: "scope", label: "Scope" },
  { id: "roles", label: "Roles" },
  { id: "controller-obligations", label: "Controller Obligations" },
  { id: "britestate-obligations", label: `${brandConfig.displayName} Obligations` },
  { id: "sub-processors", label: "Sub-Processors" },
  { id: "international-transfers", label: "International Transfers" },
  { id: "audit-rights", label: "Audit Rights" },
  { id: "full-dpa", label: "Full DPA" },
];

const SUB_PROCESSORS = [
  { name: "Supabase", purpose: "Database hosting and authentication", location: "EU / USA (SCCs)" },
  { name: "Stripe", purpose: "Payment processing", location: "USA (SCCs)" },
  { name: "Resend", purpose: "Transactional email", location: "USA (SCCs)" },
  { name: "PostHog", purpose: "Product analytics", location: "EU" },
  { name: "Sentry", purpose: "Error monitoring", location: "USA (SCCs)" },
];

export const metadata: Metadata = {
  title: `Data Processing Agreement | ${brandConfig.displayName}`,
  description:
    `Summary of the Data Processing Agreement applying when ${brandConfig.displayName} processes personal data on behalf of estate agents and service providers who are data controllers under UK GDPR.`,
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/data-processing` },
  openGraph: {
    title: `Data Processing Agreement | ${brandConfig.displayName}`,
    description: `${brandConfig.displayName} Data Processing Agreement summary for estate agents and service providers.`,
  },
};

export default function DataProcessingPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-primary transition-colors">Legal</Link>
        <span>/</span>
        <span className="text-neutral-900">Data Processing Agreement</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">Data Processing Agreement</h1>
      <p className="mb-4 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="mb-8 bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-lg p-4 text-sm">
        This is a summary of the Data Processing Agreement (&ldquo;DPA&rdquo;) that applies when {brandConfig.displayName} processes
        personal data on behalf of Users who are data controllers (primarily estate agents and service providers).
        The full DPA is available on request from{" "}
        <a href={`mailto:${brandConfig.emails.privacy}`} className="underline">{brandConfig.emails.privacy}</a>.
      </div>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="scope">
          <h2 className="text-2xl font-bold font-heading">Scope</h2>
          <p>
            This DPA applies where an estate agent or service provider uploads client data to the Platform and
            {brandConfig.displayName} processes it on their instructions.
          </p>
        </section>

        <section id="roles">
          <h2 className="text-2xl font-bold font-heading">Roles</h2>
          <p>
            <strong>{brandConfig.displayName}&rsquo;s Role:</strong> Data Processor (under Art. 28 UK GDPR).
          </p>
          <p>
            The estate agent or service provider who uploads client data acts as the <strong>Data Controller</strong>,
            determining the purposes and means of processing.
          </p>
        </section>

        <section id="controller-obligations">
          <h2 className="text-2xl font-bold font-heading">Controller Obligations</h2>
          <p>The controller must:</p>
          <ul>
            <li>Have a lawful basis for the personal data it uploads;</li>
            <li>Have provided appropriate privacy notices to data subjects;</li>
            <li>
              Not instruct {brandConfig.displayName} to process data in a manner that would breach UK GDPR.
            </li>
          </ul>
        </section>

        <section id="britestate-obligations">
          <h2 className="text-2xl font-bold font-heading">{brandConfig.displayName} Obligations</h2>
          <p>{brandConfig.displayName} will:</p>
          <ul>
            <li>Process data only on documented instructions from the controller;</li>
            <li>Implement appropriate technical and organisational security measures;</li>
            <li>Notify the controller of any data breach without undue delay;</li>
            <li>Assist the controller in fulfilling data subject requests;</li>
            <li>Delete or return all personal data on termination;</li>
            <li>Make available information necessary to demonstrate compliance.</li>
          </ul>
        </section>

        <section id="sub-processors">
          <h2 className="text-2xl font-bold font-heading">Sub-Processors</h2>
          <p className="mb-4">
            {brandConfig.displayName} uses the sub-processors listed in our{" "}
            <Link href="/legal/privacy">Privacy Policy</Link> (Section 5). We will notify controllers at least
            30 days before adding a new sub-processor. Controllers may object, and if the objection cannot be
            resolved, may terminate the DPA.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-neutral-200 p-3 text-left font-semibold">Sub-Processor</th>
                  <th className="border border-neutral-200 p-3 text-left font-semibold">Purpose</th>
                  <th className="border border-neutral-200 p-3 text-left font-semibold">Location</th>
                </tr>
              </thead>
              <tbody>
                {SUB_PROCESSORS.map((sp) => (
                  <tr key={sp.name}>
                    <td className="border border-neutral-200 p-3 font-medium">{sp.name}</td>
                    <td className="border border-neutral-200 p-3">{sp.purpose}</td>
                    <td className="border border-neutral-200 p-3">{sp.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="international-transfers">
          <h2 className="text-2xl font-bold font-heading">International Transfers</h2>
          <p>
            International transfers are handled as described in our{" "}
            <Link href="/legal/privacy">Privacy Policy</Link> (Section 7). Transfers outside the UK are protected
            by UK adequacy decisions or Standard Contractual Clauses (SCCs).
          </p>
        </section>

        <section id="audit-rights">
          <h2 className="text-2xl font-bold font-heading">Audit Rights</h2>
          <p>
            Controllers may audit {brandConfig.displayName}&rsquo;s compliance with this DPA with reasonable notice and during
            business hours, subject to confidentiality obligations.
          </p>
        </section>

        <section id="full-dpa">
          <h2 className="text-2xl font-bold font-heading">Full DPA</h2>
          <p>
            The full Data Processing Agreement is available on request from{" "}
            <a href={`mailto:${brandConfig.emails.privacy}`}>{brandConfig.emails.privacy}</a>.
          </p>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Data Processing Agreement",
            dateModified: LAST_UPDATED,
            publisher: { "@type": "Organization", name: `${brandConfig.displayName} Ltd` },
            url: `${BASE_URL}/legal/data-processing`,
          }),
        }}
      />
    </LegalPageShell>
  );
}
