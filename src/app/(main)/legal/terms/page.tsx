import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

const LAST_UPDATED = "24 March 2026";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk";

const SECTIONS = [
  { id: "about-these-terms", label: "1. About These Terms" },
  { id: "the-platform", label: "2. The Platform" },
  { id: "user-accounts", label: "3. User Accounts" },
  { id: "user-roles", label: "4. User Roles and Specific Terms" },
  { id: "fees-and-payments", label: "5. Fees and Payments" },
  { id: "content-and-ip", label: "6. Content and Intellectual Property" },
  { id: "prohibited-uses", label: "7. Prohibited Uses" },
  { id: "disclaimers", label: "8. Disclaimers" },
  { id: "liability", label: "9. Limitation of Liability" },
  { id: "indemnification", label: "10. Indemnification" },
  { id: "suspension-termination", label: "11. Suspension and Termination" },
  { id: "dispute-resolution", label: "12. Dispute Resolution" },
  { id: "force-majeure", label: "13. Force Majeure" },
  { id: "ai-features", label: "14. AI Features and Automated Decision-Making" },
  { id: "governing-law", label: "15. Governing Law and Jurisdiction" },
  { id: "changes", label: "16. Changes to These Terms" },
  { id: "general", label: "17. General" },
  { id: "contact", label: "18. Contact Us" },
];

export const metadata: Metadata = {
  title: "Terms of Service | Britestate",
  description:
    "The terms and conditions governing your access to and use of the Britestate property platform, operated by Britestate Ltd under English law.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/legal/terms` },
  openGraph: {
    title: "Terms of Service | Britestate",
    description: "Terms and conditions for Britestate.",
  },
};

