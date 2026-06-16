import type { Metadata } from "next";
import Link from "next/link";
import { Award, HeartHandshake, ShieldCheck, BadgeCheck } from "lucide-react";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { NumberedSteps } from "@/components/legal/NumberedSteps";

const LAST_UPDATED = "16 June 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "code-of-conduct", label: "Core Code of Conduct" },
  { id: "ethics", label: "Ethics & Integrity" },
  { id: "technical", label: "Technical Standards" },
  { id: "verification", label: "Verification & Enforcement" },
];

export const metadata: Metadata = {
  title: "Professional Standards | Britestate",
  description:
    "The standards of conduct, ethics, and service quality Britestate expects from the estate agents, landlords, and service providers operating on the platform.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/professional-standards` },
  openGraph: {
    title: "Professional Standards | Britestate",
    description: "The conduct and quality standards we expect on Britestate.",
  },
};

export default function ProfessionalStandardsPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-primary transition-colors">Legal</Link>
        <span>/</span>
        <span className="text-neutral-900">Professional Standards</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">Professional Standards</h1>
      <p className="mb-8 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="mb-8 rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
        These standards are drafted for clarity and are pending final review by Britestate&rsquo;s
        legal team before publication.
      </div>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="code-of-conduct" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <Award className="text-primary" size={22} /> Core Code of Conduct
          </h2>
          <p>
            Everyone who offers a service on Britestate is expected to act honestly, fairly, and
            professionally. In particular, professionals must:
          </p>
          <ul>
            <li>Provide accurate, non-misleading listings and information.</li>
            <li>Communicate promptly and respectfully with users.</li>
            <li>Honour quoted fees and the terms they advertise.</li>
            <li>Comply with all applicable UK law and their own professional bodies.</li>
          </ul>
        </section>

        <section id="ethics" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <HeartHandshake className="text-primary" size={22} /> Ethics &amp; Integrity
          </h2>
          <p>
            We expect transparency about conflicts of interest, fair treatment of every user
            regardless of background (see our{" "}
            <Link href="/legal/fair-housing" className="text-primary underline hover:no-underline">
              Fair Housing Policy
            </Link>
            ), and zero tolerance for fraud, discrimination, or harassment.
          </p>
        </section>

        <section id="technical" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <ShieldCheck className="text-primary" size={22} /> Technical Standards
          </h2>
          <p>Listings and profiles on Britestate should meet basic quality standards:</p>
          <ul>
            <li>Genuine, current photography and accurate property details.</li>
            <li>Correct pricing, tenure, and availability.</li>
            <li>Secure handling of any personal data shared through the platform.</li>
          </ul>
        </section>

        <section id="verification" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <BadgeCheck className="text-primary" size={22} /> Verification &amp; Enforcement
          </h2>
          <NumberedSteps
            steps={[
              {
                title: "Onboarding checks",
                body: "We verify professional accounts before they can transact on the platform.",
              },
              {
                title: "Ongoing monitoring",
                body: "We review reports and platform signals to identify conduct that breaches these standards.",
              },
              {
                title: "Action & escalation",
                body: (
                  <>
                    We may warn, suspend, or remove accounts that breach these standards. To report a
                    concern, use our{" "}
                    <Link href="/legal/complaints" className="text-primary underline hover:no-underline">
                      Complaints Procedure
                    </Link>
                    .
                  </>
                ),
              },
            ]}
          />
        </section>
      </div>
    </LegalPageShell>
  );
}
