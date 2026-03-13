import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

const LAST_UPDATED = "13 March 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "organisation", label: "1. Organisation & Supply Chains" },
  { id: "policies", label: "2. Policies in Relation to Slavery" },
  { id: "due-diligence", label: "3. Due Diligence Processes" },
  { id: "risk-assessment", label: "4. Risk Assessment" },
  { id: "kpis", label: "5. KPIs & Effectiveness" },
  { id: "training", label: "6. Training" },
  { id: "board-approval", label: "7. Board Approval" },
];

export const metadata: Metadata = {
  title: "Modern Slavery Statement | Britestate",
  description: "Britestate's commitment under the Modern Slavery Act 2015.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/modern-slavery` },
  openGraph: { title: "Modern Slavery Statement | Britestate", description: "Britestate Modern Slavery Statement." },
};

export default function ModernSlaveryPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-primary transition-colors">Legal</Link>
        <span>/</span>
        <span className="text-neutral-900">Modern Slavery Statement</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">Modern Slavery Statement</h1>
      <p className="mb-8 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="organisation">
          <h2 className="text-2xl font-bold font-heading">1. Organisation &amp; Supply Chains</h2>
          <p>
            Britestate Ltd is a UK-based property technology company providing an online property portal. Our supply
            chain consists primarily of software vendors, cloud service providers, and professional services firms.
            This statement is published in accordance with the Modern Slavery Act 2015. {/* TODO: legal review */}
          </p>
        </section>

        <section id="policies">
          <h2 className="text-2xl font-bold font-heading">2. Policies in Relation to Slavery</h2>
          <p>
            We have a zero-tolerance approach to modern slavery and human trafficking. Our recruitment process
            verifies the right to work and does not use labour providers without adequate vetting. {/* TODO: legal review */}
          </p>
        </section>

        <section id="due-diligence">
          <h2 className="text-2xl font-bold font-heading">3. Due Diligence Processes</h2>
          <p>
            We conduct due diligence on key suppliers and service providers, including reviewing their own modern
            slavery policies where applicable. Contracts include requirements to comply with applicable anti-slavery
            laws. {/* TODO: legal review */}
          </p>
        </section>

        <section id="risk-assessment">
          <h2 className="text-2xl font-bold font-heading">4. Risk Assessment</h2>
          <p>
            We assess our supply chain as low risk for modern slavery given the nature of our business (digital
            services). The highest-risk areas we have identified are: hardware manufacturing in our device supply
            chain and outsourced professional services. {/* TODO: legal review */}
          </p>
        </section>

        <section id="kpis">
          <h2 className="text-2xl font-bold font-heading">5. KPIs &amp; Effectiveness</h2>
          <p>
            We measure effectiveness through: annual supplier reviews, staff training completion rates, and the
            absence of reported incidents. No incidents of modern slavery were identified in the reporting period. {/* TODO: legal review */}
          </p>
        </section>

        <section id="training">
          <h2 className="text-2xl font-bold font-heading">6. Training</h2>
          <p>
            Relevant staff receive training on modern slavery awareness and how to identify and report concerns.
            Training is provided on induction and refreshed annually. {/* TODO: legal review */}
          </p>
        </section>

        <section id="board-approval">
          <h2 className="text-2xl font-bold font-heading">7. Board Approval</h2>
          <p>
            This statement has been approved by the Board of Directors of Britestate Ltd and will be reviewed
            annually. {/* TODO: legal review */}
          </p>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Modern Slavery Statement",
            dateModified: LAST_UPDATED,
            publisher: { "@type": "Organization", name: "Britestate Ltd" },
            url: `${BASE_URL}/legal/modern-slavery`,
          }),
        }}
      />
    </LegalPageShell>
  );
}
