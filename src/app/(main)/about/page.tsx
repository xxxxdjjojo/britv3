import type { Metadata } from "next";
import Link from "next/link";
import {
  Eye,
  ShieldCheck,
  Users,
  Sparkles,
  ArrowRight,
  Building2,
  TrendingUp,
  Globe,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About | Britestate",
  description:
    "Learn about Britestate — the UK property portal that brings together search, services, and transactions in one platform.",
};

const VALUES = [
  {
    icon: Eye,
    title: "Transparency",
    description:
      "Every fee, every step, every update — visible to all parties. No hidden costs, no surprises.",
  },
  {
    icon: ShieldCheck,
    title: "Trust",
    description:
      "Verified agents, authenticated users, and secure transactions built on robust identity checks.",
  },
  {
    icon: Users,
    title: "Accessibility",
    description:
      "A platform designed for everyone, from first-time buyers to experienced property professionals.",
  },
  {
    icon: Sparkles,
    title: "Innovation",
    description:
      "AI-powered matching, real-time tracking, and integrated services that simplify complex processes.",
  },
];

const STATS = [
  { value: "50,000+", label: "Moves Completed" },
  { value: "£1.2B", label: "Property Transacted" },
  { value: "4.9/5", label: "User Rating" },
  { value: "5,000+", label: "Verified Pros" },
];

const TEAM_AREAS = [
  {
    icon: Building2,
    title: "Property Industry Veterans",
    description:
      "Decades of experience across residential sales, lettings, and property management.",
  },
  {
    icon: TrendingUp,
    title: "Technology Leaders",
    description:
      "Engineers and product managers from leading UK and global technology companies.",
  },
  {
    icon: Globe,
    title: "Design Innovators",
    description:
      "Designers who have redefined digital experiences across fintech, proptech, and consumer products.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-neutral-50">
      {/* Hero */}
      <section className="bg-brand-primary text-white py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 text-sm font-semibold">
            <Building2 className="size-4" />
            <span>Built in Britain, for Britain</span>
          </div>
          <h1 className="font-heading text-5xl md:text-6xl font-bold tracking-tight mb-6">
            About Britestate
          </h1>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            We are building the future of UK property transactions — transparent,
            efficient, and accessible to everyone.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-neutral-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-heading text-3xl md:text-4xl font-bold text-brand-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-neutral-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-brand-primary-lighter text-brand-primary rounded-full px-3 py-1 text-sm font-semibold mb-4">
              Our Mission
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight mb-6">
              Making property transparent for everyone
            </h2>
          </div>
          <div className="space-y-4 text-neutral-700 leading-relaxed">
            <p>
              Britestate exists to make the UK property market fair and
              transparent for everyone. Whether you are buying your first home,
              renting a flat, managing a portfolio, or providing property
              services, our platform connects you with the tools, people, and
              information you need.
            </p>
            <p>
              We believe property transactions should not be stressful, opaque,
              or unnecessarily expensive. By bringing search, services, and
              transaction tracking into a single platform, we are removing the
              friction that has defined the UK property market for decades.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-brand-primary-lighter py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
              Our Values
            </h2>
            <p className="text-neutral-600 text-lg max-w-xl mx-auto">
              The principles that guide every decision we make.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {VALUES.map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.title}
                  className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="size-12 rounded-xl bg-brand-primary-lighter flex items-center justify-center text-brand-primary mb-5">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-neutral-900 mb-3">
                    {value.title}
                  </h3>
                  <p className="text-neutral-600 text-sm leading-relaxed">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
            Our Team
          </h2>
          <p className="text-neutral-600 text-lg max-w-2xl mx-auto">
            Britestate is built by a team of property industry veterans,
            technologists, and designers who share a passion for improving the
            UK property experience.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {TEAM_AREAS.map((area) => {
            const Icon = area.icon;
            return (
              <div
                key={area.title}
                className="bg-white rounded-2xl p-6 shadow-sm text-center hover:shadow-md transition-shadow"
              >
                <div className="size-14 rounded-2xl bg-brand-primary-lighter flex items-center justify-center text-brand-primary mx-auto mb-4">
                  <Icon className="size-7" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-neutral-900 mb-2">
                  {area.title}
                </h3>
                <p className="text-neutral-500 text-sm leading-relaxed">
                  {area.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-primary text-white py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Join the Britestate community
          </h2>
          <p className="text-white/80 text-lg mb-10">
            Whether you are buying, selling, renting, or providing services —
            there is a place for you on Britestate.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-xl bg-white text-brand-primary font-semibold text-base hover:bg-neutral-100 transition-colors shadow-md w-full sm:w-auto min-w-[180px]"
            >
              Get Started Free
            </Link>
            <Link
              href="/careers"
              className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-xl border-2 border-white/40 text-white font-semibold text-base hover:border-white/80 transition-colors w-full sm:w-auto min-w-[180px]"
            >
              Join Our Team
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
