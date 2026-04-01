import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  AlertTriangle,
  Shield,
  Cookie,
  UserCheck,
  Database,
  Briefcase,
  Scale,
  Eye,
  MessageSquare,
  Info,
  Coins,
  BrainCircuit,
  Home,
  BadgeCheck,
  Landmark,
  Network,
  ReceiptText,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Legal Hub | Britestate",
  description: "Britestate's legal documents, policies, and compliance information.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://britestate.co.uk"}/legal`,
  },
};

type DocCard = {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
};

type Category = {
  heading: string;
  docs: DocCard[];
};

const categories: Category[] = [
  {
    heading: "User Agreements",
    docs: [
      {
        href: "/legal/terms",
        icon: FileText,
        title: "Terms of Service",
        desc: "Rules governing your use of the Britestate platform.",
      },
      {
        href: "/legal/acceptable-use",
        icon: AlertTriangle,
        title: "Acceptable Use Policy",
        desc: "Conduct standards and prohibited activities on the platform.",
      },
    ],
  },
  {
    heading: "Privacy & Data Protection",
    docs: [
      {
        href: "/legal/privacy",
        icon: Shield,
        title: "Privacy Policy",
        desc: "How we collect, use, and protect your personal data under UK GDPR.",
      },
      {
        href: "/legal/cookies",
        icon: Cookie,
        title: "Cookie Policy",
        desc: "Details of cookies we use and how to manage your preferences.",
      },
      {
        href: "/legal/gdpr-rights",
        icon: UserCheck,
        title: "GDPR Data Subject Rights",
        desc: "Your eight rights under UK GDPR and how to exercise them.",
      },
      {
        href: "/legal/data-processing",
        icon: Database,
        title: "Data Processing Agreement",
        desc: "DPA terms for service providers operating on the platform.",
      },
    ],
  },
  {
    heading: "Compliance",
    docs: [
      {
        href: "/legal/aml-policy",
        icon: Briefcase,
        title: "Anti-Money Laundering Policy",
        desc: "Our AML obligations under the Money Laundering Regulations 2017.",
      },
      {
        href: "/legal/modern-slavery",
        icon: Scale,
        title: "Modern Slavery Statement",
        desc: "Our commitment under the Modern Slavery Act 2015.",
      },
      {
        href: "/legal/fair-housing",
        icon: Home,
        title: "Fair Housing Policy",
        desc: "Our commitment to equal access to housing under the Equality Act 2010.",
      },
      {
        href: "/legal/professional-standards",
        icon: BadgeCheck,
        title: "Professional Standards",
        desc: "Standards and obligations for professionals on Britestate.",
      },
      {
        href: "/legal/regulatory-information",
        icon: Landmark,
        title: "Regulatory Information",
        desc: "Platform regulatory status, FCA disclaimer, and regulator contacts.",
      },
    ],
  },
  {
    heading: "Platform",
    docs: [
      {
        href: "/legal/fee-transparency",
        icon: Coins,
        title: "Fee Transparency",
        desc: "Clear breakdown of platform fees, commissions, and payment terms.",
      },
      {
        href: "/legal/ai-transparency",
        icon: BrainCircuit,
        title: "AI Transparency Notice",
        desc: "How we use artificial intelligence and automated decision-making.",
      },
      {
        href: "/legal/accessibility",
        icon: Eye,
        title: "Accessibility Statement",
        desc: "Our WCAG 2.1 AA compliance status and known limitations.",
      },
      {
        href: "/legal/complaints",
        icon: MessageSquare,
        title: "Complaints Procedure",
        desc: "How to raise a complaint and escalation options.",
      },
      {
        href: "/legal/disclaimer",
        icon: Info,
        title: "Disclaimer",
        desc: "Limitations on the advice and information we provide.",
      },
      {
        href: "/legal/third-party-services",
        icon: Network,
        title: "Third-Party Services Disclosure",
        desc: "Third-party services we use and how your data flows to them.",
      },
      {
        href: "/legal/refund-policy",
        icon: ReceiptText,
        title: "Refund Policy",
        desc: "Refund terms for subscriptions, boosts, and one-time purchases.",
      },
    ],
  },
];

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Hero */}
      <div className="mb-10 text-center">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Legal Centre
        </h1>
        <p className="mt-2 font-body text-base text-neutral-500">
          Britestate&apos;s legal documents, policies, and compliance information.
        </p>
      </div>

      {/* Category sections */}
      <div className="space-y-10">
        {categories.map((category) => (
          <section key={category.heading}>
            <h2 className="mb-4 font-heading text-base font-semibold text-foreground">
              {category.heading}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.docs.map((doc) => {
                const Icon = doc.icon;
                return (
                  <Link
                    key={doc.href}
                    href={doc.href}
                    className="rounded-xl bg-card p-5 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 hover:shadow-md transition-shadow"
                  >
                    <Icon className="size-5 text-brand-primary mb-3" />
                    <p className="font-body text-sm font-medium text-foreground">
                      {doc.title}
                    </p>
                    <p className="mt-1 font-body text-xs text-neutral-500">
                      {doc.desc}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
