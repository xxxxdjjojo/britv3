import type { Metadata } from "next";

export function generateMetadata(): Metadata {
  return {
    title: "Review Policy | Britestate",
    description:
      "Our review policy explains how reviews are moderated, verified, and managed on Britestate. Learn about incentivised review disclosure, defamation complaints, and your rights under UK law.",
  };
}

export default function ReviewPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <article className="prose prose-neutral dark:prose-invert">
        <h1>Review Policy</h1>
        <p className="lead">
          Britestate is committed to maintaining honest, transparent reviews
          that help consumers make informed decisions. This policy explains how
          reviews are managed on our platform, in accordance with the Consumer
          Protection from Unfair Trading Regulations 2008, the Digital Markets,
          Competition and Consumers Act 2024, the Defamation Act 2013, and the
          UK General Data Protection Regulation (UK GDPR).
        </p>
        <p>
          <strong>Last updated:</strong> 27 March 2026
        </p>

        <h2>Review Guidelines</h2>
        <p>All reviews submitted on Britestate must:</p>
        <ul>
          <li>Be honest and based on a genuine experience with the service provider.</li>
          <li>Avoid personal attacks, threats, or abusive language.</li>
          <li>Not contain personal information such as phone numbers, email addresses, or home addresses.</li>
          <li>Not include promotional content or links to external websites.</li>
          <li>Be relevant to the service received.</li>
        </ul>
        <p>
          Reviews that do not meet these guidelines may be removed or edited by
          our moderation team.
        </p>

        <h2>Verification Tiers</h2>
        <p>
          Reviews on Britestate carry one of two verification statuses:
        </p>
        <ul>
          <li>
            <strong>Verified</strong> — The review is linked to a completed
            booking on the Britestate platform. These reviews have been
            confirmed as relating to a genuine transaction between the reviewer
            and the service provider.
          </li>
          <li>
            <strong>Unverified</strong> — The review is pending verification or
            could not be linked to a completed transaction. Unverified reviews
            are still subject to our moderation process.
          </li>
        </ul>

        <h2>Grounds for Removal</h2>
        <p>
          Reviews may be removed if they fall into any of the following
          categories:
        </p>
        <ul>
          <li><strong>Spam</strong> — Irrelevant or repetitive content with no genuine purpose.</li>
          <li><strong>Fake reviews</strong> — Reviews not based on a genuine customer experience, including reviews posted by competitors or individuals with no connection to the service.</li>
          <li><strong>Defamatory content</strong> — False statements of fact that could seriously harm the reputation of an individual or business, as defined under the Defamation Act 2013.</li>
          <li><strong>Incentivised without disclosure</strong> — Reviews written in exchange for a discount, free service, or other incentive that have not been clearly labelled as incentivised.</li>
          <li><strong>Contains personal information</strong> — Reviews that include phone numbers, email addresses, home addresses, or other personally identifiable information.</li>
          <li><strong>Off-topic</strong> — Reviews that are not relevant to the service received or the provider being reviewed.</li>
        </ul>

        <h2>Incentivised Reviews</h2>
        <p>
          Under the Consumer Protection from Unfair Trading Regulations 2008 and
          the Digital Markets, Competition and Consumers Act 2024, any review
          written in exchange for a discount, free service, gift, or other
          incentive <strong>must be disclosed</strong>. On Britestate,
          incentivised reviews are clearly labelled with an
          &ldquo;Incentivised&rdquo; badge.
        </p>
        <p>
          If you have received an incentive in exchange for your review, you must
          indicate this at the time of submission. Failure to disclose an
          incentive may result in the removal of your review and, in serious
          cases, suspension of your account.
        </p>
        <p>
          Service providers are prohibited from offering incentives conditional
          on the review being positive. All incentivised reviews must still
          reflect the reviewer&rsquo;s honest opinion.
        </p>

        <h2>Defamation Complaints</h2>
        <p>
          If you believe a review contains defamatory content — that is, false
          statements of fact that cause or are likely to cause serious harm to
          your reputation — you may submit a defamation complaint through the
          following process:
        </p>
        <ol>
          <li>
            <strong>Report the review</strong> — Use the &ldquo;Report&rdquo;
            button on the review and select &ldquo;Defamatory&rdquo; as the
            reason, or contact our support team directly at{" "}
            <a href="mailto:support@britestate.co.uk">support@britestate.co.uk</a>.
          </li>
          <li>
            <strong>Acknowledgement</strong> — We will acknowledge your complaint
            within 48 hours of receipt.
          </li>
          <li>
            <strong>Investigation</strong> — Our moderation team will review the
            flagged content, taking into account the Defamation Act 2013 and the
            defence of honest opinion.
          </li>
          <li>
            <strong>Outcome</strong> — We will either remove the review if it is
            found to be defamatory, or retain it with a written explanation of
            our decision. Defamation complaints are given elevated priority in
            our moderation queue.
          </li>
        </ol>

        <h2>Review Editing</h2>
        <p>
          Reviewers may edit their reviews within <strong>48 hours</strong> of
          the original submission, up to a maximum of two edits. Edited reviews
          are automatically re-submitted for moderation to ensure continued
          compliance with our guidelines.
        </p>
        <p>
          The original text is retained in our records for audit purposes. Edited
          reviews display an &ldquo;Edited&rdquo; badge to maintain
          transparency.
        </p>

        <h2>Account Deletion</h2>
        <p>
          In accordance with UK GDPR (specifically the right to erasure under
          Article 17), when a reviewer deletes their Britestate account, their
          reviews are <strong>anonymised</strong> rather than deleted. This means
          the review content is retained but attributed to &ldquo;A Britestate
          user&rdquo; instead of the original reviewer&rsquo;s name.
        </p>
        <p>
          This approach balances the reviewer&rsquo;s right to privacy with the
          legitimate interest of service providers and other consumers in
          maintaining a fair and complete review record.
        </p>

        <h2>Professional Responses</h2>
        <p>
          Service providers who have been reviewed on Britestate may post a
          single public response to each review. Responses must be:
        </p>
        <ul>
          <li>Constructive and professional in tone.</li>
          <li>Free from personal attacks or threats.</li>
          <li>Relevant to the feedback provided in the review.</li>
          <li>Compliant with all other provisions of this policy.</li>
        </ul>
        <p>
          Provider responses are displayed alongside the original review and are
          subject to the same moderation standards.
        </p>

        <h2>Contact Us</h2>
        <p>
          If you have questions about this review policy or wish to report a
          concern, please contact us at{" "}
          <a href="mailto:support@britestate.co.uk">support@britestate.co.uk</a>.
        </p>
      </article>
    </main>
  );
}