export default function TermsPage() {
  return (
    <LegalPageShell toc={SECTIONS}>
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 font-body text-xs text-neutral-500">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/legal" className="hover:text-foreground transition-colors">
          Legal
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-foreground">Terms of Service</span>
      </nav>

      {/* Page Hero */}
      <div className="mb-12">
        <span className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-brand-secondary-dark mb-4 block">
          Legal Documentation
        </span>
        <h1 className="font-heading text-4xl md:text-6xl font-extrabold tracking-tight text-brand-primary-dark mb-6 leading-tight">
          Terms of Service
        </h1>
        <p className="font-body text-xl text-neutral-500 leading-relaxed font-light italic mb-4">
          The governance of our relationship, framed with transparency and precision.
        </p>
        <div className="flex flex-col md:flex-row md:items-center gap-4 text-neutral-500 text-sm">
          <p className="flex items-center gap-2">
            <span aria-hidden="true">📅</span>
            Last updated: {LAST_UPDATED}
          </p>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-low hover:bg-surface-container-high transition-all rounded-lg font-body text-sm font-medium text-brand-primary-dark">
              Print
            </button>
            <Link
              href="/legal/terms.pdf"
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary-dark text-white hover:opacity-90 transition-all rounded-lg font-body text-sm font-medium"
            >
              Download PDF
            </Link>
          </div>
        </div>
      </div>

      {/* Info callout */}
      <div className="mb-10 rounded-xl bg-brand-primary-lighter border border-brand-primary/10 p-5 font-body text-sm text-brand-primary">
        Please read these Terms carefully before using Britestate. By accessing or using our
        platform, you agree to be bound by these Terms and our other{" "}
        <Link href="/legal" className="font-medium underline hover:no-underline">
          Legal Documents
        </Link>
        . If you do not agree, you must not use the Platform.
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <section id="about-these-terms">
          <h2 className="font-heading text-2xl font-bold text-brand-primary-dark tracking-tight">1. About These Terms</h2>
          <p>
            1.1. These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the
            Britestate platform at britestate.co.uk and any associated mobile applications
            (together, the &ldquo;Platform&rdquo;), operated by Britestate Ltd
            (&ldquo;Britestate&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;), a
            company registered in England and Wales under company number [COMPANY NUMBER], with its
            registered office at [REGISTERED ADDRESS].
          </p>
          <p>
            1.2. By accessing or using the Platform, you agree to be bound by these Terms, our{" "}
            <Link href="/legal/privacy" className="text-brand-primary hover:underline">
              Privacy Policy
            </Link>
            ,{" "}
            <Link href="/legal/cookies" className="text-brand-primary hover:underline">
              Cookie Policy
            </Link>
            , and{" "}
            <Link href="/legal/acceptable-use" className="text-brand-primary hover:underline">
              Acceptable Use Policy
            </Link>{" "}
            (together, the &ldquo;Legal Documents&rdquo;). If you do not agree, you must not use
            the Platform.
          </p>
          <p>
            1.3. If you are using the Platform on behalf of a business or other entity, you
            represent that you have the authority to bind that entity to these Terms.
          </p>
          <p>
            1.4. We are regulated by HMRC for the purposes of the Money Laundering Regulations
            2017. Our HMRC supervision reference is [REFERENCE].
          </p>
        </section>

        <section id="the-platform">
          <h2 className="font-heading text-2xl font-bold text-brand-primary-dark tracking-tight">2. The Platform</h2>
          <p>
            2.1. Britestate is a property technology platform that connects homebuyers, renters,
            sellers, landlords, estate agents, and service providers (each a &ldquo;User&rdquo; or
            &ldquo;you&rdquo;). We act as an intermediary — we do not buy, sell, let, or manage
            property directly.
          </p>
          <p>
            2.2. We are not an estate agent as defined by the Estate Agents Act 1979. We do not
            introduce parties to property transactions for a fee. Where individual estate agents use
            the Platform, they are responsible for their own regulatory compliance.
          </p>
          <p>
            2.3. We provide certain AI-powered features including property recommendations,
            valuation estimates, and search matching. These are informational tools and do not
            constitute professional advice. See Section 14 for further detail.
          </p>
        </section>

        <section id="user-accounts">
          <h2 className="font-heading text-2xl font-bold text-brand-primary-dark tracking-tight">3. User Accounts</h2>
          <p>
            3.1. To access certain features, you must create an account. You must provide accurate,
            current, and complete information and keep it updated.
          </p>
          <p>
            3.2. You are responsible for maintaining the security of your account credentials. You
            must notify us immediately at{" "}
            <a href="mailto:support@britestate.co.uk">support@britestate.co.uk</a> if you suspect
            unauthorised access.
          </p>
          <p>
            3.3. We may require identity verification for certain account types (estate agents,
            landlords, service providers) in accordance with our regulatory obligations.
          </p>
          <p>3.4. You may only hold one account per role unless we agree otherwise in writing.</p>
        </section>

        <section id="user-roles">
          <h2 className="font-heading text-2xl font-bold text-brand-primary-dark tracking-tight">
            4. User Roles and Specific Terms
          </h2>
          <p>
            4.1. <strong>Homebuyers and Renters.</strong> You may search listings, save properties,
            set alerts, contact agents and landlords, and access AI-powered recommendations. You
            must not contact property owners for purposes unrelated to genuine property enquiries.
          </p>
          <p>
            4.2. <strong>Sellers.</strong> You may list properties for sale either directly or
            through an estate agent. All listing information must be accurate, complete, and not
            misleading. You must hold legal title (or have authority from the titleholder) to any
            property you list.
          </p>
          <p>
            4.3. <strong>Landlords.</strong> You are responsible for ensuring your rental listings
            comply with the Renters&rsquo; Rights Act 2025, the Housing Act 2004, and all
            applicable licensing requirements. You must hold a valid Energy Performance Certificate
            (EPC), gas safety certificate, and electrical safety certificate for each listed
            property. You acknowledge that from [COMMENCEMENT DATE], the government Property Portal
            will require separate registration.
          </p>
          <p>
            4.4. <strong>Estate Agents.</strong> You represent and warrant that you are a member of
            a government-approved redress scheme (The Property Ombudsman or the Property Redress
            Scheme), that you hold appropriate professional indemnity insurance, and that you are
            registered with HMRC for AML supervision. You must display your fees transparently on
            your Britestate profile in accordance with CMA guidance. See our{" "}
            <Link href="/legal/fee-transparency" className="text-brand-primary hover:underline">
              Fee Transparency Policy
            </Link>
            .
          </p>
          <p>
            4.5. <strong>Service Providers.</strong> You represent that you hold all licences,
            certifications, and insurance necessary to perform the services you offer. Where
            applicable, this includes Gas Safe registration, NICEIC or NAPIT accreditation, or
            appropriate trade body membership.
          </p>
        </section>

        <section id="fees-and-payments">
          <h2 className="font-heading text-2xl font-bold text-brand-primary-dark tracking-tight">5. Fees and Payments</h2>
          <p>
            5.1. <strong>Platform Commission.</strong> Where transactions are facilitated through
            the Platform, a commission of 2.5% of the transaction value may apply. This is
            processed via Stripe Connect. The commission is payable by [SPECIFY: agent/service
            provider/other] and is clearly displayed before any transaction is confirmed. See our{" "}
            <Link href="/legal/fee-transparency" className="text-brand-primary hover:underline">
              Fee Transparency Policy
            </Link>{" "}
            for full details.
          </p>
          <p>
            5.2. <strong>Subscription Fees.</strong> Certain user roles (estate agents, service
            providers) may subscribe to paid plans. Fees are set out on our pricing page and are
            payable monthly or annually in advance. All fees are exclusive of VAT unless stated
            otherwise.
          </p>
          <p>
            5.3. <strong>Cooling-Off Period.</strong> If you are a consumer subscribing to a paid
            plan, you have a 14-day right to cancel under the Consumer Contracts (Information,
            Cancellation and Additional Charges) Regulations 2013. To cancel, email{" "}
            <a href="mailto:support@britestate.co.uk">support@britestate.co.uk</a> within 14 days
            of subscribing. If you have used the service during the cooling-off period, you may be
            charged a proportionate amount.
          </p>
          <p>
            5.4. <strong>Refunds.</strong> Outside the cooling-off period, subscription fees are
            non-refundable except where required by law. Commission charges are non-refundable once
            the underlying transaction has completed.
          </p>
          <p>
            5.5. <strong>Payment Processing.</strong> All payments are processed by Stripe. We do
            not store your full card details. Stripe&rsquo;s terms of service apply to payment
            processing.
          </p>
        </section>

        <section id="content-and-ip">
          <h2 className="font-heading text-2xl font-bold text-brand-primary-dark tracking-tight">
            6. Content and Intellectual Property
          </h2>
          <p>
            6.1. <strong>Our Content.</strong> All content on the Platform (including the software,
            design, logos, text, and database structure) is owned by or licensed to Britestate Ltd
            and is protected by copyright, database rights, trade marks, and other intellectual
            property laws. You may not copy, reproduce, or redistribute our content without our
            prior written consent.
          </p>
          <p>
            6.2. <strong>Your Content.</strong> By uploading content (listings, photos, reviews,
            messages) to the Platform, you grant Britestate a non-exclusive, worldwide,
            royalty-free licence to use, display, reproduce, and distribute that content for the
            purpose of operating and promoting the Platform. You retain ownership of your content.
          </p>
          <p>
            6.3. <strong>Listing Photos.</strong> Property photographs must accurately represent
            the property at the time of listing. You must own or have a licence to use all
            photographs you upload. We reserve the right to remove photos that are misleading,
            digitally manipulated to misrepresent the property, or that infringe third-party rights.
          </p>
          <p>
            6.4. <strong>Reviews.</strong> All reviews must be genuine, based on actual experience,
            and comply with our{" "}
            <Link href="/legal/acceptable-use" className="text-brand-primary hover:underline">
              Acceptable Use Policy
            </Link>
            . We reserve the right to remove reviews that we reasonably believe are fake,
            incentivised, or defamatory.
          </p>
        </section>

        <section id="prohibited-uses">
          <h2 className="font-heading text-2xl font-bold text-brand-primary-dark tracking-tight">7. Prohibited Uses</h2>
          <p>
            7.1. You must not use the Platform in breach of our{" "}
            <Link href="/legal/acceptable-use" className="text-brand-primary hover:underline">
              Acceptable Use Policy
            </Link>
            . In particular, you must not post fraudulent, misleading, or phantom listings; scrape
            or data-mine the Platform; use the Platform to facilitate money laundering or fraud;
            discriminate against any person on grounds protected by the Equality Act 2010; or
            interfere with the Platform&rsquo;s security or functionality.
          </p>
        </section>

        <section id="disclaimers">
          <h2 className="font-heading text-2xl font-bold text-brand-primary-dark tracking-tight">8. Disclaimers</h2>
          <p>
            8.1. The Platform is provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo; We
            do not guarantee that the Platform will be uninterrupted, error-free, or free from
            viruses.
          </p>
          <p>
            8.2. Property listings, valuations, market data, AI-generated recommendations, and EPC
            data are provided for informational purposes only. We do not verify the accuracy of
            third-party content and do not provide legal, financial, surveying, or mortgage advice.
            See our{" "}
            <Link href="/legal/disclaimer" className="text-brand-primary hover:underline">
              Disclaimer
            </Link>{" "}
            for full details.
          </p>
          <p>
            8.3. We are not responsible for the conduct of any User, the accuracy of any listing,
            or the outcome of any transaction facilitated through the Platform.
          </p>
        </section>

        <section id="liability">
          <h2 className="font-heading text-2xl font-bold text-brand-primary-dark tracking-tight">9. Limitation of Liability</h2>
          <p>
            9.1. Nothing in these Terms excludes or limits our liability for: (a) death or personal
            injury caused by our negligence; (b) fraud or fraudulent misrepresentation; (c) any
            liability that cannot be excluded by law.
          </p>
          <p>
            9.2. Subject to Section 9.1, our aggregate liability to you for any claims arising out
            of or in connection with these Terms or your use of the Platform shall not exceed the
            greater of (a) the fees you have paid to us in the 12 months preceding the claim, or
            (b) £100.
          </p>
          <p>
            9.3. Subject to Section 9.1, we shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages, including loss of profits, data, goodwill,
            or opportunity.
          </p>
          <p>
            9.4. If you are a consumer, your statutory rights under the Consumer Rights Act 2015
            are unaffected.
          </p>
        </section>

        <section id="indemnification">
          <h2 className="font-heading text-2xl font-bold text-brand-primary-dark tracking-tight">10. Indemnification</h2>
          <p>
            10.1. If you are an estate agent, landlord, or service provider, you agree to
            indemnify Britestate against any claims, losses, damages, or expenses (including legal
            fees) arising from: (a) your breach of these Terms; (b) your breach of any applicable
            law or regulation; (c) any claim by a third party arising from your use of the Platform
            or your content.
          </p>
        </section>

        <section id="suspension-termination">
          <h2 className="font-heading text-2xl font-bold text-brand-primary-dark tracking-tight">11. Suspension and Termination</h2>
          <p>
            11.1. We may suspend or terminate your account at any time if we reasonably believe you
            have breached these Terms, our{" "}
            <Link href="/legal/acceptable-use" className="text-brand-primary hover:underline">
              Acceptable Use Policy
            </Link>
            , or any applicable law. Where practicable, we will give you notice and an opportunity
            to remedy the breach.
          </p>
          <p>
            11.2. You may close your account at any time through your account settings or by
            emailing{" "}
            <a href="mailto:support@britestate.co.uk">support@britestate.co.uk</a>. Account
            deletion is subject to a 30-day grace period during which you may reverse the decision.
          </p>
          <p>
            11.3. On termination, your licence to use the Platform ceases. Provisions that by their
            nature should survive termination (including Sections 6, 9, 10, and 15) will survive.
          </p>
        </section>

        <section id="dispute-resolution">
          <h2 className="font-heading text-2xl font-bold text-brand-primary-dark tracking-tight">12. Dispute Resolution</h2>
          <p>
            12.1. We aim to resolve disputes informally. Please contact{" "}
            <a href="mailto:support@britestate.co.uk">support@britestate.co.uk</a> in the first
            instance.
          </p>
          <p>
            12.2. If we cannot resolve a dispute informally, you may refer the matter to an
            alternative dispute resolution (ADR) provider. For consumers, you may use the UK Online
            Dispute Resolution platform. See our{" "}
            <Link href="/legal/complaints" className="text-brand-primary hover:underline">
              Complaints Policy
            </Link>{" "}
            for details.
          </p>
          <p>
            12.3. Nothing in this Section prevents either party from seeking interim injunctive
            relief from a court of competent jurisdiction.
          </p>
        </section>

        <section id="force-majeure">
          <h2 className="font-heading text-2xl font-bold text-brand-primary-dark tracking-tight">13. Force Majeure</h2>
          <p>
            13.1. We shall not be liable for any failure or delay in performing our obligations
            where such failure or delay results from events beyond our reasonable control, including
            natural disasters, pandemics, government action, power failure, internet disruption, or
            cyberattack.
          </p>
        </section>

        <section id="ai-features">
          <h2 className="font-heading text-2xl font-bold text-brand-primary-dark tracking-tight">
            14. AI Features and Automated Decision-Making
          </h2>
          <p>
            14.1. Britestate uses artificial intelligence (powered by Anthropic Claude and vector
            embeddings) to provide property recommendations, estimated valuations, and search
            matching. These outputs are generated algorithmically and should not be relied upon as
            professional advice. See our{" "}
            <Link href="/legal/ai-transparency" className="text-brand-primary hover:underline">
              AI Transparency Notice
            </Link>
            .
          </p>
          <p>
            14.2. Where AI features involve automated decision-making that significantly affects
            you, you have the right to request human review under Article 22 of UK GDPR. Contact{" "}
            <a href="mailto:privacy@britestate.co.uk">privacy@britestate.co.uk</a> to exercise
            this right.
          </p>
          <p>
            14.3. We are transparent about which features use AI. AI-generated content and
            recommendations are labelled as such on the Platform.
          </p>
        </section>

        <section id="governing-law">
          <h2 className="font-heading text-2xl font-bold text-brand-primary-dark tracking-tight">
            15. Governing Law and Jurisdiction
          </h2>
          <p>15.1. These Terms are governed by the laws of England and Wales.</p>
          <p>
            15.2. The courts of England and Wales shall have exclusive jurisdiction, except that if
            you are a consumer habitually resident in Scotland or Northern Ireland, you may also
            bring proceedings in those jurisdictions.
          </p>
        </section>

        <section id="changes">
          <h2 className="font-heading text-2xl font-bold text-brand-primary-dark tracking-tight">16. Changes to These Terms</h2>
          <p>
            16.1. We may update these Terms from time to time. We will notify you of material
            changes by email or in-app notification at least 30 days before they take effect.
          </p>
          <p>
            16.2. If you do not agree to the updated Terms, you may close your account before the
            changes take effect. Continued use after the effective date constitutes acceptance.
          </p>
        </section>

        <section id="general">
          <h2 className="font-heading text-2xl font-bold text-brand-primary-dark tracking-tight">17. General</h2>
          <p>
            17.1. <strong>Entire Agreement.</strong> These Terms (together with the other Legal
            Documents) constitute the entire agreement between you and Britestate in relation to
            your use of the Platform.
          </p>
          <p>
            17.2. <strong>Severability.</strong> If any provision of these Terms is found to be
            invalid or unenforceable, the remaining provisions shall continue in full force and
            effect.
          </p>
          <p>
            17.3. <strong>Waiver.</strong> No failure or delay by Britestate in exercising any
            right shall constitute a waiver of that right.
          </p>
          <p>
            17.4. <strong>Assignment.</strong> You may not assign your rights under these Terms. We
            may assign our rights to any affiliate or successor.
          </p>
          <p>
            17.5. <strong>Third-Party Rights.</strong> These Terms do not confer any rights on any
            third party under the Contracts (Rights of Third Parties) Act 1999.
          </p>
        </section>

        <section id="contact">
          <h2 className="font-heading text-2xl font-bold text-brand-primary-dark tracking-tight">18. Contact Us</h2>
          <p>
            Britestate Ltd
            <br />
            [REGISTERED ADDRESS]
            <br />
            Company No. [COMPANY NUMBER]
            <br />
            Email:{" "}
            <a href="mailto:support@britestate.co.uk">support@britestate.co.uk</a>
            <br />
            HMRC AML Registration: [REFERENCE]
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
            name: "Terms of Service",
            dateModified: LAST_UPDATED,
            publisher: { "@type": "Organization", name: "Britestate Ltd" },
            url: `${BASE_URL}/legal/terms`,
          }),
        }}
      />
    </LegalPageShell>
  );
}
