import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Britestate Blog | Property Advice & Insights",
  description:
    "Expert guidance for every stage of your property journey — buying, renting, selling, and investing in UK property.",
};

const BLOG_POSTS = [
  {
    slug: "stamp-duty-guide-2025",
    title: "First-Time Buyer's Complete Guide to Stamp Duty 2025",
    excerpt:
      "Everything you need to know about stamp duty land tax, the first-time buyer relief, and how to calculate your liability before making an offer.",
    category: "Buying",
    author: { name: "Sarah Mitchell", initials: "SM" },
    date: "15 Jan 2025",
    readTime: "8 min read",
    featured: true,
  },
  {
    slug: "uk-property-market-forecast-2025",
    title: "UK Property Market Forecast: Key Trends for 2025",
    excerpt:
      "As interest rates stabilise, we analyse the growth areas and investment opportunities shaping the UK property market this year.",
    category: "Market News",
    author: { name: "James Okafor", initials: "JO" },
    date: "10 Jan 2025",
    readTime: "6 min read",
    featured: false,
  },
  {
    slug: "renters-rights-bill-explained",
    title: "Renters' Rights Bill Explained: What Tenants Need to Know",
    excerpt:
      "The Renters' Rights Bill is the biggest shake-up to rental law in a generation. We break down what it means for tenants and landlords alike.",
    category: "Renting",
    author: { name: "Priya Nair", initials: "PN" },
    date: "8 Jan 2025",
    readTime: "7 min read",
    featured: false,
  },
  {
    slug: "how-to-sell-your-home-fast",
    title: "How to Sell Your Home Faster in a Competitive Market",
    excerpt:
      "From professional photography to strategic pricing, these proven tactics help sellers achieve quicker completions at better prices.",
    category: "Selling",
    author: { name: "Tom Brennan", initials: "TB" },
    date: "5 Jan 2025",
    readTime: "5 min read",
    featured: false,
  },
  {
    slug: "hmo-licensing-guide-landlords",
    title: "HMO Licensing: A Landlord's Complete 2025 Guide",
    excerpt:
      "Houses in Multiple Occupation require mandatory licensing in many areas. Avoid hefty fines by understanding the rules before you let.",
    category: "Landlord Tips",
    author: { name: "David Chen", initials: "DC" },
    date: "2 Jan 2025",
    readTime: "9 min read",
    featured: false,
  },
  {
    slug: "eco-upgrades-add-value",
    title: "Eco-Friendly Upgrades That Add the Most Value to Your Home",
    excerpt:
      "Solar panels, heat pumps, and EPC improvements can boost your home's value and cut energy bills. Here's where to invest.",
    category: "Selling",
    author: { name: "Rachel Hughes", initials: "RH" },
    date: "28 Dec 2024",
    readTime: "6 min read",
    featured: false,
  },
  {
    slug: "leasehold-reform-2025",
    title: "Leasehold Reform Act: What Flat Owners Must Know",
    excerpt:
      "Ground rent bans, easier enfranchisement, and new service charge rules — the Leasehold Reform Act changes everything for flat owners.",
    category: "Legal & Finance",
    author: { name: "Sarah Mitchell", initials: "SM" },
    date: "22 Dec 2024",
    readTime: "10 min read",
    featured: false,
  },
  {
    slug: "rent-to-rent-strategy",
    title: "Rent-to-Rent: Is It Still a Viable Strategy in 2025?",
    excerpt:
      "We examine the rent-to-rent model, its legal requirements, and whether tighter landlord regulations make it harder to profit.",
    category: "Landlord Tips",
    author: { name: "James Okafor", initials: "JO" },
    date: "18 Dec 2024",
    readTime: "7 min read",
    featured: false,
  },
  {
    slug: "conveyancing-timeline-explained",
    title: "Conveyancing Timeline: How Long Does It Really Take?",
    excerpt:
      "From exchange to completion, the conveyancing process can be frustratingly slow. Here's what causes delays and how to avoid them.",
    category: "Legal & Finance",
    author: { name: "Priya Nair", initials: "PN" },
    date: "12 Dec 2024",
    readTime: "5 min read",
    featured: false,
  },
] as const;

const CATEGORIES = [
  "All",
  "Buying",
  "Renting",
  "Selling",
  "Landlord Tips",
  "Market News",
  "Legal & Finance",
] as const;

const featuredPost = BLOG_POSTS[0];
const gridPosts = BLOG_POSTS.slice(1);

