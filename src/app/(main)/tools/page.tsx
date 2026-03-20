import type { Metadata } from "next";
import Link from "next/link";
import {
  Calculator,
  Home,
  TrendingUp,
  Zap,
  Scale,
  PiggyBank,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Star,
  ArrowRightLeft,
  Truck,
  GraduationCap,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Property Tools & Calculators",
  description:
    "Free UK property calculators. Calculate mortgage repayments, stamp duty, rental yield, affordability, energy bills, and whether to buy or rent. Trusted by 50,000+ homebuyers.",
  openGraph: {
    title: "Property Tools & Calculators",
    description:
      "Free UK property calculators. Mortgage, stamp duty, rental yield, affordability and more.",
    type: "website",
  },
};

type Tool = {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: string;
  color: string;
  stat: string;
  statLabel: string;
};

const TOOLS: Tool[] = [
  {
    href: "/tools/mortgage-calculator",
    icon: Calculator,
    title: "Mortgage Repayment Calculator",
    description:
      "Calculate your monthly mortgage repayments based on property price, deposit, and interest rate. Save your parameters to see personalised estimates on listing cards.",
    badge: "Most Popular",
    color: "bg-brand-primary/10 text-brand-primary",
    stat: "£1,751",
    statLabel: "Example monthly payment",
  },
  {
    href: "/tools/affordability-calculator",
    icon: PiggyBank,
    title: "Mortgage Affordability Calculator",
    description:
      "Find out how much you can borrow based on your income, outgoings, and deposit. Get an instant estimate of your maximum property budget.",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    stat: "4.5×",
    statLabel: "Average income multiplier",
  },
  {
    href: "/tools/stamp-duty-calculator",
    icon: Home,
    title: "Stamp Duty (SDLT) Calculator",
    description:
      "Calculate your Stamp Duty Land Tax instantly. Supports first-time buyers, standard buyers, and additional property surcharge with a full band-by-band breakdown.",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    stat: "£2,500",
    statLabel: "Average SDLT on £300k",
  },
  {
    href: "/tools/rental-yield-calculator",
    icon: TrendingUp,
    title: "Rental Yield & ROI Calculator",
    description:
      "Calculate gross and net rental yields for buy-to-let investments. Include management fees, maintenance, and insurance to see your true return on investment.",
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    stat: "5.2%",
    statLabel: "Average UK rental yield",
  },
  {
    href: "/tools/buy-vs-rent-calculator",
    icon: Scale,
    title: "Buy vs. Rent Comparison",
    description:
      "Should you buy or keep renting? Model 30 years of costs, equity growth, and investment returns to find the break-even point for your specific situation.",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    stat: "7 yrs",
    statLabel: "Typical break-even point",
  },
  {
    href: "/tools/energy-bill-estimator",
    icon: Zap,
    title: "Energy Bill & EPC Estimator",
    description:
      "Estimate monthly energy costs for any property type and EPC rating. See how much you could save by improving your energy efficiency rating.",
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    stat: "£145",
    statLabel: "Average monthly energy bill",
  },
  {
    href: "/tools/mortgage-comparison",
    icon: BarChart3,
    title: "Mortgage Comparison",
    description:
      "Compare illustrative mortgage products from major UK lenders side by side. See how property price, deposit, and term affect your monthly payments across different rates and LTV bands.",
    color:
      "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    stat: "10+",
    statLabel: "Products compared",
  },
  {
    href: "/tools/remortgage-calculator",
    icon: ArrowRightLeft,
    title: "Remortgage Calculator",
    description:
      "Find out how much you could save by switching your mortgage deal. Compare your current repayments against a new rate and term to see monthly savings and total interest saved.",
    color:
      "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    stat: "£187",
    statLabel: "Average monthly saving",
  },
  {
    href: "/tools/moving-cost-estimator",
    icon: Truck,
    title: "Moving Cost Estimator",
    description:
      "Get a complete breakdown of the costs involved in buying and moving home — stamp duty, solicitor fees, surveys, removals, and EPC. Supports England, Wales, Scotland, and Northern Ireland.",
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    stat: "£5,000",
    statLabel: "Typical additional costs",
  },
  {
    href: "/tools/first-time-buyer-guide",
    icon: GraduationCap,
    title: "First-Time Buyer Guide",
    description:
      "Everything you need to know about buying your first home in the UK — eligibility, Help to Buy ISA, Lifetime ISA, Shared Ownership, and Right to Buy. Includes an affordability checker.",
    badge: "Guide",
    color:
      "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    stat: "5",
    statLabel: "Government schemes covered",
  },
];

const STATS = [
  { value: "50,000+", label: "Monthly Users" },
  { value: "£0", label: "Completely Free" },
  { value: "10", label: "Property Tools" },
  { value: "4.9★", label: "User Rating" },
];

