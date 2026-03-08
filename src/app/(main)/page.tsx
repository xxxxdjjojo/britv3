import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  ShieldCheck,
  HeadphonesIcon,
  Star,
  ArrowRight,
  Quote,
  Sparkles,
  Wrench,
  Zap,
  HardHat,
  Building2,
  Calculator,
  Ruler,
  MapPin,
  CheckCircle2,
  Key,
} from "lucide-react";
import { PropertyCardGrid } from "@/components/shared/PropertyCardGrid";

export const metadata: Metadata = {
  title: "Britestate | AI-Powered UK Property Platform",
  description:
    "Find your perfect British home, intelligently. Search over 25,000 homes powered by Britestate Intelligence.",
};

const FEATURED_PROPERTIES = [
  {
    id: 1,
    price: "£450,000",
    title: "Modern 2 Bed Flat",
    location: "Clifton, Bristol",
    beds: 2,
    baths: 2,
    rating: 4.8,
    match: 98,
    image: "/images/properties/property-1.jpg",
    alt: "Victorian terraced house exterior in Bristol",
  },
  {
    id: 2,
    price: "£850,000",
    title: "4 Bed Period Terrace",
    location: "Hackney, London",
    beds: 4,
    baths: 1,
    rating: 4.9,
    match: 95,
    image: "/images/properties/property-2.jpg",
    alt: "Luxury modern townhouse with garden in Hackney",
  },
  {
    id: 3,
    price: "£375,000",
    title: "Cotswold Stone Cottage",
    location: "Burford, Oxfordshire",
    beds: 3,
    baths: 2,
    rating: 4.7,
    match: 92,
    image: "/images/properties/property-3.jpg",
    alt: "Traditional stone cottage in the Cotswolds",
  },
  {
    id: 4,
    price: "£1,200,000",
    title: "5 Bed Family Home",
    location: "Hampstead, London",
    beds: 5,
    baths: 3,
    rating: 4.9,
    match: 90,
    image: "/images/properties/property-4.jpg",
    alt: "Spacious detached family home in Hampstead",
  },
] as const;

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Search,
    title: "Search & Discover",
    description:
      "Tell our AI what matters to you — schools, commute time, lifestyle. We surface the best-matched homes from 25,000+ verified listings across the UK.",
  },
  {
    step: "02",
    icon: MapPin,
    title: "Connect with Verified Pros",
    description:
      "Book viewings, instruct solicitors, and hire tradespeople through one platform. Every professional passes our rigorous 3-client + 3-peer verification.",
  },
  {
    step: "03",
    icon: Key,
    title: "Move In with Confidence",
    description:
      "Complete your transaction end-to-end on Britestate — from offer to keys. Secure deposits, digital contracts, and 24/7 support included.",
  },
] as const;

const SERVICE_CATEGORIES = [
  {
    icon: Wrench,
    title: "Plumbers",
    slug: "plumbers",
    count: 142,
    description: "Emergency repairs, installations, and maintenance.",
  },
  {
    icon: Zap,
    title: "Electricians",
    slug: "electricians",
    count: 98,
    description: "Rewiring, inspections, and smart home setups.",
  },
  {
    icon: HardHat,
    title: "Builders",
    slug: "builders",
    count: 210,
    description: "Renovations, extensions, and new builds.",
  },
  {
    icon: Building2,
    title: "Estate Agents",
    slug: "estate-agents",
    count: 354,
    description: "Local experts for buying, selling, and letting.",
  },
  {
    icon: Calculator,
    title: "Mortgage Brokers",
    slug: "mortgage-brokers",
    count: 156,
    description: "Find the best rates and tailored financial advice.",
  },
  {
    icon: Ruler,
    title: "Surveyors",
    slug: "surveyors",
    count: 87,
    description: "RICS valuations, homebuyer reports, and audits.",
  },
] as const;

