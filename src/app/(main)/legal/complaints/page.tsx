import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

const LAST_UPDATED = "13 March 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "overview", label: "1. Overview" },
  { id: "step-1-support", label: "2. Step 1 — Contact Support" },
  { id: "step-2-escalation", label: "3. Step 2 — Formal Escalation" },
  { id: "step-3-external", label: "4. Step 3 — External Resolution" },
  { id: "registered-address", label: "5. Registered Address" },
];

export const metadata: Metadata = {
  title: "Complaints Procedure | Britestate",
  description: "How to raise a complaint with Britestate and escalation options.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/complaints` },
  openGraph: { title: "Complaints Procedure | Britestate", description: "Britestate complaints procedure." },
};

export default function ComplaintsPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-primary transition-colors">Legal</Link>
        <span>/</span>
        <span className="text-neutral-900">Complaints Procedure</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">Complaints Procedure</h1>
      <p className="mb-8 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="overview">
          <h2 className="text-2xl font-bold font-heading">1. Overview</h2>
          <p>
            We take complaints seriously and aim to resolve them promptly. This procedure sets out how to raise a
            complaint and what to do if you are not satisfied with our response. {/* TODO: legal review */}
          </p>
        </section>

        <section id="step-1-support">
          <h2 className="text-2xl font-bold font-heading">2. Step 1 — Contact Support</h2>
          <p>
            In the first instance, contact our support team at{" "}
            <a href="mailto:support@britestate.co.uk">support@britestate.co.uk</a> or via the in-app help centre.
            We aim to respond within 2 business days and resolve complaints within 10 business days. {/* TODO: legal review */}
          </p>
        </section>

        <section id="step-2-escalation">
          <h2 className="text-2xl font-bold font-heading">3. Step 2 — Formal Escalation</h2>
          <p>
            If you are unsatisfied with the initial response, you may escalate to our management team by emailing{" "}
            <a href="mailto:complaints@britestate.co.uk">complaints@britestate.co.uk</a> with the subject line
            &ldquo;Formal Complaint&rdquo;. We will acknowledge within 2 business days and provide a final response
            within 20 business days. {/* TODO: legal review */}
          </p>
        </section>

        <section id="step-3-external">
          <h2 className="text-2xl font-bold font-heading">4. Step 3 — External Resolution</h2>
          <p>If your complaint remains unresolved, you may contact these independent bodies:</p>
          <ul>
            <li>
              <strong>The Property Ombudsman (TPO)</strong> — for complaints about property listings and estate agency
              conduct:{" "}
              <a href="https://www.tpos.co.uk" target="_blank" rel="noopener noreferrer">tpos.co.uk</a>
            </li>
            <li>
              <strong>Information Commissioner&apos;s Office (ICO)</strong> — for data protection complaints:{" "}
              <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>
            </li>
            <li>
              <strong>Alternative Dispute Resolution (ADR)</strong> — for consumer disputes:{" "}
              <a href="mailto:complaints@britestate.co.uk">complaints@britestate.co.uk</a>
            </li>
          </ul>
          {/* TODO: legal review */}
        </section>

        <section id="registered-address">
          <h2 className="text-2xl font-bold font-heading">5. Registered Address</h2>
          <p>
            Britestate Ltd<br />
            {/* TODO: update with real address */}
            123 Placeholder Street<br />
            London EC1A 1BB<br />
            England
          </p>
        </section>
      </div>

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