export default function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  void searchParams;

  return (
    <div className="mx-auto max-w-7xl px-6 pt-12 pb-20">
      {/* Hero */}
      <section className="mb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <span className="font-heading text-xs font-bold uppercase tracking-widest text-brand-secondary-dark">
              Property Insights
            </span>
            <h1 className="font-heading text-4xl md:text-6xl font-extrabold text-brand-primary-dark leading-tight tracking-tight">
              Britestate Advice<br />&amp; Insights
            </h1>
            <p className="max-w-xl font-body text-base text-neutral-500">
              Expert guidance for every stage of your property journey.
            </p>
          </div>
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={cat === "All" ? "/blog" : `/blog?category=${encodeURIComponent(cat)}`}
                className="shrink-0 rounded-full border border-neutral-200 bg-card px-5 py-2 font-body text-sm font-semibold text-neutral-600 transition-colors hover:bg-brand-primary-lighter hover:text-brand-primary whitespace-nowrap focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>

        {/* Featured Post */}
        <article className="group relative overflow-hidden rounded-2xl bg-brand-primary min-h-[480px] lg:min-h-[500px]">
          <div className="absolute inset-0 bg-muted/20" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-primary-dark/90 via-brand-primary-dark/20 to-transparent" aria-hidden="true" />
          <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full">
            <div className="flex items-center gap-4 mb-4">
              <span className="bg-brand-secondary-light text-brand-secondary-dark text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {featuredPost.category}
              </span>
              <span className="text-white/60 text-xs font-mono uppercase tracking-widest">
                {featuredPost.readTime}
              </span>
            </div>
            <h2 className="font-heading text-2xl md:text-4xl font-bold text-white mb-4 max-w-2xl leading-tight">
              {featuredPost.title}
            </h2>
            <p className="font-body text-white/80 text-base mb-6 max-w-xl hidden md:block leading-relaxed">
              {featuredPost.excerpt}
            </p>
            <div className="flex items-center gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-primary-lighter font-bold text-xs text-brand-primary">
                {featuredPost.author.initials}
              </span>
              <div className="text-sm">
                <p className="font-body font-bold text-white">{featuredPost.author.name}</p>
                <p className="font-body text-white/60">{featuredPost.date}</p>
              </div>
              <Link
                href={`/blog/${featuredPost.slug}`}
                className="ml-auto inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-5 py-2 font-body text-sm font-semibold text-white hover:bg-white/20 transition-colors focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2"
              >
                Read Article <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </article>
      </section>

      {/* Article Feed */}
      <section>
        <div className="flex items-center justify-between mb-8 border-b border-neutral-200 pb-4">
          <h3 className="font-heading text-2xl font-bold text-brand-primary-dark">Latest Articles</h3>
        </div>

        {/* Blog Card Grid */}
        <div className="mb-12 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
          {gridPosts.map((post) => (
            <article
              key={post.slug}
              className="group flex flex-col cursor-pointer"
            >
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-5 bg-surface-container">
                <div className="absolute inset-0 bg-muted/20" aria-hidden="true" />
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 text-brand-primary-dark text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tight shadow-sm">
                    {post.category}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px] text-neutral-500 mb-3 tracking-widest uppercase">
                <span>{post.date}</span>
                <span className="w-1 h-1 bg-neutral-300 rounded-full" aria-hidden="true" />
                <span>{post.readTime}</span>
              </div>
              <h4 className="font-heading text-xl font-bold text-brand-primary-dark mb-3 group-hover:text-brand-secondary-dark transition-colors leading-snug">
                {post.title}
              </h4>
              <p className="font-body text-sm text-neutral-500 leading-relaxed mb-6 line-clamp-2">
                {post.excerpt}
              </p>
              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-primary-lighter font-bold text-xs text-brand-primary">
                    {post.author.initials}
                  </span>
                  <span className="font-body text-xs font-semibold text-brand-primary-dark">{post.author.name}</span>
                </div>
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-1 font-body text-sm font-semibold text-brand-primary hover:underline focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
                  aria-label={`Read ${post.title}`}
                >
                  <ArrowRight className="size-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Load More */}
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            className="px-8 py-3 rounded-full border-brand-primary-dark text-brand-primary-dark font-heading font-bold hover:bg-brand-primary-dark hover:text-white transition-all focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
          >
            Load More Articles
          </Button>
        </div>
      </section>

      {/* Newsletter CTA */}
      <div className="mt-16 rounded-3xl bg-brand-primary-dark p-10 text-white text-center relative overflow-hidden">
        <div className="relative z-10 max-w-lg mx-auto">
          <h2 className="font-heading text-3xl font-bold mb-4">Stay in the Loop</h2>
          <p className="font-body text-white/80 mb-8">
            Get the weekly property digest delivered directly to your inbox. Expert market intelligence, no fluff.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input
              id="newsletter-email"
              type="email"
              placeholder="Your email address"
              aria-label="Email address for newsletter"
              className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-body text-sm text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-brand-secondary/40"
            />
            <button className="rounded-xl bg-brand-secondary-light text-brand-secondary-dark px-6 py-3 font-heading font-bold text-sm hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2">
              Subscribe
            </button>
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-brand-secondary-dark opacity-20 blur-[100px] rounded-full" aria-hidden="true" />
      </div>
    </div>
  );
}
