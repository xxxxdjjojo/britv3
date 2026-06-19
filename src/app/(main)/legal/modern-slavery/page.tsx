import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { brandConfig, appBaseUrl } from "@/config/brand";

const LAST_UPDATED = "24 March 2026";
const BASE_URL = appBaseUrl();

const SECTIONS = [
  { id: "introduction", label: "1. Introduction" },
  { id: "our-business", label: "2. Our Business" },
  { id: "supply-chains", label: "3. Our Supply Chains" },
  { id: "policies", label: "4. Policies" },
  { id: "due-diligence", label: "5. Due Diligence" },
  { id: "training", label: "6. Training" },
  { id: "kpis", label: "7. Key Performance Indicators" },
  { id: "approval", label: "8. Approval" },
];

export const metadata: Metadata = {
  title: `Modern Slavery Statement | ${brandConfig.displayName}`,
  description:
    `${brandConfig.displayName}&rsquo;s statement on preventing modern slavery and human trafficking, made pursuant to Section 54 of the Modern Slavery Act 2015.`,
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/modern-slavery` },
  openGraph: {
    title: `Modern Slavery Statement | ${brandConfig.displayName}`,
    description: `${brandConfig.displayName} Modern Slavery Statement under the Modern Slavery Act 2015.`,
  },
};

export default function ModernSlaveryPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-primary transition-colors">
          Legal
        </Link>
        <span>/</span>
        <span className="text-neutral-900">Modern Slavery Statement</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">
        Modern Slavery Statement
      </h1>
      <p className="mb-4 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      {/* Yellow info callout */}
      <div className="mb-8 bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-lg p-4 text-sm">
        This statement is made pursuant to Section 54 of the Modern Slavery Act 2015 and sets out
        the steps {brandConfig.displayName} Ltd has taken to ensure modern slavery and human trafficking are not
        taking place in our business or supply chains. Financial year ending: [DATE].
      </div>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="introduction">
          <h2 className="text-2xl font-bold font-heading">1. Introduction</h2>
          <p>
            {brandConfig.displayName} Ltd is committed to preventing modern slavery and human trafficking in our
            business and supply chains. We have a zero-tolerance approach to any form of modern
            slavery.
          </p>
        </section>

        <section id="our-business">
          <h2 className="text-2xl font-bold font-heading">2. Our Business</h2>
          <p>
            {brandConfig.displayName} is a property technology platform connecting homebuyers, renters, sellers,
            landlords, estate agents, and service providers across the United Kingdom. We are a
            digital business with [NUMBER] employees, headquartered in England.
          </p>
        </section>

        <section id="supply-chains">
          <h2 className="text-2xl font-bold font-heading">3. Our Supply Chains</h2>
          <p>
            Our supply chains principally consist of: cloud infrastructure providers (Supabase,
            Vercel, AWS); payment processors (Stripe); software services (PostHog, Sentry, Resend,
            MapTiler, Anthropic); and professional services (legal, accounting, marketing). We do
            not manufacture physical goods and do not have complex manufacturing supply chains.
          </p>
        </section>

        <section id="policies">
          <h2 className="text-2xl font-bold font-heading">4. Policies</h2>
          <p>
            We maintain policies that contribute to ensuring there is no modern slavery in our
            business or supply chains, including: this Modern Slavery Statement; our Employee Code
            of Conduct; our Supplier Code of Conduct; and our Whistleblowing Policy.
          </p>
        </section>

        <section id="due-diligence">
          <h2 className="text-2xl font-bold font-heading">5. Due Diligence</h2>
          <p>
            5.1. We assess the risk of modern slavery in our supply chains by: evaluating the
            nature and location of each supplier; reviewing supplier modern slavery statements where
            available; requiring key suppliers to confirm compliance with the Modern Slavery Act
            2015; and monitoring for red flags.
          </p>
          <p>
            5.2. In the property context, we are mindful that modern slavery can be linked to
            property through forced labour in construction, maintenance, or cleaning services.
            Service providers on our platform are required to confirm compliance with the Modern
            Slavery Act as a condition of registration.
          </p>
        </section>

        <section id="training">
          <h2 className="text-2xl font-bold font-heading">6. Training</h2>
          <p>
            Relevant staff receive training on modern slavery awareness, including how to identify
            and report concerns. Training is provided on induction and refreshed annually.
          </p>
        </section>

        <section id="kpis">
          <h2 className="text-2xl font-bold font-heading">7. Key Performance Indicators</h2>
          <p>
            We measure effectiveness through: percentage of key suppliers assessed for modern
            slavery risk; number of staff trained; number of concerns reported and investigated;
            and supplier compliance confirmation rate.
          </p>
        </section>

        <section id="approval">
          <h2 className="text-2xl font-bold font-heading">8. Approval</h2>
          <p>
            This statement has been approved by the Board of Directors of {brandConfig.displayName} Ltd and is
            signed by [NAME], [TITLE]. It will be reviewed annually.
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
            name: "Modern Slavery Statement",
            dateModified: LAST_UPDATED,
            publisher: { "@type": "Organization", name: `${brandConfig.displayName} Ltd` },
            url: `${BASE_URL}/legal/modern-slavery`,
          }),
        }}
      />
    </LegalPageShell>
  );
}
