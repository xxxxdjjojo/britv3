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
  icon: React.ComponentType<{ size?: number }>;
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
    ],
  },
  {
    heading: "Platform",
    docs: [
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
    ],
  },
];

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="mb-16">
        <h1 className="text-4xl font-bold font-heading tracking-tight text-neutral-900">
          Legal Hub
        </h1>
        <p className="mt-4 text-lg text-neutral-600">
          Britestate&apos;s legal documents, policies, and compliance information.
        </p>
      </div>

      {/* Category sections */}
      <div className="space-y-16">
        {categories.map((category) => (
          <section key={category.heading}>
            <h2 className="mb-6 text-xl font-semibold font-heading text-neutral-900 border-b border-neutral-200 pb-3">
              {category.heading}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.docs.map((doc) => {
                const Icon = doc.icon;
                return (
                  <Link
                    key={doc.href}
                    href={doc.href}
                    className="group flex items-start gap-4 rounded-xl border border-neutral-200 p-5 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    <span className="shrink-0 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <Icon size={20} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-neutral-900 group-hover:text-primary transition-colors">
                        {doc.title}
                      </p>
                      <p className="mt-1 text-sm text-neutral-500 leading-relaxed">
                        {doc.desc}
                      </p>
                    </div>
                    <span className="shrink-0 text-neutral-400 group-hover:text-primary transition-colors mt-1">
                      →
                    </span>
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
