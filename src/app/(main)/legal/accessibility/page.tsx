import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

const LAST_UPDATED = "24 March 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "our-commitment", label: "1. Our Commitment" },
  { id: "conformance-status", label: "2. Conformance Status" },
  { id: "known-issues", label: "3. Known Issues" },
  { id: "testing", label: "4. Testing" },
  { id: "feedback", label: "5. Feedback" },
  { id: "enforcement", label: "6. Enforcement" },
];

export const metadata: Metadata = {
  title: "Accessibility Statement | Britestate",
  description:
    "Britestate&rsquo;s WCAG 2.1 AA conformance status, known accessibility limitations, and how to report accessibility barriers.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/accessibility` },
  openGraph: {
    title: "Accessibility Statement | Britestate",
    description: "Britestate accessibility statement and WCAG 2.1 AA conformance status.",
  },
};

export default function AccessibilityPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 font-body text-sm text-neutral-500">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-foreground transition-colors">
          Legal
        </Link>
        <span>/</span>
        <span className="text-foreground">Accessibility Statement</span>
      </nav>

      <h1 className="mb-2 font-heading text-2xl font-bold text-foreground">
        Accessibility Statement
      </h1>
      <p className="mb-4 font-body text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      {/* Yellow info callout */}
      <div className="mb-8 rounded-xl bg-amber-50 dark:bg-amber-900/20 p-4 ring-1 ring-amber-200/60 dark:ring-amber-700/60 font-body text-sm text-amber-800 dark:text-amber-300">
        We are committed to making Britestate accessible to everyone. If you encounter any
        accessibility barrier, please contact us at{" "}
        <a
          href="mailto:accessibility@britestate.co.uk"
          className="underline hover:no-underline"
        >
          accessibility@britestate.co.uk
        </a>{" "}
        and we will do our best to help.
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <section id="our-commitment">
          <h2 className="font-heading text-lg font-semibold text-foreground">1. Our Commitment</h2>
          <p>
            Britestate Ltd is committed to making our platform accessible to everyone, including
            people with disabilities. We aim to conform to the Web Content Accessibility Guidelines
            (WCAG) 2.1 at Level AA.
          </p>
        </section>

        <section id="conformance-status">
          <h2 className="font-heading text-lg font-semibold text-foreground">2. Conformance Status</h2>
          <p>
            We believe our platform <strong>partially conforms</strong> to WCAG 2.1 Level AA.
            &ldquo;Partially conforms&rdquo; means that some parts of the content do not fully
            conform to the accessibility standard. We are actively working to address known issues.
          </p>
        </section>

        <section id="known-issues">
          <h2 className="font-heading text-lg font-semibold text-foreground">3. Known Issues</h2>
          <p>The following areas have known accessibility limitations:</p>
          <ul>
            <li>
              Some older property photos may lack alternative text descriptions. We are working with
              agents to ensure all new listings include alt text.
            </li>
            <li>
              Certain interactive map features (powered by MapLibre GL JS) may have limited keyboard
              accessibility. We provide an alternative list view for property search results.
            </li>
            <li>
              Some third-party embedded content (e.g., Stripe payment forms) may have accessibility
              limitations outside our direct control.
            </li>
          </ul>
        </section>

        <section id="testing">
          <h2 className="font-heading text-lg font-semibold text-foreground">4. Testing</h2>
          <p>
            We test accessibility using: automated scanning (axe-core); manual testing with screen
            readers (NVDA, VoiceOver); keyboard-only navigation testing; and colour contrast
            verification.
          </p>
        </section>

        <section id="feedback">
          <h2 className="font-heading text-lg font-semibold text-foreground">5. Feedback</h2>
          <p>
            If you encounter accessibility barriers on Britestate, please contact us:
          </p>
          <p>
            Email:{" "}
            <a href="mailto:accessibility@britestate.co.uk">accessibility@britestate.co.uk</a>
            <br />
            Phone: [PHONE NUMBER]
          </p>
          <p>
            We aim to respond within 5 working days and provide a resolution or workaround within
            15 working days.
          </p>
        </section>

        <section id="enforcement">
          <h2 className="font-heading text-lg font-semibold text-foreground">6. Enforcement</h2>
          <p>
            If you are not satisfied with our response, you may contact the Equality Advisory
            Support Service (EASS) at{" "}
            <a
              href="https://www.equalityadvisoryservice.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              equalityadvisoryservice.com
            </a>
            . The Equality and Human Rights Commission (EHRC) is responsible for enforcing the
            accessibility regulations in England, Scotland, and Wales.
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
