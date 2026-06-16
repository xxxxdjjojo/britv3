import type { Metadata } from "next";
import Link from "next/link";
import { Network, ShieldCheck, Layers, Link2 } from "lucide-react";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { LabeledGrid } from "@/components/legal/LabeledGrid";

const LAST_UPDATED = "16 June 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "processors", label: "Authorised Processors" },
  { id: "vetting", label: "How We Vet Partners" },
  { id: "related", label: "Related Policies" },
];

export const metadata: Metadata = {
  title: "Third-Party Services Disclosure | Britestate",
  description:
    "The third-party service providers and data processors Britestate relies on to run the platform, what each is used for, and how we vet them.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/third-party-services` },
  openGraph: {
    title: "Third-Party Services Disclosure | Britestate",
    description: "The processors that power Britestate and how we vet them.",
  },
};

export default function ThirdPartyServicesPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-primary transition-colors">Legal</Link>
        <span>/</span>
        <span className="text-neutral-900">Third-Party Services Disclosure</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">
        Third-Party Services Disclosure
      </h1>
      <p className="mb-8 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="mb-8 rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
        This disclosure is drafted for clarity and is pending final review by Britestate&rsquo;s
        legal team. The processor list should be reconciled against the current vendor register
        before publication.
      </div>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="overview" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <Network className="text-primary" size={22} /> Overview
          </h2>
          <p>
            To run Britestate we use a number of trusted third-party providers (&ldquo;data
            processors&rdquo;). They process data only on our instructions and under contract. This
            page summarises who they are and what they do; how we handle your personal data is set
            out in full in our{" "}
            <Link href="/legal/privacy" className="text-primary underline hover:no-underline">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <section id="processors" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <Layers className="text-primary" size={22} /> Authorised Processors
          </h2>
          <LabeledGrid
            columns={2}
            cells={[
              { title: "Supabase", description: "Database, authentication, and file storage." },
              { title: "Stripe", description: "Payments and subscription billing." },
              { title: "Resend", description: "Transactional and notification email delivery." },
              { title: "Sentry", description: "Error monitoring and diagnostics." },
              { title: "PostHog", description: "Product analytics and feature flags." },
              { title: "Upstash Redis", description: "Rate limiting and caching." },
              { title: "MapTiler", description: "Maps and location data rendering." },
              { title: "Anthropic", description: "AI features (e.g. property insights)." },
            ]}
          />
        </section>

        <section id="vetting" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <ShieldCheck className="text-primary" size={22} /> How We Vet Partners
          </h2>
          <p>Before onboarding a processor and on an ongoing basis, we assess:</p>
          <ul>
            <li>Security posture and recognised certifications.</li>
            <li>UK GDPR compliance and a written data-processing agreement.</li>
            <li>Data residency and any international transfer safeguards.</li>
            <li>Sub-processor transparency and breach-notification commitments.</li>
          </ul>
        </section>

        <section id="related" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <Link2 className="text-primary" size={22} /> Related Policies
          </h2>
          <ul>
            <li><Link href="/legal/privacy" className="text-primary underline hover:no-underline">Privacy Policy</Link></li>
            <li><Link href="/legal/cookies" className="text-primary underline hover:no-underline">Cookie Policy</Link></li>
            <li><Link href="/legal/data-processing" className="text-primary underline hover:no-underline">Data Processing Agreement</Link></li>
          </ul>
        </section>
      </div>
    </LegalPageShell>
  );
}
