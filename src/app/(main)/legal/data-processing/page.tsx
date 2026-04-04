import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

const LAST_UPDATED = "24 March 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "scope", label: "Scope" },
  { id: "roles", label: "Roles" },
  { id: "controller-obligations", label: "Controller Obligations" },
  { id: "britestate-obligations", label: "Britestate Obligations" },
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
  title: "Data Processing Agreement | Britestate",
  description:
    "Summary of the Data Processing Agreement applying when Britestate processes personal data on behalf of estate agents and service providers who are data controllers under UK GDPR.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/data-processing` },
  openGraph: {
    title: "Data Processing Agreement | Britestate",
    description: "Britestate Data Processing Agreement summary for estate agents and service providers.",
  },
};

export default function DataProcessingPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      <nav className="mb-6 flex items-center gap-2 font-body text-sm text-neutral-500">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-foreground transition-colors">Legal</Link>
        <span>/</span>
        <span className="text-foreground">Data Processing Agreement</span>
      </nav>

      <h1 className="mb-2 font-heading text-2xl font-bold text-foreground">Data Processing Agreement</h1>
      <p className="mb-4 font-body text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="mb-8 rounded-xl bg-warning-light dark:bg-warning/10 p-4 ring-1 ring-warning/30 dark:ring-warning/40 font-body text-sm text-warning dark:text-warning">
        This is a summary of the Data Processing Agreement (&ldquo;DPA&rdquo;) that applies when Britestate processes
        personal data on behalf of Users who are data controllers (primarily estate agents and service providers).
        The full DPA is available on request from{" "}
        <a href="mailto:privacy@britestate.co.uk" className="underline">privacy@britestate.co.uk</a>.
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <section id="scope">
          <h2 className="font-heading text-lg font-semibold text-foreground">Scope</h2>
          <p>
            This DPA applies where an estate agent or service provider uploads client data to the Platform and
            Britestate processes it on their instructions.
          </p>
        </section>

        <section id="roles">
          <h2 className="font-heading text-lg font-semibold text-foreground">Roles</h2>
          <p>
            <strong>Britestate&rsquo;s Role:</strong> Data Processor (under Art. 28 UK GDPR).
          </p>
          <p>
            The estate agent or service provider who uploads client data acts as the <strong>Data Controller</strong>,
            determining the purposes and means of processing.
          </p>
        </section>

        <section id="controller-obligations">
          <h2 className="font-heading text-lg font-semibold text-foreground">Controller Obligations</h2>
          <p>The controller must:</p>
          <ul>
            <li>Have a lawful basis for the personal data it uploads;</li>
            <li>Have provided appropriate privacy notices to data subjects;</li>
            <li>
              Not instruct Britestate to process data in a manner that would breach UK GDPR.
            </li>
          </ul>
        </section>

        <section id="britestate-obligations">
          <h2 className="font-heading text-lg font-semibold text-foreground">Britestate Obligations</h2>
          <p>Britestate will:</p>
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
          <h2 className="font-heading text-lg font-semibold text-foreground">Sub-Processors</h2>
          <p className="mb-4">
            Britestate uses the sub-processors listed in our{" "}
            <Link href="/legal/privacy">Privacy Policy</Link> (Section 5). We will notify controllers at least
            30 days before adding a new sub-processor. Controllers may object, and if the objection cannot be
            resolved, may terminate the DPA.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-neutral-50">
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
          <h2 className="font-heading text-lg font-semibold text-foreground">International Transfers</h2>
          <p>
            International transfers are handled as described in our{" "}
            <Link href="/legal/privacy">Privacy Policy</Link> (Section 7). Transfers outside the UK are protected
            by UK adequacy decisions or Standard Contractual Clauses (SCCs).
          </p>
        </section>

        <section id="audit-rights">
          <h2 className="font-heading text-lg font-semibold text-foreground">Audit Rights</h2>
          <p>
            Controllers may audit Britestate&rsquo;s compliance with this DPA with reasonable notice and during
            business hours, subject to confidentiality obligations.
          </p>
        </section>

        <section id="full-dpa">
          <h2 className="font-heading text-lg font-semibold text-foreground">Full DPA</h2>
          <p>
            The full Data Processing Agreement is available on request from{" "}
            <a href="mailto:privacy@britestate.co.uk">privacy@britestate.co.uk</a>.
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
            publisher: { "@type": "Organization", name: "Britestate Ltd" },
            url: `${BASE_URL}/legal/data-processing`,
          }),
        }}
      />
    </LegalPageShell>
  );
}
