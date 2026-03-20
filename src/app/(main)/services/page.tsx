import type { Metadata } from "next";
import Link from "next/link";
import {
  Wrench,
  Building2,
  Landmark,
  Scale,
  ClipboardCheck,
  Ruler,
  Droplets,
  Zap,
  HardHat,
  Paintbrush,
  Sparkles,
  Trees,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Find Trusted Professionals | Services",
  description:
    "Browse all property professionals on Britestate — tradespeople, estate agents, mortgage brokers, conveyancers, surveyors and more.",
};

type ServiceCategory = {
  label: string;
  href: string;
  icon: React.ComponentType<Readonly<{ className?: string }>>;
  description: string;
};

const mainCategories: ServiceCategory[] = [
  {
    label: "Tradespeople",
    href: "/services/tradespeople",
    icon: Wrench,
    description: "Local tradespeople for any home job",
  },
  {
    label: "Estate Agents",
    href: "/agents",
    icon: Building2,
    description: "Sell or let your property with a trusted agent",
  },
  {
    label: "Mortgage Brokers",
    href: "/services/mortgage-brokers",
    icon: Landmark,
    description: "Get the best mortgage deal for your situation",
  },
  {
    label: "Conveyancers",
    href: "/services/conveyancers",
    icon: Scale,
    description: "Legal experts to guide your property transaction",
  },
  {
    label: "Surveyors",
    href: "/services/surveyors",
    icon: ClipboardCheck,
    description: "Structural and valuation surveys you can trust",
  },
  {
    label: "Architects",
    href: "/services/architects",
    icon: Ruler,
    description: "Design and planning experts for your project",
  },
];

const tradeSubCategories: ServiceCategory[] = [
  {
    label: "Plumbers",
    href: "/services/tradespeople?category=plumber",
    icon: Droplets,
    description: "Pipes, boilers, and bathroom fitting",
  },
  {
    label: "Electricians",
    href: "/services/tradespeople?category=electrician",
    icon: Zap,
    description: "Safe, certified electrical work",
  },
  {
    label: "Builders",
    href: "/services/tradespeople?category=builder",
    icon: HardHat,
    description: "Extensions, renovations and groundwork",
  },
  {
    label: "Painters",
    href: "/services/tradespeople?category=painter",
    icon: Paintbrush,
    description: "Interior and exterior decorating",
  },
  {
    label: "Cleaners",
    href: "/services/tradespeople?category=cleaning",
    icon: Sparkles,
    description: "End-of-tenancy and deep cleaning",
  },
  {
    label: "Landscapers",
    href: "/services/tradespeople?category=landscaping",
    icon: Trees,
    description: "Gardens, driveways and outdoor spaces",
  },
];

function CategoryCard({ category }: Readonly<{ category: ServiceCategory }>) {
  const Icon = category.icon;
  return (
    <Link
      href={category.href}
      className="group bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4 hover:shadow-md hover:border-[#1B4D3E]/30 transition-all"
    >
      <div className="w-12 h-12 rounded-xl bg-[#1B4D3E]/8 flex items-center justify-center group-hover:bg-[#1B4D3E]/15 transition-colors">
        <Icon className="w-6 h-6 text-[#1B4D3E] group-hover:scale-110 transition-transform" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{category.label}</h3>
        <p className="text-sm text-gray-500 leading-snug">
          {category.description}
        </p>
      </div>
    </Link>
  );
}

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1B4D3E] to-[#2563EB] text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Find Trusted Professionals
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
            Connect with vetted tradespeople, agents, brokers and specialists
            for every step of your property journey.
          </p>
        </div>
      </section>

      {/* Main categories */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Browse by profession
        </h2>
        <p className="text-gray-500 mb-8">
          All the specialists you need, in one place.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {mainCategories.map((cat) => (
            <CategoryCard key={cat.href} category={cat} />
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <hr className="border-gray-200" />
      </div>

      {/* Tradesperson sub-categories */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-900">
            Popular trades
          </h2>
          <Link
            href="/services/tradespeople"
            className="text-sm font-semibold text-[#2563EB] hover:underline"
          >
            View all trades
          </Link>
        </div>
        <p className="text-gray-500 mb-8">
          Find specialists for any home improvement or maintenance job.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tradeSubCategories.map((cat) => (
            <CategoryCard key={cat.href} category={cat} />
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="bg-gradient-to-r from-[#1B4D3E] to-[#2563EB] rounded-2xl p-10 text-center text-white">
          <h2 className="text-3xl font-bold mb-3">Post a Job — Get Free Quotes</h2>
          <p className="text-white/80 text-lg mb-6">
            Describe your project once and receive quotes from verified
            professionals near you.
          </p>
          <Link
            href="/post-a-job"
            className="inline-block px-8 py-3 bg-white text-[#1B4D3E] font-semibold rounded-xl hover:bg-gray-100 transition-colors"
          >
            Post a Job Free
          </Link>
        </div>
      </section>
    </div>
  );
}