const TESTIMONIALS = [
  {
    quote:
      "Britestate completely changed how we looked for a house. The AI suggestions were spot on, and we found a place we wouldn't have even considered otherwise.",
    author: "Sarah Jenkins",
    role: "First-time Buyer",
    avatar: "/images/testimonials/sarah.jpg",
  },
  {
    quote:
      "As a landlord managing multiple properties, the verified tenant feature and integrated contracts have saved me countless hours of administrative work.",
    author: "David Chen",
    role: "Local Landlord",
    avatarIcon: Building2,
  },
  {
    quote:
      "The best platform for finding consistent, high-quality jobs. The AI scheduling tool means I spend less time on the phone and more time working.",
    author: "Mike Ross",
    role: "Verified Plumber",
    avatarIcon: HardHat,
  },
] as const;

const BLOG_POSTS = [
  {
    title: "UK Property Market Forecast: What to Expect in 2026",
    excerpt:
      "As interest rates stabilise, we analyse the potential growth areas and investment opportunities across major UK cities for the upcoming year.",
    category: "Market Trends",
    date: "February 28, 2026",
    image: "/images/blog/blog-1.jpg",
    alt: "Modern living room with green plants and natural light",
    href: "/blog/uk-property-market-forecast-2026",
  },
  {
    title: "First-Time Buyer's Checklist: From Viewing to Keys",
    excerpt:
      "Navigating your first property purchase can be daunting. Our comprehensive guide breaks down every step of the process to ensure a smooth transaction.",
    category: "Buying Guide",
    date: "February 18, 2026",
    image: "/images/blog/blog-2.jpg",
    alt: "Couple looking at house renovation plans",
    href: "/blog/first-time-buyer-checklist",
  },
  {
    title: "Eco-Friendly Upgrades That Add Value to Your Home",
    excerpt:
      "Discover which sustainable improvements offer the best return on investment while lowering your carbon footprint and energy bills.",
    category: "Sustainability",
    date: "February 12, 2026",
    image: "/images/blog/blog-3.jpg",
    alt: "Sustainable home with solar panels on roof",
    href: "/blog/eco-friendly-upgrades",
  },
] as const;

