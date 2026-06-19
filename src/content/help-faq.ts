/**
 * Help centre FAQ content.
 * TypeScript arrays -- no MDX dependency, easy to update.
 */

export type FaqItem = Readonly<{
  question: string;
  answer: string;
}>;

export type FaqSection = Readonly<{
  title: string;
  items: FaqItem[];
}>;

export const FAQ_SECTIONS: FaqSection[] = [
  {
    title: "Account & Registration",
    items: [
      {
        question: "How do I create a TrueDeed account?",
        answer:
          "Click 'Sign up' in the top right corner. You can register with your email address or sign in with Google. After registration you will be prompted to choose your role (homebuyer, renter, landlord, etc.) and complete a short onboarding flow.",
      },
      {
        question: "Can I have more than one role on the platform?",
        answer:
          "Yes. You can hold multiple roles -- for example being both a homebuyer and a landlord. You can switch your active role at any time from your profile settings. Each role has its own dashboard with tailored tools and information.",
      },
      {
        question: "How do I verify my identity?",
        answer:
          "Identity verification is required for certain actions such as making or accepting offers. Go to your Profile > Verification and follow the step-by-step process. Basic verification (email + phone) is quick. Full identity verification typically takes 1--2 business days.",
      },
      {
        question: "I forgot my password. How do I reset it?",
        answer:
          "Click 'Log in', then 'Forgot password?' Enter your email address and we will send you a reset link. The link expires after 60 minutes. If you do not receive the email, check your spam folder or contact us.",
      },
      {
        question: "How do I delete my account?",
        answer:
          "You can request account deletion from Profile > Settings > Delete account. Under GDPR you have the right to erasure. We will delete your personal data within 30 days, retaining only legally required transaction records.",
      },
    ],
  },
  {
    title: "Property Search",
    items: [
      {
        question: "How do I search for properties?",
        answer:
          "Use the search bar on the homepage or the Search tab. You can filter by location, price range, number of bedrooms, property type, and more. Draw a custom search area on the map for precise results.",
      },
      {
        question: "Can I save properties and set up alerts?",
        answer:
          "Yes. Click the heart icon on any property to save it to your favourites. You can also save your search criteria and receive email alerts when new matching properties are listed. Manage your saved searches from your dashboard.",
      },
      {
        question: "How up-to-date are the property listings?",
        answer:
          "Listings are updated in real time as agents and sellers make changes. Properties marked 'Under offer' or 'Sold STC' are updated as soon as the status changes. If you spot an inaccuracy, use the 'Report listing' option.",
      },
      {
        question: "What does 'price on application' mean?",
        answer:
          "Some high-value or unique properties are listed without a public price. Use the 'Request details' button to ask the agent or seller for the asking price and property pack.",
      },
    ],
  },
  {
    title: "Service Providers",
    items: [
      {
        question: "How do I find a service provider such as a solicitor or surveyor?",
        answer:
          "Go to the Marketplace section. Search by category (e.g. conveyancing, surveying, removals) and location. You can view verified profiles, read reviews, and request quotes directly on the platform.",
      },
      {
        question: "Are service providers verified?",
        answer:
          "All service providers go through our verification process which includes professional qualification checks, insurance validation, and identity verification. Verified providers display a badge on their profile.",
      },
      {
        question: "How does quoting and booking work?",
        answer:
          "Request quotes from one or more providers for your job. Providers respond with itemised quotes. Once you accept a quote, you can book directly and track progress through the platform. Payments are handled securely via Stripe.",
      },
      {
        question: "What if I have a dispute with a provider?",
        answer:
          "Contact us via the Help Centre and we will investigate. We hold payments in escrow until work is confirmed complete, providing protection for both parties. Our moderation team reviews all dispute cases within 5 business days.",
      },
    ],
  },
  {
    title: "Messaging",
    items: [
      {
        question: "How does messaging work on TrueDeed?",
        answer:
          "All communication happens through our secure in-platform messaging system. You can message agents, sellers, service providers, and other parties involved in your transaction. Attachments (documents and images) are supported.",
      },
      {
        question: "Will I be notified of new messages?",
        answer:
          "Yes. You will receive in-app notifications for new messages. You can also enable email notifications from your notification preferences. The notification bell in the header shows your unread message count.",
      },
      {
        question: "Can I share documents via messages?",
        answer:
          "Yes. Attach PDFs, images, and documents directly to messages. All attachments are scanned for malware and stored securely. Maximum attachment size is 10 MB per file.",
      },
    ],
  },
  {
    title: "Landlord Tools",
    items: [
      {
        question: "What landlord features does TrueDeed offer?",
        answer:
          "The landlord dashboard includes portfolio management, tenancy tracking, rent payment records, maintenance request management, compliance reminders (EPC, gas safety, EICR, HMO), and financial summaries with export to CSV.",
      },
      {
        question: "How do compliance reminders work?",
        answer:
          "Add your compliance documents (gas safety certificate, EPC, etc.) along with their expiry dates. We will send you reminders 60, 30, and 7 days before expiry so you never miss a legal obligation.",
      },
      {
        question: "Can I manage multiple properties?",
        answer:
          "Yes. Your portfolio section lists all your properties. Switch between them to view tenancy details, maintenance requests, and financial information. There is no limit on the number of properties you can manage.",
      },
      {
        question: "How do I record maintenance requests?",
        answer:
          "Tenants can raise maintenance requests directly from their dashboard, or you can add them manually. Each request tracks status (open, in progress, resolved), priority, estimated cost, and assigned provider.",
      },
    ],
  },
  {
    title: "Payments & Billing",
    items: [
      {
        question: "What payment methods are accepted?",
        answer:
          "We accept all major credit and debit cards (Visa, Mastercard, American Express) via Stripe. For larger transactions, bank transfer is also available. All payments are encrypted and PCI-DSS compliant.",
      },
      {
        question: "Is there a platform fee?",
        answer:
          "TrueDeed charges a 2.5% platform commission on service provider transactions. Property listings for agents and individual sellers are charged a flat fee at point of listing. Full pricing details are available on our Pricing page.",
      },
      {
        question: "How do refunds work?",
        answer:
          "Refund eligibility depends on the service type and timing. For service bookings, cancellation within 24 hours before the scheduled date is usually eligible for a full refund. Contact us within 14 days of payment to request a refund.",
      },
      {
        question: "Where can I view my transaction history?",
        answer:
          "Go to your Dashboard > Billing to view a full history of payments made and received. You can download invoices and receipts as PDFs for accounting purposes.",
      },
    ],
  },
];
