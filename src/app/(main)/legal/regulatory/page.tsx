import type { Metadata } from "next";
import Link from "next/link";
import { Landmark, ShieldCheck, Banknote, MessageSquare } from "lucide-react";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { LabeledGrid } from "@/components/legal/LabeledGrid";

const LAST_UPDATED = "16 June 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "company", label: "Company Identity" },
  { id: "bodies", label: "Regulatory Bodies & Redress" },
  { id: "aml", label: "AML Supervision" },
  { id: "complaints", label: "Complaints & Escalation" },
];

export const metadata: Metadata = {
  title: "Regulatory & Compliance Information | Britestate",
  description:
    "Britestate's company identity, the regulatory and redress bodies relevant to our service, our AML supervision, and how to escalate a complaint.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/regulatory` },
  openGraph: {
    title: "Regulatory & Compliance Information | Britestate",
    description: "Britestate's regulatory status, redress routes, and AML supervision.",
  },
};

export default function RegulatoryPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-primary transition-colors">Legal</Link>
        <span>/</span>
        <span className="text-neutral-900">Regulatory & Compliance Information</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">
        Regulatory &amp; Compliance Information
      </h1>
      <p className="mb-8 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="mb-8 rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
        This page is drafted for clarity and is pending final review by Britestate&rsquo;s legal
        team. The applicable regulators, redress-scheme memberships, and registration numbers must
        be confirmed before publication &mdash; do not assert membership of a scheme that has not
        been verified.
      </div>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="company" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <Landmark className="text-primary" size={22} /> Company Identity
          </h2>
          <p>
            Britestate is operated by <strong>Britestate Ltd</strong>, a company registered in
            England and Wales under company number <strong>[COMPANY NUMBER]</strong>, with its
            registered office at <strong>[REGISTERED ADDRESS]</strong>.
          </p>
        </section>

        <section id="bodies" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <ShieldCheck className="text-primary" size={22} /> Regulatory Bodies &amp; Redress
          </h2>
          <p>
            Britestate is a technology platform connecting consumers with property professionals.
            The bodies most relevant to our service and the professionals who use it include:
          </p>
          <LabeledGrid
            columns={2}
            cells={[
              { title: "Information Commissioner's Office (ICO)", description: "Data protection and privacy." },
              { title: "Trading Standards", description: "Consumer protection and fair trading." },
              { title: "Property redress scheme", description: "Independent redress for property complaints. [Confirm membership.]" },
              { title: "HMRC", description: "Anti-money-laundering supervision (see below)." },
            ]}
          />
          <p className="text-sm text-neutral-500">
            Note: estate-agency and financial-services activities are regulated differently. Where a
            professional you engage is independently regulated (for example, a RICS surveyor or an
            FCA-authorised mortgage broker), their own regulator and redress route apply.
          </p>
        </section>

        <section id="aml" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <Banknote className="text-primary" size={22} /> AML Supervision
          </h2>
          <p>
            We operate anti-money-laundering controls in line with the Money Laundering Regulations
            2017. Details of our obligations and customer due-diligence approach are set out in our{" "}
            <Link href="/legal/aml-policy" className="text-primary underline hover:no-underline">
              Anti-Money Laundering Policy
            </Link>
            . [Confirm HMRC AML registration status and number before publication.]
          </p>
        </section>

        <section id="complaints" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <MessageSquare className="text-primary" size={22} /> Complaints &amp; Escalation
          </h2>
          <p>
            If something has gone wrong, please tell us first via our{" "}
            <Link href="/legal/complaints" className="text-primary underline hover:no-underline">
              Complaints Procedure
            </Link>
            . If we cannot resolve your complaint, you may be able to escalate to the relevant
            redress scheme or regulator listed above.
          </p>
        </section>
      </div>
    </LegalPageShell>
  );
}
