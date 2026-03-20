import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

const LAST_UPDATED = "13 March 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "introduction", label: "1. Introduction" },
  { id: "permitted-uses", label: "2. Permitted Uses" },
  { id: "prohibited-conduct", label: "3. Prohibited Conduct" },
  { id: "content-standards", label: "4. Content Standards" },
  { id: "enforcement", label: "5. Enforcement & Suspension" },
  { id: "appeals", label: "6. Appeals Process" },
];

export const metadata: Metadata = {
  title: "Acceptable Use Policy",
  description: "Conduct standards and prohibited activities on the Britestate platform.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/acceptable-use` },
};

export default function AcceptableUsePage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-primary transition-colors">Legal</Link>
        <span>/</span>
        <span className="text-neutral-900">Acceptable Use Policy</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">Acceptable Use Policy</h1>
      <p className="mb-4 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="mb-8 bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-lg p-4 text-sm">
        This policy supplements our{" "}
        <Link href="/legal/terms" className="underline">Terms of Service</Link>.
        Violations may result in account suspension. {/* TODO: legal review */}
      </div>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="introduction">
          <h2 className="text-2xl font-bold font-heading">1. Introduction</h2>
          <p>
            This Acceptable Use Policy governs your conduct on the Britestate platform. It supplements the Terms of
            Service and applies to all users. Relevant legislation includes the Fraud Act 2006, the Computer Misuse
            Act 1990, and the Online Safety Act 2023. {/* TODO: legal review */}
          </p>
        </section>

        <section id="permitted-uses">
          <h2 className="text-2xl font-bold font-heading">2. Permitted Uses</h2>
          <p>
            You may use Britestate to search for, list, and transact on residential and commercial property; to engage
            licensed estate agents and service providers; and to communicate with other users in connection with
            genuine property transactions. {/* TODO: legal review */}
          </p>
        </section>

        <section id="prohibited-conduct">
          <h2 className="text-2xl font-bold font-heading">3. Prohibited Conduct</h2>
          <p>You must not use Britestate to:</p>
          <ul>
            <li>Post fraudulent, misleading, or duplicate property listings;</li>
            <li>Impersonate any person or entity;</li>
            <li>Scrape, crawl, or harvest data without written permission;</li>
            <li>Transmit malware, viruses, or other harmful code (Computer Misuse Act 1990);</li>
            <li>Commit fraud or money laundering (Fraud Act 2006, Proceeds of Crime Act 2002);</li>
            <li>Harass, threaten, or abuse other users;</li>
            <li>Circumvent security or access controls;</li>
            <li>Post illegal content as defined by the Online Safety Act 2023.</li>
          </ul>
          {/* TODO: legal review */}
        </section>

        <section id="content-standards">
          <h2 className="text-2xl font-bold font-heading">4. Content Standards</h2>
          <p>
            All content you post must be accurate, lawful, and not defamatory. Property photos must represent the
            actual property. Listing details must match the marketed property. Agent credentials must be genuine. {/* TODO: legal review */}
          </p>
        </section>

        <section id="enforcement">
          <h2 className="text-2xl font-bold font-heading">5. Enforcement &amp; Suspension</h2>
          <p>
            We reserve the right to remove content, suspend, or terminate accounts that breach this policy without
            prior notice. We may refer serious violations to law enforcement. {/* TODO: legal review */}
          </p>
        </section>

        <section id="appeals">
          <h2 className="text-2xl font-bold font-heading">6. Appeals Process</h2>
          <p>
            If your account is suspended, you may appeal within 14 days by contacting{" "}
            <a href="mailto:support@britestate.co.uk">support@britestate.co.uk</a>.
            We will review and respond within 10 business days. {/* TODO: legal review */}
          </p>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Acceptable Use Policy",
            dateModified: LAST_UPDATED,
            publisher: { "@type": "Organization", name: "Britestate Ltd" },
            url: `${BASE_URL}/legal/acceptable-use`,
          }),
        }}
      />
    </LegalPageShell>
  );
}
