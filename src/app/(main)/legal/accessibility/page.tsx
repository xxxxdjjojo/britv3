import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

const LAST_UPDATED = "13 March 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "compliance-status", label: "1. Compliance Status" },
  { id: "known-limitations", label: "2. Known Limitations" },
  { id: "feedback-contact", label: "3. Feedback & Contact" },
  { id: "enforcement", label: "4. Enforcement" },
  { id: "technical-information", label: "5. Technical Information" },
  { id: "preparation", label: "6. Preparation of Statement" },
];

export const metadata: Metadata = {
  title: "Accessibility Statement",
  description: "Britestate's WCAG 2.1 AA compliance status and known accessibility limitations.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/accessibility` },
  openGraph: { title: "Accessibility Statement", description: "Britestate accessibility statement." },
};

export default function AccessibilityPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-primary transition-colors">Legal</Link>
        <span>/</span>
        <span className="text-neutral-900">Accessibility Statement</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">Accessibility Statement</h1>
      <p className="mb-8 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="compliance-status">
          <h2 className="text-2xl font-bold font-heading">1. Compliance Status</h2>
          <p>
            Britestate Ltd is committed to making its website accessible in accordance with the{" "}
            <a href="https://www.legislation.gov.uk/uksi/2018/952/contents" target="_blank" rel="noopener noreferrer">
              Public Sector Bodies (Websites and Mobile Applications) Accessibility Regulations 2018
            </a>
            . We aim to meet <strong>WCAG 2.1 Level AA</strong> compliance. {/* TODO: legal review */}
          </p>
        </section>

        <section id="known-limitations">
          <h2 className="text-2xl font-bold font-heading">2. Known Limitations</h2>
          <p>
            While we strive for full WCAG 2.1 AA compliance, some limitations exist. These include: some older PDF
            documents may not be fully accessible; interactive map components may have limited keyboard navigation.
            We are actively working to resolve these issues. {/* TODO: legal review */}
          </p>
        </section>

        <section id="feedback-contact">
          <h2 className="text-2xl font-bold font-heading">3. Feedback &amp; Contact</h2>
          <p>
            If you experience accessibility barriers, please contact us at{" "}
            <a href="mailto:accessibility@britestate.co.uk">accessibility@britestate.co.uk</a>.
            We aim to respond within 5 business days. {/* TODO: legal review */}
          </p>
        </section>

        <section id="enforcement">
          <h2 className="text-2xl font-bold font-heading">4. Enforcement</h2>
          <p>
            If you are not satisfied with our response, you may contact the Equality and Human Rights Commission
            (EHRC). The EHRC is responsible for enforcing the accessibility regulations in England, Scotland, and
            Wales. Contact them at{" "}
            <a href="https://www.equalityhumanrights.com" target="_blank" rel="noopener noreferrer">
              equalityhumanrights.com
            </a>
            . {/* TODO: legal review */}
          </p>
        </section>

        <section id="technical-information">
          <h2 className="text-2xl font-bold font-heading">5. Technical Information</h2>
          <p>
            Britestate is built using Next.js with semantic HTML5, ARIA attributes where appropriate, and keyboard
            navigation support. We use sufficient colour contrast ratios and responsive design for all screen sizes. {/* TODO: legal review */}
          </p>
        </section>

        <section id="preparation">
          <h2 className="text-2xl font-bold font-heading">6. Preparation of Statement</h2>
          <p>
            This statement was prepared on {LAST_UPDATED}. It was last reviewed on {LAST_UPDATED}.
            {/* TODO: legal review */}
          </p>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Accessibility Statement",
            dateModified: LAST_UPDATED,
            publisher: { "@type": "Organization", name: "Britestate Ltd" },
            url: `${BASE_URL}/legal/accessibility`,
          }),
        }}
      />
    </LegalPageShell>
  );
}
