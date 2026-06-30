import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { brandConfig, appBaseUrl } from "@/config/brand";

const LAST_UPDATED = "24 March 2026";
const BASE_URL = appBaseUrl();

const SECTIONS = [
  { id: "how-we-use-ai", label: "1. How We Use AI" },
  { id: "ai-powered-features", label: "2. AI-Powered Features" },
  { id: "your-data-and-ai", label: "3. Your Data and AI" },
  { id: "limitations", label: "4. Limitations" },
  { id: "your-rights", label: "5. Your Rights" },
];

export const metadata: Metadata = {
  title: `AI Transparency Notice | ${brandConfig.displayName}`,
  description: `How ${brandConfig.displayName} uses artificial intelligence and automated decision-making, and your rights under UK GDPR.`,
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/ai-transparency` },
  openGraph: {
    title: `AI Transparency Notice | ${brandConfig.displayName}`,
    description: "How we use artificial intelligence and automated decision-making.",
  },
};

export default function AiTransparencyPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-primary transition-colors">Legal</Link>
        <span>/</span>
        <span className="text-neutral-900">AI Transparency Notice</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">AI Transparency Notice</h1>
      <p className="mb-4 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      {/* Yellow info callout */}
      <div className="mb-8 bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-lg p-4 text-sm">
        {brandConfig.displayName} uses artificial intelligence to enhance your property search experience. We believe
        in being transparent about when and how AI is used.
      </div>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="how-we-use-ai">
          <h2 className="text-2xl font-bold font-heading">1. How We Use AI</h2>
          <p>
            {brandConfig.displayName} uses artificial intelligence to enhance your property search experience. We
            believe in being transparent about when and how AI is used.
          </p>
        </section>

        <section id="ai-powered-features">
          <h2 className="text-2xl font-bold font-heading">2. AI-Powered Features</h2>
          <p>
            <strong>Property Recommendations:</strong> Our recommendation engine uses your search
            history, saved properties, and stated preferences to suggest properties you might be
            interested in. This is powered by vector embeddings (pgvector) and Anthropic Claude.
          </p>
          <p>
            <strong>Valuation Estimates (not AI-based):</strong> Our indicative property value
            estimates are calculated by a statistical comparable-sales model from recent Land
            Registry sold prices and property attributes — not by AI. These are not formal valuations
            and should not be relied upon for purchasing or lending decisions.
          </p>
          <p>
            <strong>Search Matching:</strong> Our search algorithm uses AI to understand
            natural-language search queries and match them to relevant listings.
          </p>
          <p>
            <strong>Content Generation:</strong> Some property descriptions and summaries may be
            generated or enhanced by AI. These are reviewed by the listing agent or owner before
            publication and are clearly labelled.
          </p>
        </section>

        <section id="your-data-and-ai">
          <h2 className="text-2xl font-bold font-heading">3. Your Data and AI</h2>
          <p>
            3.1. Your search and browsing data is used to personalise recommendations. You can opt out
            of personalised recommendations in your{" "}
            <Link href="/settings/privacy" className="text-primary underline">
              privacy settings
            </Link>{" "}
            at any time.
          </p>
          <p>
            3.2. We do not use your personal data to train AI models. Data sent to Anthropic for
            recommendation processing is not retained by Anthropic for model training.
          </p>
          <p>
            3.3. No solely automated decisions with legal or similarly significant effects are made
            about you. Where AI outputs influence decisions (e.g., personalised property
            recommendations), human oversight is maintained.
          </p>
        </section>

        <section id="limitations">
          <h2 className="text-2xl font-bold font-heading">4. Limitations</h2>
          <p>
            AI-generated outputs may contain inaccuracies. They are intended as helpful tools, not
            definitive answers. Always verify important information independently and seek professional
            advice for significant decisions.
          </p>
        </section>

        <section id="your-rights">
          <h2 className="text-2xl font-bold font-heading">5. Your Rights</h2>
          <p>
            You have the right to: opt out of AI-powered personalisation; request human review of
            AI-generated outputs that affect you; receive meaningful information about how our AI
            systems work; and object to profiling under Article 21 of UK GDPR.
          </p>
          <p>
            Contact <a href={`mailto:${brandConfig.emails.privacy}`}>{brandConfig.emails.privacy}</a> to
            exercise these rights, or see our{" "}
            <Link href="/legal/gdpr-rights" className="text-primary underline">
              GDPR Data Subject Rights
            </Link>{" "}
            page for the full process. Our{" "}
            <Link href="/legal/privacy" className="text-primary underline">
              Privacy Policy
            </Link>{" "}
            contains further information on how we process personal data.
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
            name: "AI Transparency Notice",
            dateModified: LAST_UPDATED,
            publisher: { "@type": "Organization", name: `${brandConfig.displayName} Ltd` },
            url: `${BASE_URL}/legal/ai-transparency`,
          }),
        }}
      />
    </LegalPageShell>
  );
}
