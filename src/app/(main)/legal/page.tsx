// TODO: Replace with real legal text before launch
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Legal Information | Britestate",
  description:
    "Britestate legal information including terms of service, privacy policy, cookie policy, accessibility statement, and complaints procedure.",
};

const navLinks = [
  { href: "#terms", label: "Terms of Service" },
  { href: "#privacy", label: "Privacy Policy" },
  { href: "#cookies", label: "Cookie Policy" },
  { href: "#accessibility", label: "Accessibility Statement" },
  { href: "#complaints", label: "Complaints Procedure" },
];

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500">
        <Link href="/" className="hover:text-brand-primary transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-neutral-900">Legal</span>
      </nav>

      {/* Page Header */}
      <h1 className="font-heading text-4xl font-bold text-neutral-900">
        Legal Information
      </h1>
      <p className="mt-2 text-sm text-neutral-500">Last updated: January 2026</p>

      <div className="mt-10 flex gap-12">
        {/* Left Sidebar — desktop only */}
        <aside className="hidden lg:block w-40 shrink-0">
          <div className="sticky top-24">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Legal
            </p>
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-brand-primary-lighter hover:text-brand-primary"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 space-y-16 text-neutral-600">
          {/* 1. Terms of Service */}
          <section id="terms">
            <h2 className="font-heading text-2xl font-bold text-neutral-900">
              Terms of Service
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Last updated: 15 January 2026
            </p>
            <p className="mt-4 text-base leading-relaxed">
              By accessing or using the Britestate platform (&ldquo;the
              Service&rdquo;), you agree to be bound by these Terms of Service
              and all applicable laws and regulations of England and Wales. If
              you do not agree with any of these terms, you are prohibited from
              using or accessing the Service. Britestate reserves the right to
              revise these terms at any time without notice.
            </p>
            <p className="mt-4 text-base leading-relaxed">
              Britestate provides an online property portal enabling users to
              search for properties, connect with estate agents and service
              providers, and track property transactions. We act as an
              intermediary platform and do not provide legal, financial,
              surveying, or conveyancing advice. Any information on the platform
              is for general informational purposes only and should not be
              relied upon as professional advice.
            </p>
            <p className="mt-4 text-base leading-relaxed">
              We reserve the right to terminate or suspend access to the Service
              immediately, without prior notice or liability, for any reason,
              including if you breach these Terms. All provisions which by their
              nature should survive termination shall survive, including
              ownership provisions, warranty disclaimers, indemnity, and
              limitations of liability.
            </p>

            <h3 className="mt-8 font-heading text-lg font-semibold text-neutral-900">
              User Accounts
            </h3>
            <p className="mt-3 text-base leading-relaxed">
              You must provide accurate, current, and complete information when
              creating an account on Britestate. You are solely responsible for
              maintaining the confidentiality of your login credentials and for
              all activity that occurs under your account. You must notify us
              immediately of any unauthorised use of your account. Britestate
              cannot and will not be liable for any loss or damage arising from
              your failure to comply with this requirement.
            </p>

            <h3 className="mt-8 font-heading text-lg font-semibold text-neutral-900">
              Acceptable Use
            </h3>
            <p className="mt-3 text-base leading-relaxed">
              You agree not to misuse the platform, including but not limited
              to: uploading fraudulent or misleading property listings,
              impersonating other users or organisations, scraping or harvesting
              data by automated means, transmitting malicious code or viruses,
              or engaging in any activity that violates applicable UK law or
              regulation, including the Fraud Act 2006 and the Computer Misuse
              Act 1990.
            </p>

            <h3 className="mt-8 font-heading text-lg font-semibold text-neutral-900">
              Intellectual Property
            </h3>
            <p className="mt-3 text-base leading-relaxed">
              The Service and its original content, features, and functionality
              are and will remain the exclusive property of Britestate Ltd and
              its licensors. The Britestate name, logo, and all related marks
              are trademarks of Britestate Ltd. Content you upload to the
              platform remains your property; however, by submitting it you
              grant Britestate a worldwide, royalty-free licence to use, display,
              and distribute it in connection with operating the Service.
            </p>
          </section>

          {/* 2. Privacy Policy */}
          <section id="privacy">
            <h2 className="font-heading text-2xl font-bold text-neutral-900">
              Privacy Policy
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Last updated: 15 January 2026
            </p>
            <p className="mt-4 text-base leading-relaxed">
              Britestate Ltd (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or
              &ldquo;our&rdquo;) is committed to protecting your personal data
              and respecting your privacy. This Privacy Policy explains how we
              collect, use, store, and share information about you when you use
              our platform. We are registered with the UK Information
              Commissioner&apos;s Office (ICO) and process personal data in
              accordance with the UK General Data Protection Regulation
              (UK GDPR) and the Data Protection Act 2018.
            </p>
            <p className="mt-4 text-base leading-relaxed">
              We collect personal data that you provide directly to us when
              registering an account, listing a property, making an enquiry, or
              communicating through the platform. We also collect data
              automatically through your use of the Service, including
              technical data such as your IP address, browser type, and device
              identifiers, as well as usage data such as pages visited and
              search queries performed.
            </p>
            <p className="mt-4 text-base leading-relaxed">
              We will never sell your personal data to third parties. We may
              share data with trusted partners — including estate agents you
              contact, service providers you engage, and our payment processor
              Stripe — only to the extent necessary to provide the Service. All
              third-party data processors are bound by data processing agreements
              that require them to handle your data in compliance with UK GDPR.
            </p>

            <h3 className="mt-8 font-heading text-lg font-semibold text-neutral-900">
              Data We Collect
            </h3>
            <p className="mt-3 text-base leading-relaxed">
              We collect account information (name, email, phone number), profile
              data (role preferences, saved searches, property interests),
              transaction data (offer details, document uploads, communication
              logs), technical data (IP address, browser, device), and usage
              data (pages visited, features used, search queries). For verified
              professionals such as estate agents and service providers, we also
              collect business registration details and identity verification
              documents.
            </p>

            <h3 className="mt-8 font-heading text-lg font-semibold text-neutral-900">
              How We Use Your Data
            </h3>
            <p className="mt-3 text-base leading-relaxed">
              We use your data to provide and improve our property portal
              services, facilitate property transactions and communications,
              verify user identities and prevent fraud, send service-related
              notifications, and — with your explicit consent — deliver
              marketing communications. We also use aggregated and anonymised
              data for platform analytics and product improvement.
            </p>

            <h3 className="mt-8 font-heading text-lg font-semibold text-neutral-900">
              Your Rights
            </h3>
            <p className="mt-3 text-base leading-relaxed">
              Under UK GDPR you have the right to access, correct, erase,
              restrict, or port your personal data, and to object to certain
              processing activities. To exercise any of these rights, contact
              our Data Protection Officer at{" "}
              <a
                href="mailto:privacy@britestate.co.uk"
                className="text-brand-primary hover:underline"
              >
                privacy@britestate.co.uk
              </a>
              . We will respond within 30 days. You also have the right to lodge
              a complaint with the ICO at{" "}
              <a
                href="https://ico.org.uk"
                className="text-brand-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                ico.org.uk
              </a>
              .
            </p>
          </section>

          {/* 3. Cookie Policy */}
          <section id="cookies">
            <h2 className="font-heading text-2xl font-bold text-neutral-900">
              Cookie Policy
            </h2>
            <p className="mt-4 text-base leading-relaxed">
              Britestate uses cookies and similar tracking technologies to
              enhance your experience, analyse site usage, and support our
              marketing activities. Cookies are small text files stored on your
              device. You can control or disable cookies through your browser
              settings; however, disabling certain cookies may affect platform
              functionality.
            </p>
            <p className="mt-4 text-base leading-relaxed">
              We use three categories of cookies: Essential cookies that are
              necessary for the platform to function; Analytics cookies that help
              us understand how visitors interact with the site; and Marketing
              cookies used to deliver relevant advertisements. Non-essential
              cookies are only set with your explicit consent, which you can
              manage at any time via our cookie preferences centre.
            </p>

            <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-200">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700">
                      Cookie Name
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700">
                      Purpose
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  <tr>
                    <td className="px-4 py-3 font-mono text-neutral-700">
                      sb-access-token
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      Supabase authentication session
                    </td>
                    <td className="px-4 py-3 text-neutral-600">1 hour</td>
                    <td className="px-4 py-3 text-neutral-600">Essential</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-neutral-700">
                      sb-refresh-token
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      Supabase authentication refresh
                    </td>
                    <td className="px-4 py-3 text-neutral-600">30 days</td>
                    <td className="px-4 py-3 text-neutral-600">Essential</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-neutral-700">
                      ph_posthog
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      PostHog analytics and feature flags
                    </td>
                    <td className="px-4 py-3 text-neutral-600">1 year</td>
                    <td className="px-4 py-3 text-neutral-600">Analytics</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-neutral-700">
                      _ga
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      Google Analytics visitor tracking
                    </td>
                    <td className="px-4 py-3 text-neutral-600">2 years</td>
                    <td className="px-4 py-3 text-neutral-600">Analytics</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-neutral-700">
                      brite_cookie_consent
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      Stores your cookie preferences
                    </td>
                    <td className="px-4 py-3 text-neutral-600">1 year</td>
                    <td className="px-4 py-3 text-neutral-600">Essential</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-neutral-700">
                      _fbp
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      Facebook Pixel for retargeting
                    </td>
                    <td className="px-4 py-3 text-neutral-600">90 days</td>
                    <td className="px-4 py-3 text-neutral-600">Marketing</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 4. Accessibility Statement */}
          <section id="accessibility">
            <h2 className="font-heading text-2xl font-bold text-neutral-900">
              Accessibility Statement
            </h2>
            <p className="mt-4 text-base leading-relaxed">
              Britestate is committed to ensuring digital accessibility for
              people with disabilities. We are continually improving the user
              experience for everyone and applying the relevant accessibility
              standards. Our platform aims to conform to the Web Content
              Accessibility Guidelines (WCAG) 2.1 at Level AA, as required by
              The Public Sector Bodies (Websites and Mobile Applications)
              Accessibility Regulations 2018.
            </p>
            <p className="mt-4 text-base leading-relaxed">
              We know some parts of the platform may not yet be fully
              accessible. We are working to fix these issues and will provide a
              full accessibility audit report once the platform reaches public
              beta. Known limitations and planned remediation steps will be
              listed in our detailed accessibility report, available on request.
            </p>
            <p className="mt-4 text-base leading-relaxed">
              If you experience any accessibility barriers while using
              Britestate, or if you need content in an accessible format, please
              contact our accessibility team:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-6 text-base">
              <li>
                Email:{" "}
                <a
                  href="mailto:accessibility@britestate.co.uk"
                  className="text-brand-primary hover:underline"
                >
                  accessibility@britestate.co.uk
                </a>
              </li>
              <li>
                Phone: 0800 123 4567 (Monday to Friday, 9am to 5pm)
              </li>
              <li>
                We aim to respond to accessibility queries within 2 working
                days.
              </li>
            </ul>
            <p className="mt-4 text-base leading-relaxed">
              If you are not satisfied with our response you can contact the
              Equality and Human Rights Commission (EHRC) who is responsible
              for enforcing the accessibility regulations.
            </p>
          </section>

          {/* 5. Complaints Procedure */}
          <section id="complaints">
            <h2 className="font-heading text-2xl font-bold text-neutral-900">
              Complaints Procedure
            </h2>
            <p className="mt-4 text-base leading-relaxed">
              We take all complaints seriously and aim to resolve them quickly
              and fairly. If you are unhappy with any aspect of our service,
              please follow the three-step process below.
            </p>

            <div className="mt-6 space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white">
                  1
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold text-neutral-900">
                    Contact Support
                  </h3>
                  <p className="mt-2 text-base leading-relaxed">
                    In the first instance, please contact our customer support
                    team at{" "}
                    <a
                      href="mailto:support@britestate.co.uk"
                      className="text-brand-primary hover:underline"
                    >
                      support@britestate.co.uk
                    </a>{" "}
                    or via the in-platform chat. Please include your account
                    email address, a description of the issue, and any relevant
                    reference numbers. We aim to acknowledge all complaints
                    within 1 working day and resolve them within 5 working days.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white">
                  2
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold text-neutral-900">
                    Escalation
                  </h3>
                  <p className="mt-2 text-base leading-relaxed">
                    If you are not satisfied with the initial response, you may
                    escalate your complaint to our Senior Management Team by
                    writing to{" "}
                    <a
                      href="mailto:complaints@britestate.co.uk"
                      className="text-brand-primary hover:underline"
                    >
                      complaints@britestate.co.uk
                    </a>
                    . Please mark your email &ldquo;Formal Complaint&rdquo; and
                    include all previous correspondence. A senior manager will
                    review your complaint and respond within 10 working days
                    with our final position.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white">
                  3
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold text-neutral-900">
                    External Resolution
                  </h3>
                  <p className="mt-2 text-base leading-relaxed">
                    If you remain dissatisfied following our final response, you
                    may refer your complaint to an independent alternative
                    dispute resolution (ADR) scheme or the relevant ombudsman
                    service. For property-related disputes, the Property
                    Ombudsman (TPO) may be able to assist. For data protection
                    matters, you may contact the Information Commissioner&apos;s
                    Office (ICO).
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600">
              <p className="font-semibold text-neutral-900">
                Britestate Ltd — Registered Address
              </p>
              <p className="mt-1">
                123 Placeholder Street
                <br />
                London
                <br />
                EC1A 1BB
                <br />
                United Kingdom
              </p>
              <p className="mt-2">
                Company registered in England and Wales. Company number:
                12345678.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
