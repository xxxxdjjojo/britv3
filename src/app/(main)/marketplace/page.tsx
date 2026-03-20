import type { Metadata } from "next";
import {
  Wrench,
  Zap,
  Building2,
  Paintbrush,
  Hammer,
  Trees,
  SprayCan,
  Home,
  BriefcaseBusiness,
  Scale,
  Ruler,
  FileText,
  Star,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Find Service Providers",
  description:
    "Browse verified tradespeople, estate agents, mortgage brokers, conveyancers and surveyors across the UK.",
};

type CategoryCard = {
  slug: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
};

const CATEGORIES: CategoryCard[] = [
  { slug: "plumbers", label: "Plumbers", icon: Wrench, href: "/services/tradespeople?category=plumber" },
  { slug: "electricians", label: "Electricians", icon: Zap, href: "/services/tradespeople?category=electrician" },
  { slug: "builders", label: "Builders", icon: Building2, href: "/services/tradespeople?category=builder" },
  { slug: "plasterers", label: "Plasterers", icon: Paintbrush, href: "/services/tradespeople?category=plasterer" },
  { slug: "painters", label: "Painters", icon: SprayCan, href: "/services/tradespeople?category=painter" },
  { slug: "carpenters", label: "Carpenters", icon: Hammer, href: "/services/tradespeople?category=carpenter" },
  { slug: "landscapers", label: "Landscapers", icon: Trees, href: "/services/tradespeople?category=landscaping" },
  { slug: "cleaners", label: "Cleaners", icon: Home, href: "/services/tradespeople?category=cleaning" },
  { slug: "estate-agents", label: "Estate Agents", icon: BriefcaseBusiness, href: "/agents" },
  { slug: "mortgage-brokers", label: "Mortgage Brokers", icon: FileText, href: "/services/mortgage-brokers" },
  { slug: "conveyancers", label: "Conveyancers", icon: Scale, href: "/services/conveyancers" },
  { slug: "surveyors", label: "Surveyors", icon: Ruler, href: "/services/surveyors" },
];

export default async function MarketplaceLandingPage() {
  const supabase = await createClient();

  const { data: featuredRaw } = await supabase
    .from("provider_rating_stats")
    .select(
      "provider_id, average_rating, total_reviews, service_provider_details!inner(id, slug, business_name, services, city, profiles!inner(avatar_url, full_name, provider_verification_status))",
    )
    .order("average_rating", { ascending: false })
    .gt("total_reviews", 5)
    .limit(6);

  const featured = (featuredRaw ?? []) as unknown as Array<{
    provider_id: string;
    average_rating: number;
    total_reviews: number;
    service_provider_details: {
      id: string;
      slug: string;
      business_name: string;
      services: string[];
      city: string | null;
      profiles: {
        avatar_url: string | null;
        full_name: string | null;
        provider_verification_status: string | null;
      };
    };
  }>;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1B4D3E] to-[#2563EB] text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight">
            Find Trusted Professionals Near You
          </h1>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Connect with verified tradespeople, estate agents, mortgage brokers,
            conveyancers and surveyors across the UK.
          </p>
          {/* Search form — plain HTML, works without JS */}
          <form
            action="/services"
            method="get"
            className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto"
          >
            <input
              type="text"
              name="q"
              placeholder="Search plumbers, electricians..."
              className="flex-1 px-4 py-3 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-white text-[#2563EB] font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-5">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap justify-center gap-8 text-center">
          {[
            "10,000+ Verified Pros",
            "50,000+ Reviews",
            "£1,000 Satisfaction Guarantee",
          ].map((stat) => (
            <span
              key={stat}
              className="text-sm font-semibold text-slate-600 dark:text-slate-300"
            >
              {stat}
            </span>
          ))}
        </div>
      </section>

      {/* Category grid */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
          Browse by Service
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {CATEGORIES.map(({ slug, label, icon: Icon, href }) => (
            <a
              key={slug}
              href={href}
              className="group flex flex-col items-center p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#2563EB] hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-3 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                <Icon className="w-6 h-6 text-[#2563EB]" />
              </div>
              <span className="font-semibold text-slate-900 dark:text-white text-sm text-center">
                {label}
              </span>
              <span className="text-xs text-slate-500 mt-1 text-center">
                Verified professionals
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Featured providers */}
      {featured.length > 0 && (
        <section className="bg-slate-50 dark:bg-slate-900/50 py-16">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
              Top Rated Providers This Week
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((item) => {
                const p = item.service_provider_details;
                const profile = p.profiles;
                return (
                  <a
                    key={item.provider_id}
                    href={`/services/${p.slug}`}
                    className="flex items-start gap-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-[#2563EB] hover:shadow-md transition-all"
                  >
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.full_name ?? p.business_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-bold text-slate-400">
                          {(profile.full_name ?? p.business_name).charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                          {profile.full_name ?? p.business_name}
                        </h3>
                        {profile.provider_verification_status === "verified" && (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {p.business_name}
                      </p>
                      {/* Rating */}
                      <div className="flex items-center gap-1 mt-1.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {item.average_rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-slate-400">
                          ({item.total_reviews})
                        </span>
                      </div>
                      {p.city && (
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-500">{p.city}</span>
                        </div>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Post a Job CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-0 pt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Need a tradesperson?</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-5 text-sm">Post your job for free and get quotes from up to 5 verified professionals.</p>
            <a href="/post-a-job" className="inline-block px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1D4ED8] transition-colors">
              Post a Job — It&apos;s Free
            </a>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Are you a tradesperson?</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-5 text-sm">Browse jobs posted by homeowners in your area and send quotes directly.</p>
            <a href="/dashboard/service_provider/jobs" className="inline-block px-6 py-3 bg-[#1B4D3E] text-white font-semibold rounded-lg hover:bg-[#163D30] transition-colors">
              Browse Available Jobs
            </a>
          </div>
        </div>
      </section>

      {/* For professionals CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-[#1B4D3E] to-[#2563EB] rounded-2xl p-10 text-center text-white">
          <h2 className="text-3xl font-bold mb-3">Are you a professional?</h2>
          <p className="text-white/80 mb-7 max-w-xl mx-auto">
            Join 10,000+ verified providers on Britestate and grow your
            business with quality leads.
          </p>
          <a
            href="/dashboard/provider"
            className="inline-block px-8 py-3.5 bg-white text-[#2563EB] font-semibold rounded-lg hover:bg-slate-50 transition-colors"
          >
            List Your Business
          </a>
        </div>
      </section>
    </div>
  );
}
