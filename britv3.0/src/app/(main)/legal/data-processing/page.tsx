import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

const LAST_UPDATED = "13 March 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "definitions", label: "1. Definitions" },
  { id: "subject-matter", label: "2. Subject Matter & Duration" },
  { id: "nature-and-purpose", label: "3. Nature & Purpose of Processing" },
  { id: "personal-data-types", label: "4. Types of Personal Data" },
  { id: "processor-obligations", label: "5. Obligations of the Processor" },
  { id: "sub-processors", label: "6. Sub-Processors" },
  { id: "security-measures", label: "7. Security Measures" },
  { id: "breach-notification", label: "8. Data Breach Notification" },
  { id: "audit-rights", label: "9. Audit Rights" },
  { id: "termination", label: "10. Termination" },
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
  description: "DPA terms for service providers operating on the Britestate platform.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/data-processing` },
  openGraph: { title: "Data Processing Agreement | Britestate", description: "Britestate Data Processing Agreement." },
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
      <p className="mb-8 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="mb-8 bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-lg p-4 text-sm">
        This agreement applies to all service providers and businesses integrating with the Britestate API.
        {/* TODO: legal review */}
      </div>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="definitions">
          <h2 className="text-2xl font-bold font-heading">1. Definitions</h2>
          <p>
            &ldquo;Controller&rdquo; means the entity determining the purposes and means of processing personal data.
            &ldquo;Processor&rdquo; means Britestate Ltd, processing data on behalf of the Controller.
            &ldquo;Personal Data&rdquo; has the meaning given in UK GDPR Article 4. {/* TODO: legal review */}
          </p>
        </section>

        <section id="subject-matter">
          <h2 className="text-2xl font-bold font-heading">2. Subject Matter &amp; Duration</h2>
          <p>
            This DPA governs the processing of personal data by Britestate Ltd as Processor on behalf of the Controller
            for the duration of the service agreement. Processing will cease on termination of that agreement. {/* TODO: legal review */}
          </p>
        </section>

        <section id="nature-and-purpose">
          <h2 className="text-2xl font-bold font-heading">3. Nature &amp; Purpose of Processing</h2>
          <p>
            The Processor provides a property portal platform, including listing management, lead generation, user
            authentication, and communication tools. Processing is necessary for the performance of the service. {/* TODO: legal review */}
          </p>
        </section>

        <section id="personal-data-types">
          <h2 className="text-2xl font-bold font-heading">4. Types of Personal Data</h2>
          <p>Categories of personal data processed include: name, email address, phone number, IP address, property
          search history, and communications between users. {/* TODO: legal review */}</p>
        </section>

        <section id="processor-obligations">
          <h2 className="text-2xl font-bold font-heading">5. Obligations of the Processor</h2>
          <p>
            Britestate Ltd will: process personal data only on documented instructions from the Controller; ensure
            persons authorised to process have committed to confidentiality; implement appropriate technical and
            organisational security measures; assist the Controller in responding to data subject rights requests;
            delete or return all personal data on termination. {/* TODO: legal review */}
          </p>
        </section>

        <section id="sub-processors">
          <h2 className="text-2xl font-bold font-heading">6. Sub-Processors</h2>
          <p className="mb-4">
            Britestate Ltd uses the following sub-processors. International transfers are protected by UK adequacy
            decisions or Standard Contractual Clauses (SCCs). {/* TODO: legal review */}
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

        <section id="security-measures">
          <h2 className="text-2xl font-bold font-heading">7. Security Measures</h2>
          <p>
            Technical measures include: encryption in transit (TLS 1.2+), encryption at rest, row-level security in the
            database, and access controls. Organisational measures include: staff confidentiality obligations, incident
            response procedures, and regular security reviews. {/* TODO: legal review */}
          </p>
        </section>

        <section id="breach-notification">
          <h2 className="text-2xl font-bold font-heading">8. Data Breach Notification</h2>
          <p>
            In the event of a personal data breach, Britestate Ltd will notify the Controller without undue delay and
            within <strong>72 hours</strong> of becoming aware, as required by UK GDPR Article 33. The notification
            will include the nature of the breach, categories affected, and steps taken to address it. {/* TODO: legal review */}
          </p>
        </section>

        <section id="audit-rights">
          <h2 className="text-2xl font-bold font-heading">9. Audit Rights</h2>
          <p>
            The Controller may audit Britestate Ltd&apos;s compliance with this DPA on reasonable notice and no more
            than once per year, at the Controller&apos;s own expense. {/* TODO: legal review */}
          </p>
        </section>

        <section id="termination">
          <h2 className="text-2xl font-bold font-heading">10. Termination</h2>
          <p>
            On expiry or termination of the service agreement, Britestate Ltd will, at the Controller&apos;s choice,
            delete or return all personal data within 30 days, except where retention is required by law. {/* TODO: legal review */}
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