export default function ToolsHubPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Hero */}
      <section className="relative overflow-hidden bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(27,77,62,0.08),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="mb-8 flex items-center gap-2 text-sm text-neutral-500"
          >
            <Link href="/" className="hover:text-brand-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="size-3.5" />
            <span className="font-medium text-neutral-900 dark:text-white">
              Property Tools
            </span>
          </nav>

          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/5 px-3 py-1 text-xs font-semibold text-brand-primary">
              <ShieldCheck className="size-3.5" />
              100% Free — No Account Required
            </div>
            <h1 className="mb-6 font-heading text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white md:text-5xl lg:text-6xl">
              Property Calculators &amp;{" "}
              <span className="text-brand-primary">Financial Tools</span>
            </h1>
            <p className="mb-8 max-w-2xl text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
              Make confident property decisions with our suite of free UK property
              calculators. From mortgage repayments to rental yield — everything
              you need in one place.
            </p>

            {/* Stats Bar */}
            <div className="flex flex-wrap gap-8">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-neutral-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold text-neutral-900 dark:text-white">
              All Calculators
            </h2>
            <p className="mt-1 text-neutral-500">
              Powered by official UK government data and rates
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="group relative flex flex-col rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-brand-primary/30 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-brand-primary/40"
              >
                {tool.badge && (
                  <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-brand-secondary/10 px-2.5 py-0.5 text-[11px] font-bold text-brand-secondary">
                    <Star className="size-3 fill-current" />
                    {tool.badge}
                  </div>
                )}

                <div
                  className={`mb-5 flex size-12 items-center justify-center rounded-xl ${tool.color}`}
                >
                  <Icon className="size-6" />
                </div>

                <h3 className="mb-2 font-heading text-lg font-bold text-neutral-900 group-hover:text-brand-primary dark:text-white">
                  {tool.title}
                </h3>
                <p className="mb-6 flex-1 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                  {tool.description}
                </p>

                {/* Stat */}
                <div className="mb-6 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800/50">
                  <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {tool.stat}
                  </div>
                  <div className="text-xs text-neutral-500">{tool.statLabel}</div>
                </div>

                <div className="flex items-center gap-1.5 text-sm font-semibold text-brand-primary">
                  Open Calculator
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Trust Section */}
      <section className="border-y border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/5 px-3 py-1 text-xs font-semibold text-brand-primary">
                <ShieldCheck className="size-3.5" />
                Why Trust Our Calculators?
              </div>
              <h2 className="mb-6 font-heading text-3xl font-bold text-neutral-900 dark:text-white">
                Accurate figures based on official UK data
              </h2>
              <div className="space-y-4">
                {[
                  {
                    title: "Government-verified rates",
                    desc: "SDLT thresholds and rates sourced directly from HMRC. Updated with every Autumn Statement.",
                  },
                  {
                    title: "Bank of England data",
                    desc: "Mortgage rate assumptions reflect current BoE base rate and average lender spreads.",
                  },
                  {
                    title: "Ofgem-backed energy estimates",
                    desc: "Energy cost figures use Ofgem Price Cap data and average UK household consumption patterns.",
                  },
                  {
                    title: "No data stored, ever",
                    desc: "All calculations happen in your browser. We never store or share your financial information.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white">
                      <svg
                        viewBox="0 0 12 12"
                        className="size-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="2,6 5,9 10,3" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {item.title}
                      </div>
                      <div className="text-sm text-neutral-500">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Card */}
            <div className="rounded-2xl bg-brand-primary p-10 text-white shadow-xl shadow-brand-primary/20">
              <h3 className="mb-3 font-heading text-2xl font-bold">
                Ready to take the next step?
              </h3>
              <p className="mb-8 text-brand-primary-lighter leading-relaxed">
                Connect with FCA-regulated mortgage brokers, verified estate
                agents, and qualified tradespeople on Britestate.
              </p>
              <div className="space-y-3">
                <Button
                  asChild
                  className="w-full justify-center bg-white py-3 font-bold text-brand-primary hover:bg-neutral-100"
                  variant="secondary"
                >
                  <Link href="/marketplace">Find a Mortgage Broker</Link>
                </Button>
                <Button
                  asChild
                  className="w-full justify-center border-white/30 py-3 font-bold text-white hover:bg-white/10"
                  variant="outline"
                >
                  <Link href="/search">Browse Properties</Link>
                </Button>
              </div>
              <p className="mt-6 text-center text-xs text-brand-primary-lighter">
                Free to use · No commitment · FCA regulated partners
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-10 text-center font-heading text-2xl font-bold text-neutral-900 dark:text-white">
          Frequently Asked Questions
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[
            {
              q: "Are these calculators free to use?",
              a: "Yes, completely free. No account needed, no hidden charges. All calculations run locally in your browser.",
            },
            {
              q: "How accurate are the results?",
              a: "Our calculators use official UK government rates and typical lender assumptions. Results are estimates — always get advice from a qualified professional before making financial decisions.",
            },
            {
              q: "Do you store my financial data?",
              a: "No. All calculations happen in your browser. The only data we optionally save is your mortgage parameters (deposit, rate, term) to personalise listing cards — and only if you click 'Save Parameters'.",
            },
            {
              q: "Which regions do the calculators cover?",
              a: "Mortgage and yield calculators apply UK-wide. The SDLT calculator covers England and Northern Ireland (different rates apply in Scotland and Wales). The energy calculator uses England & Wales Ofgem Price Cap data.",
            },
          ].map((item) => (
            <div
              key={item.q}
              className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <h3 className="mb-2 text-sm font-bold text-neutral-900 dark:text-white">
                {item.q}
              </h3>
              <p className="text-sm leading-relaxed text-neutral-500">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <div className="border-t border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-neutral-400">
            All figures provided are estimates only and do not constitute
            financial advice. Britestate is not authorised to provide regulated
            financial advice. Always seek guidance from a qualified, FCA-regulated
            professional before making property or mortgage decisions. Your home
            may be repossessed if you do not keep up repayments on your mortgage.
          </p>
        </div>
      </div>
    </div>
  );
}
