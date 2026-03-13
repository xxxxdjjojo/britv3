import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

const LAST_UPDATED = "13 March 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "introduction", label: "1. Introduction" },
  { id: "data-we-collect", label: "2. Data We Collect" },
  { id: "legal-basis", label: "3. Legal Basis for Processing" },
  { id: "how-we-use", label: "4. How We Use Your Data" },
  { id: "data-sharing", label: "5. Data Sharing" },
  { id: "data-retention", label: "6. Data Retention" },
  { id: "international-transfers", label: "7. International Transfers" },
  { id: "your-rights", label: "8. Your Rights" },
  { id: "cookies", label: "9. Cookies" },
  { id: "dpo-contact", label: "10. DPO Contact" },
  { id: "changes", label: "11. Changes" },
];

export const metadata: Metadata = {
  title: "Privacy Policy | Britestate",
  description: "How Britestate collects, uses, and protects your personal data under UK GDPR.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/privacy` },
  openGraph: { title: "Privacy Policy | Britestate", description: "Britestate Privacy Policy." },
};

export default function PrivacyPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-primary transition-colors">Legal</Link>
        <span>/</span>
        <span className="text-neutral-900">Privacy Policy</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">Privacy Policy</h1>
      <p className="mb-4 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="mb-8 bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-lg p-4 text-sm">
        {/* TODO: legal review */}
        This policy explains how Britestate Ltd processes your personal data in compliance with
        UK GDPR and the Data Protection Act 2018.
      </div>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="introduction">
          <h2 className="text-2xl font-bold font-heading">1. Introduction</h2>
          <p>
            Britestate Ltd (&ldquo;we&rdquo;) is the data controller. ICO registration: [pending].
            Contact: <a href="mailto:privacy@britestate.co.uk">privacy@britestate.co.uk</a>.
            {/* TODO: legal review */}
          </p>
        </section>

        <section id="data-we-collect">
          <h2 className="text-2xl font-bold font-heading">2. Data We Collect</h2>
          <p>We collect: account information (name, email, phone), property search history, listing data, payment data (via Stripe — we do not store card numbers), device and usage data, and communications. {/* TODO: legal review */}</p>
        </section>

        <section id="legal-basis">
          <h2 className="text-2xl font-bold font-heading">3. Legal Basis for Processing</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-neutral-50">
                <th className="border border-neutral-200 p-3 text-left font-semibold">Purpose</th>
                <th className="border border-neutral-200 p-3 text-left font-semibold">Lawful Basis (UK GDPR Art. 6)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Account creation and management", "Contract (Art. 6(1)(b))"],
                ["Property search and listings", "Contract (Art. 6(1)(b))"],
                ["Marketing emails (opted in)", "Consent (Art. 6(1)(a))"],
                ["Analytics and platform improvement", "Legitimate interests (Art. 6(1)(f))"],
                ["Legal compliance (AML, GDPR)", "Legal obligation (Art. 6(1)(c))"],
              ].map(([purpose, basis]) => (
                <tr key={purpose}>
                  <td className="border border-neutral-200 p-3">{purpose}</td>
                  <td className="border border-neutral-200 p-3">{basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* TODO: legal review — expand table */}
        </section>

        <section id="how-we-use">
          <h2 className="text-2xl font-bold font-heading">4. How We Use Your Data</h2>
          <p>We use your data to operate the platform, send transactional emails, personalise search results, and improve our services. {/* TODO: legal review */}</p>
        </section>

        <section id="data-sharing">
          <h2 className="text-2xl font-bold font-heading">5. Data Sharing</h2>
          <p>We share data with: Supabase (database hosting), Stripe (payments), Resend (email), PostHog (analytics), Sentry (error tracking). We do not sell your data. {/* TODO: legal review */}</p>
        </section>

        <section id="data-retention">
          <h2 className="text-2xl font-bold font-heading">6. Data Retention</h2>
          <p>Account data: retained while account is active, then 30 days for deletion grace period. Financial records: 7 years (legal requirement). {/* TODO: legal review */}</p>
        </section>

        <section id="international-transfers">
          <h2 className="text-2xl font-bold font-heading">7. International Transfers</h2>
          <p>Some processors operate outside the UK. Transfers are protected by UK adequacy decisions or Standard Contractual Clauses. {/* TODO: legal review */}</p>
        </section>

        <section id="your-rights">
          <h2 className="text-2xl font-bold font-heading">8. Your Rights</h2>
          <p>You have rights of access, erasure, portability, rectification, restriction, and objection. Exercise them via our <Link href="/legal/gdpr-rights" className="text-primary hover:underline">GDPR Rights page</Link>. {/* TODO: legal review */}</p>
        </section>

        <section id="cookies">
          <h2 className="text-2xl font-bold font-heading">9. Cookies</h2>
          <p>See our <Link href="/legal/cookies" className="text-primary hover:underline">Cookie Policy</Link> for full details. {/* TODO: legal review */}</p>
        </section>

        <section id="dpo-contact">
          <h2 className="text-2xl font-bold font-heading">10. DPO Contact</h2>
          <p>Data Protection Officer: <a href="mailto:privacy@britestate.co.uk">privacy@britestate.co.uk</a>. {/* TODO: legal review */}</p>
        </section>

        <section id="changes">
          <h2 className="text-2xl font-bold font-heading">11. Changes</h2>
          <p>We will notify you of material changes via email. {/* TODO: legal review */}</p>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Privacy Policy",
            dateModified: LAST_UPDATED,
            publisher: { "@type": "Organization", name: "Britestate Ltd" },
            url: `${BASE_URL}/legal/privacy`,
          }),
        }}
      />
    </LegalPageShell>
  );
}