export default function HomePage() {
  return (
    <>
      {/* ── 1. Hero ── */}
      <section>
        <div className="p-4 lg:p-6">
          <div className="relative flex min-h-[100svh] flex-col gap-8 items-center justify-center rounded-2xl overflow-hidden p-8 text-center shadow-sm">
            <Image
              src="/images/hero/hero-bg.jpg"
              alt="Modern British home interior with large windows and natural light"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />

            <div className="relative z-10 flex flex-col items-center gap-6 max-w-4xl mx-auto w-full">
              <div className="flex flex-col gap-3">
                <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-[-0.02em] drop-shadow-md font-heading">
                  Find your perfect British home,
                  <br className="hidden sm:block" /> intelligently.
                </h1>
                <p className="text-gray-100 text-base sm:text-lg font-medium leading-normal drop-shadow-md opacity-90">
                  Search over 25,000 homes powered by Britestate Intelligence.
                </p>
              </div>

              <div className="w-full max-w-[640px] mt-4">
                {/* Fix 3: Buy / Rent / Services Tabs → Links */}
                <div className="flex justify-center mb-4 gap-1 p-1 bg-white/20 backdrop-blur-md rounded-lg w-fit mx-auto">
                  <Link
                    href="/search?type=buy"
                    className="px-6 py-2 bg-white text-brand-primary text-sm font-bold rounded-md shadow-sm"
                  >
                    Buy
                  </Link>
                  <Link
                    href="/search?type=rent"
                    className="px-6 py-2 text-white hover:bg-white/10 text-sm font-medium rounded-md transition-colors"
                  >
                    Rent
                  </Link>
                  <Link
                    href="/search?type=find-services"
                    className="px-6 py-2 text-white hover:bg-white/10 text-sm font-medium rounded-md transition-colors"
                  >
                    Find Services
                  </Link>
                </div>

                {/* Fix 1: Search bar → Link container */}
                <Link
                  href="/search"
                  className="flex w-full items-stretch rounded-xl h-14 sm:h-16 bg-white shadow-xl ring-4 ring-black/5 hover:ring-brand-primary/20 transition-shadow cursor-text"
                  aria-label="Search properties"
                >
                  <div className="text-neutral-400 flex items-center justify-center pl-5 pr-3 rounded-l-xl">
                    <Search className="size-5" />
                  </div>
                  <span className="flex w-full min-w-0 flex-1 items-center text-neutral-400 text-base font-normal h-full px-2">
                    Search by school, commute, or lifestyle...
                  </span>
                  <div className="flex items-center justify-center pr-2 rounded-r-xl">
                    <span className="flex items-center gap-2 h-10 sm:h-12 px-5 sm:px-6 bg-brand-primary hover:bg-brand-primary-light text-white text-sm sm:text-base font-bold rounded-lg transition-transform active:scale-95 shadow-md">
                      <Sparkles className="size-[18px]" />
                      <span className="hidden sm:inline">Ask AI</span>
                    </span>
                  </div>
                </Link>

                {/* Trust Bar */}
                <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-white/90 text-sm font-semibold drop-shadow-sm">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 shrink-0" />
                    <span>25,000+ Properties</span>
                  </div>
                  {/* Fix 7: aria-hidden on separator spans */}
                  <span className="hidden sm:inline text-white/40" aria-hidden="true">•</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>5,000+ Verified Pros</span>
                  </div>
                  <span className="hidden sm:inline text-white/40" aria-hidden="true">•</span>
                  <div className="flex items-center gap-2">
                    <HeadphonesIcon className="size-4 shrink-0" />
                    <span>Trusted by 50,000 Users</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Featured Properties ── */}
      <section className="px-6 py-16 lg:py-24 max-w-7xl mx-auto">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-neutral-900 text-3xl lg:text-4xl font-bold leading-tight tracking-tight font-heading">
                Featured Properties
              </h2>
              <p className="text-neutral-500 mt-2 text-lg">
                Curated selections from across the UK.
              </p>
            </div>
            {/* Fix 3: For Sale / To Rent / New Builds Tabs → Links */}
            <div className="flex bg-neutral-100 p-1 rounded-lg">
              <Link
                href="/search?status=for-sale"
                className="px-4 py-1.5 bg-white text-brand-primary shadow-sm rounded-md text-sm font-semibold"
              >
                For Sale
              </Link>
              <Link
                href="/search?status=to-rent"
                className="px-4 py-1.5 text-neutral-500 hover:text-brand-primary transition-colors text-sm font-medium"
              >
                To Rent
              </Link>
              <Link
                href="/search?status=new-builds"
                className="px-4 py-1.5 text-neutral-500 hover:text-brand-primary transition-colors text-sm font-medium"
              >
                New Builds
              </Link>
            </div>
          </div>

          <PropertyCardGrid properties={FEATURED_PROPERTIES} />

          <div className="flex justify-center pt-2">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 text-brand-primary font-semibold hover:underline"
            >
              View all properties <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. How It Works ── */}
      <section className="bg-brand-primary-lighter py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-neutral-900 text-3xl lg:text-4xl font-bold leading-tight tracking-tight font-heading">
              How It Works
            </h2>
            <p className="text-neutral-600 mt-3 text-lg max-w-2xl mx-auto">
              From first search to moving day — Britestate guides you every step
              of the way.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
            {/* Connector line on desktop */}
            <div
              className="hidden md:block absolute top-10 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px bg-brand-primary/20"
              aria-hidden="true"
            />

            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                className="flex flex-col items-center text-center gap-5 relative"
              >
                <div className="relative">
                  <div className="size-20 rounded-full bg-white shadow-md flex items-center justify-center text-brand-primary border border-brand-primary/10">
                    <item.icon className="size-8" />
                  </div>
                  <span className="absolute -top-2 -right-2 size-7 rounded-full bg-brand-primary text-white text-xs font-bold flex items-center justify-center shadow">
                    {item.step}
                  </span>
                </div>
                <div>
                  <h3 className="text-neutral-900 text-xl font-bold mb-2 font-heading">
                    {item.title}
                  </h3>
                  <p className="text-neutral-600 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Find Services ── */}
      <section className="px-6 py-16 lg:py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-neutral-900 text-3xl lg:text-4xl font-bold leading-tight tracking-tight font-heading">
                Trusted professionals, verified by us
              </h2>
              <p className="text-neutral-500 mt-3 text-lg">
                Every professional on Britestate passes our 3-client + 3-peer
                verification process.
              </p>
            </div>
            <Link
              href="/services"
              className="text-brand-primary font-medium hover:underline flex items-center gap-1 shrink-0"
            >
              Browse all services <ArrowRight className="size-4" />
            </Link>
          </div>

          {/* Fix 2: Service cards → Link, dead button removed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICE_CATEGORIES.map((service) => (
              <Link
                key={service.title}
                href={`/services/${service.slug}`}
                className="group flex flex-col justify-between gap-6 p-6 rounded-2xl bg-brand-primary-lighter transition-all hover:-translate-y-1 hover:shadow-lg h-full"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-white/60 rounded-xl backdrop-blur-sm text-brand-primary shadow-sm">
                      <service.icon className="size-6" />
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/60 text-xs font-semibold text-brand-primary backdrop-blur-sm">
                      <ShieldCheck className="size-3.5" />
                      {service.count} verified pros
                    </span>
                  </div>
                  <h3 className="text-brand-primary text-xl font-bold mb-2 font-heading">
                    {service.title}
                  </h3>
                  <p className="text-brand-primary/80 text-sm leading-relaxed">
                    {service.description}
                  </p>
                </div>
                <span className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-white text-brand-primary font-bold text-sm shadow-sm group-hover:bg-brand-primary group-hover:text-white transition-all mt-auto">
                  <Sparkles className="size-[18px]" />
                  Book with AI
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Trust & Verification ── */}
      <section className="bg-brand-primary text-white py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-6 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1 mb-6 text-sm font-semibold">
            <ShieldCheck className="size-4" />
            <span>Bank-grade Security</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-6 leading-tight max-w-3xl font-heading">
            Trusted by thousands of home movers across the UK
          </h2>
          <p className="text-brand-primary-lighter text-lg mb-10 leading-relaxed opacity-90 max-w-2xl">
            We&apos;ve helped over 50,000 people find their dream home, saving
            them an average of &pound;2,400 in fees and 3 weeks of searching
            time. Every listing is verified, every professional is vetted, and
            every transaction is protected.
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 border-t border-white/10 pt-10 w-full max-w-4xl">
            <div className="flex flex-col items-center">
              <span className="text-4xl font-bold font-heading">50k+</span>
              <span className="text-sm opacity-80 mt-1">Moves Completed</span>
            </div>
            <div className="hidden md:block w-px bg-white/20 h-12" />
            <div className="flex flex-col items-center">
              <span className="text-4xl font-bold font-heading">
                &pound;1.2B
              </span>
              <span className="text-sm opacity-80 mt-1">Property Value</span>
            </div>
            <div className="hidden md:block w-px bg-white/20 h-12" />
            <div className="flex flex-col items-center">
              <span className="text-4xl font-bold font-heading">4.9/5</span>
              <span className="text-sm opacity-80 mt-1">User Rating</span>
            </div>
            <div className="hidden md:block w-px bg-white/20 h-12" />
            <div className="flex flex-col items-center">
              <span className="text-4xl font-bold font-heading">5,000+</span>
              <span className="text-sm opacity-80 mt-1">Verified Pros</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Testimonials ── */}
      {/* Fix 4: Removed dead carousel controls and pagination dots; display as 3-column grid */}
      <section className="bg-neutral-50 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="mb-12">
            <h2 className="text-neutral-900 text-3xl lg:text-4xl font-bold mb-3 font-heading">
              Community Stories
            </h2>
            <p className="text-neutral-500 text-lg">
              See how Britestate is changing the property market.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {TESTIMONIALS.map((testimonial) => (
              <div
                key={testimonial.author}
                className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100 flex flex-col h-full relative group hover:shadow-md transition-shadow"
              >
                <div className="absolute top-8 right-8 text-neutral-100 group-hover:text-brand-primary/10 transition-colors">
                  <Quote className="size-16" />
                </div>
                <div className="flex gap-1 mb-6 text-brand-secondary">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <blockquote className="text-brand-primary text-lg font-medium leading-relaxed mb-8 relative z-10 flex-grow">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-4 mt-auto">
                  {"avatar" in testimonial ? (
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.author}
                      width={48}
                      height={48}
                      className="size-12 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="size-12 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                      {testimonial.avatarIcon && (
                        <testimonial.avatarIcon className="size-6" />
                      )}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-neutral-900">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-neutral-500">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. Latest from Blog ── */}
      {/* Fix 5: cursor-pointer moved to Link, removed from article */}
      <section className="bg-white py-20 border-t border-neutral-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-neutral-900 text-3xl lg:text-4xl font-bold mb-4 font-heading">
                Latest from the Blog
              </h2>
              <p className="text-neutral-500 text-lg max-w-xl">
                Insights, trends, and expert advice for the modern homeowner.
              </p>
            </div>
            <Link
              href="/blog"
              className="text-brand-primary font-medium hover:underline flex items-center gap-1 shrink-0"
            >
              Read more on our blog <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {BLOG_POSTS.map((post) => (
              <article
                key={post.title}
                className="flex flex-col group bg-white rounded-2xl shadow-sm border border-neutral-100 hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <Link href={post.href} className="block cursor-pointer">
                  <div className="relative w-full aspect-[16/9] overflow-hidden bg-neutral-200">
                    <Image
                      src={post.image}
                      alt={post.alt}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-brand-primary uppercase tracking-wider shadow-sm">
                      {post.category}
                    </div>
                  </div>
                  <div className="flex flex-col flex-1 p-5">
                    <span className="text-sm text-neutral-400 mb-2">
                      {post.date}
                    </span>
                    <h3 className="text-xl font-bold text-neutral-900 mb-3 font-heading leading-snug group-hover:text-brand-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-neutral-500 text-sm leading-relaxed mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="mt-auto pt-2 flex items-center text-brand-primary font-semibold text-sm">
                      Read Article
                      <ArrowRight className="size-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. CTA Banner ── */}
      {/* Fix 6: CTA buttons → Link styled with buttonVariants */}
      <section className="bg-brand-primary-lighter py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            <h2 className="text-neutral-900 text-4xl lg:text-5xl font-bold mb-6 font-heading tracking-tight">
              Ready to get started?
            </h2>
            <p className="text-neutral-600 text-lg mb-10 leading-relaxed">
              Join thousands of homeowners and professionals on the UK&apos;s
              most intelligent property platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
              <Link
                href="/register?role=seller"
                className="inline-flex items-center justify-center w-full sm:w-auto min-w-[200px] h-14 px-8 rounded-xl shadow-lg bg-brand-primary text-white text-base font-semibold hover:bg-brand-primary-light transition-colors"
              >
                List Your Property
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center w-full sm:w-auto min-w-[200px] h-14 px-8 rounded-xl border-2 border-brand-primary text-brand-primary text-base font-semibold hover:bg-brand-primary/10 transition-colors"
              >
                Find a Professional
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
