import type { Metadata } from "next";
import Link from "next/link";
import { ReceiptText, Clock, Ban, BadgePoundSterling } from "lucide-react";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { NumberedSteps } from "@/components/legal/NumberedSteps";

const LAST_UPDATED = "16 June 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "scope", label: "Scope & Eligibility" },
  { id: "cooling-off", label: "Cooling-Off Rights" },
  { id: "non-refundable", label: "Non-Refundable Items" },
  { id: "how-to-request", label: "How to Request a Refund" },
  { id: "timescales", label: "Timescales" },
];

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | Britestate",
  description:
    "How refunds and cancellations work for Britestate subscriptions and platform fees, including your statutory cooling-off rights and how to request a refund.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/refunds` },
  openGraph: {
    title: "Refund & Cancellation Policy | Britestate",
    description: "Refunds, cancellations, and your cooling-off rights on Britestate.",
  },
};

export default function RefundsPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/legal" className="hover:text-primary transition-colors">Legal</Link>
        <span>/</span>
        <span className="text-neutral-900">Refund & Cancellation Policy</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold font-heading text-neutral-900">
        Refund &amp; Cancellation Policy
      </h1>
      <p className="mb-8 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

      <div className="mb-8 rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
        This policy is drafted for clarity and is pending final review by Britestate&rsquo;s legal
        team. Statutory cooling-off periods and fee-specific terms should be confirmed before
        publication.
      </div>

      <div className="prose prose-neutral max-w-none text-[16px] md:text-[17px] leading-[1.7]">
        <section id="scope" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <ReceiptText className="text-primary" size={22} /> Scope &amp; Eligibility
          </h2>
          <p>
            This policy covers paid Britestate products: subscription plans and platform/listing
            fees. Charges levied by third parties you engage through the marketplace (for example,
            conveyancers or surveyors) are governed by that provider&rsquo;s own terms. Our platform
            fees are described in our{" "}
            <Link href="/legal/fee-transparency" className="text-primary underline hover:no-underline">
              Fee Transparency
            </Link>{" "}
            page.
          </p>
        </section>

        <section id="cooling-off" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <BadgePoundSterling className="text-primary" size={22} /> Cooling-Off Rights
          </h2>
          <p>
            Where you are a consumer, you may have a statutory right to cancel a new subscription
            within <strong>14 days</strong> of purchase under the Consumer Contracts Regulations
            2013. Where you ask us to begin a service within that period, we may retain a
            proportionate amount for the service already provided. [Confirm exact cooling-off
            treatment with legal before publication.]
          </p>
        </section>

        <section id="non-refundable" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <Ban className="text-primary" size={22} /> Non-Refundable Items
          </h2>
          <p>The following are generally non-refundable once delivered or consumed:</p>
          <ul>
            <li>Completed one-off services (for example, a published premium listing that has run).</li>
            <li>Pay-as-you-go credits that have already been used.</li>
            <li>The portion of a subscription period already elapsed at the point of cancellation.</li>
          </ul>
        </section>

        <section id="how-to-request" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <ReceiptText className="text-primary" size={22} /> How to Request a Refund
          </h2>
          <NumberedSteps
            steps={[
              {
                title: "Contact billing support",
                body: (
                  <>
                    Email{" "}
                    <a href="mailto:support@britestate.co.uk" className="text-primary underline hover:no-underline">
                      support@britestate.co.uk
                    </a>{" "}
                    from the address on your account, with your invoice or order reference.
                  </>
                ),
              },
              {
                title: "Tell us what and why",
                body: "Describe the charge and the reason for the refund so we can review it quickly.",
              },
              {
                title: "We review and respond",
                body: "We confirm eligibility and, where approved, process the refund to your original payment method via Stripe.",
              },
            ]}
          />
        </section>

        <section id="timescales" className="scroll-mt-24">
          <h2 className="flex items-center gap-3 text-2xl font-bold font-heading">
            <Clock className="text-primary" size={22} /> Timescales
          </h2>
          <p>
            We aim to acknowledge refund requests within 5 working days and to process approved
            refunds within 14 days. Once processed, your bank or card issuer may take a few
            additional days to show the funds. If you are unhappy with a refund decision, you can
            escalate through our{" "}
            <Link href="/legal/complaints" className="text-primary underline hover:no-underline">
              Complaints Procedure
            </Link>
            .
          </p>
        </section>
      </div>
    </LegalPageShell>
  );
}
