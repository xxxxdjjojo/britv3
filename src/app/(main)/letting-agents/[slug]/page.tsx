import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
  ArrowLeft,
  Home,
  Users,
  Award,
} from "lucide-react";

type Params = { params: Promise<{ slug: string }> };

type AgentProfile = {
  id: string;
  slug: string;
  display_name: string;
  bio: string | null;
  user_id: string;
  agency?: {
    id?: string;
    name?: string;
    logo_url?: string;
  } | null;
  agency_name?: string | null;
  logo_url?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  coverage_areas?: string[] | null;
  areas_covered?: string[];
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("agent_agency_profiles")
    .select("display_name, agency->name")
    .eq("slug", slug)
    .single();

  if (!data) {
    return { title: "Letting Agent Not Found | Britestate" };
  }

  const name =
    (data as unknown as { name?: string }).name ?? data.display_name;

  return {
    title: `${name} Letting Agent | Britestate`,
    description: `View ${name}'s rental listings, reviews, and management services on Britestate.`,
  };
}

export default async function LettingAgentProfilePage({ params }: Params) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: agent } = await supabase
    .from("agent_agency_profiles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!agent) {
    notFound();
  }

  const profile = agent as unknown as AgentProfile;
  const agencyName =
    profile.agency?.name ??
    profile.agency_name ??
    profile.display_name;
  const logoUrl = profile.agency?.logo_url ?? profile.logo_url ?? null;
  const city = profile.city ?? null;
  const areasCovered =
    profile.coverage_areas ?? profile.areas_covered ?? [];

  // Fetch reviews
  const userId = profile.user_id ?? profile.id;
  const { data: reviewData } = await supabase
    .from("reviews")
    .select("overall_rating, review_text, created_at, reviewer:profiles!reviews_reviewer_id_fkey(full_name)")
    .eq("provider_id", userId)
    .eq("moderation_status", "approved")
    .order("created_at", { ascending: false })
    .limit(5);

  const reviews = reviewData ?? [];
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviews.length
      : null;

  return (
    <div className="min-h-screen bg-surface dark:bg-neutral-950">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/letting-agents"
          className="inline-flex items-center gap-2 text-sm text-brand-primary/60 hover:text-brand-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to letting agents
        </Link>

        {/* Hero section */}
        <div className="bg-surface-container-lowest dark:bg-neutral-900 rounded-2xl shadow-sm overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-brand-primary to-brand-primary-dark h-32 sm:h-40" />
          <div className="px-6 sm:px-10 pb-8 -mt-12 relative">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
              {/* Logo */}
              <div className="w-24 h-24 rounded-2xl bg-surface-container-lowest dark:bg-neutral-900 shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={agencyName}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-brand-primary/30">
                    {agencyName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0 pt-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-secondary/10 text-brand-secondary">
                    Lettings Specialist
                  </span>
                </div>
                <h1
                  className="font-heading text-2xl sm:text-3xl font-bold text-on-surface dark:text-white"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {agencyName}
                </h1>
                {city && (
                  <p className="flex items-center gap-1.5 text-sm text-[--color-on-surface-variant] dark:text-neutral-400 mt-1">
                    <MapPin className="h-4 w-4" />
                    {city}
                  </p>
                )}
                {avgRating !== null && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Star className="h-4 w-4 fill-brand-secondary text-brand-secondary" />
                    <span className="text-sm font-semibold text-on-surface dark:text-white">
                      {avgRating.toFixed(1)}
                    </span>
                    <span className="text-xs text-[--color-on-surface-variant]">
                      ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main content */}
          <div className="lg:col-span-8 space-y-8">
            {/* About */}
            <section className="bg-surface-container-lowest dark:bg-neutral-900 rounded-2xl p-6 sm:p-8 shadow-sm">
              <h2 className="font-heading text-xl font-bold text-on-surface dark:text-white mb-4">
                About {agencyName}
              </h2>
              <p className="text-[--color-on-surface-variant] dark:text-neutral-400 leading-relaxed">
                {profile.bio ??
                  `${agencyName} is a trusted letting agent on Britestate, specialising in residential lettings and property management${city ? ` in ${city}` : ""}.`}
              </p>
            </section>

            {/* Services */}
            <section className="bg-surface-container-lowest dark:bg-neutral-900 rounded-2xl p-6 sm:p-8 shadow-sm">
              <h2 className="font-heading text-xl font-bold text-on-surface dark:text-white mb-4">
                Letting Services
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    icon: <Home className="h-6 w-6" />,
                    title: "Full Management",
                    desc: "End-to-end property management including maintenance, rent collection, and tenant relations.",
                  },
                  {
                    icon: <Users className="h-6 w-6" />,
                    title: "Tenant Find",
                    desc: "Professional tenant sourcing with thorough referencing and right-to-rent checks.",
                  },
                  {
                    icon: <Award className="h-6 w-6" />,
                    title: "Rent Collection",
                    desc: "Reliable monthly rent collection with arrears management and financial reporting.",
                  },
                ].map((s) => (
                  <div
                    key={s.title}
                    className="bg-[--color-surface-container-low] dark:bg-neutral-950 rounded-xl p-5"
                  >
                    <div className="text-brand-primary mb-3">{s.icon}</div>
                    <h3 className="font-heading font-semibold text-on-surface dark:text-white text-sm mb-1">
                      {s.title}
                    </h3>
                    <p className="text-xs text-[--color-on-surface-variant] dark:text-neutral-400 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Areas covered */}
            {areasCovered.length > 0 && (
              <section className="bg-surface-container-lowest dark:bg-neutral-900 rounded-2xl p-6 sm:p-8 shadow-sm">
                <h2 className="font-heading text-xl font-bold text-on-surface dark:text-white mb-4">
                  Areas Covered
                </h2>
                <div className="flex flex-wrap gap-2">
                  {areasCovered.map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-brand-primary-lighter text-brand-primary"
                    >
                      <MapPin className="h-3 w-3 mr-1.5" />
                      {a}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            <section className="bg-surface-container-lowest dark:bg-neutral-900 rounded-2xl p-6 sm:p-8 shadow-sm">
              <h2 className="font-heading text-xl font-bold text-on-surface dark:text-white mb-4">
                Reviews
              </h2>
              {reviews.length === 0 ? (
                <p className="text-sm text-[--color-on-surface-variant] dark:text-neutral-400">
                  No reviews yet. Be the first to review {agencyName}.
                </p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review, idx) => {
                    const reviewer = review.reviewer as unknown as {
                      full_name?: string;
                    } | null;
                    return (
                      <div
                        key={idx}
                        className="bg-[--color-surface-container-low] dark:bg-neutral-950 rounded-xl p-5"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${
                                  i < review.overall_rating
                                    ? "fill-brand-secondary text-brand-secondary"
                                    : "text-neutral-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-[--color-on-surface-variant]">
                            {new Date(review.created_at).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-[--color-on-surface-variant] dark:text-neutral-400 leading-relaxed">
                          {review.review_text}
                        </p>
                        {reviewer?.full_name && (
                          <p className="text-xs text-[--color-on-surface-variant] mt-2">
                            -- {reviewer.full_name}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Contact card */}
            <div className="bg-surface-container-lowest dark:bg-neutral-900 rounded-2xl p-6 shadow-sm sticky top-24">
              <h3 className="font-heading font-bold text-on-surface dark:text-white mb-4">
                Contact {agencyName}
              </h3>

              <div className="space-y-3 mb-6">
                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="flex items-center gap-3 text-sm text-[--color-on-surface-variant] dark:text-neutral-400 hover:text-brand-primary transition-colors"
                  >
                    <Phone className="h-4 w-4 text-brand-primary/60" />
                    {profile.phone}
                  </a>
                )}
                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex items-center gap-3 text-sm text-[--color-on-surface-variant] dark:text-neutral-400 hover:text-brand-primary transition-colors"
                  >
                    <Mail className="h-4 w-4 text-brand-primary/60" />
                    {profile.email}
                  </a>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-[--color-on-surface-variant] dark:text-neutral-400 hover:text-brand-primary transition-colors"
                  >
                    <Globe className="h-4 w-4 text-brand-primary/60" />
                    Website
                  </a>
                )}
              </div>

              <Link
                href="/register"
                className="flex items-center justify-center w-full py-3 px-4 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 active:scale-95 transition-all min-h-[44px]"
              >
                Send Enquiry
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
