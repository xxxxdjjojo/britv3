import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
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

type BlogCategory = (typeof CATEGORIES)[number];
type FilterableBlogCategory = Exclude<BlogCategory, "All">;

function categorySlug(category: string): string {
  return category
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const CATEGORY_ALIASES: Record<string, FilterableBlogCategory> = {
  agents: "Selling",
  buying: "Buying",
  landlords: "Landlord Tips",
  "landlord-tips": "Landlord Tips",
  "legal-and-finance": "Legal & Finance",
  "legal-finance": "Legal & Finance",
  "market-news": "Market News",
  renting: "Renting",
  selling: "Selling",
  "tenant-rights": "Renting",
};

function resolveCategory(category?: string): BlogCategory {
  if (!category) {
    return "All";
  }

  const normalized = categorySlug(category);
  const exactCategory = CATEGORIES.find(
    (candidate) => categorySlug(candidate) === normalized,
  );

  if (exactCategory) {
    return exactCategory;
  }

  return CATEGORY_ALIASES[normalized] ?? "All";
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const activeCategory = resolveCategory(category);
  const filteredPosts =
    activeCategory === "All"
      ? BLOG_POSTS
      : BLOG_POSTS.filter((post) => post.category === activeCategory);
  const featuredPost = filteredPosts.find((post) => post.featured) ?? filteredPosts[0];
  const gridPosts = featuredPost
    ? filteredPosts.filter((post) => post.slug !== featuredPost.slug)
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-8" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand-primary transition-colors">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-neutral-900 font-medium">Blog</span>
      </nav>

      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl lg:text-5xl font-bold text-neutral-900 font-heading tracking-tight mb-4">
          Britestate Advice &amp; Insights
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto mb-8">
          Expert guidance for every stage of your property journey.
        </p>
        {/* Newsletter signup */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <label htmlFor="hero-email" className="sr-only">
            Email address
          </label>
          <div className="flex w-full rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center pl-4 text-neutral-400">
              <Mail className="size-5" />
            </div>
            <input
              id="hero-email"
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-3 py-3 text-sm bg-transparent outline-none text-neutral-900 placeholder:text-neutral-400"
            />
            <Button className="rounded-none rounded-r-xl bg-brand-primary text-white hover:bg-brand-primary-light px-5 text-sm font-semibold">
              Subscribe
            </Button>
          </div>
        </div>
      </div>

      {/* Featured Post */}
      {featuredPost ? (
        <article className="mb-12 bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden group hover:shadow-md transition-shadow">
          <div className="grid lg:grid-cols-2">
            <div className="aspect-[16/9] lg:aspect-auto bg-neutral-200 min-h-[260px]" aria-hidden="true" />
            <div className="p-8 lg:p-10 flex flex-col justify-center">
              <span className="inline-block bg-brand-primary text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 w-fit">
                {featuredPost.category}
              </span>
              <h2 className="text-2xl lg:text-3xl font-bold text-neutral-900 font-heading leading-snug mb-4 group-hover:text-brand-primary transition-colors">
                {featuredPost.title}
              </h2>
              <p className="text-neutral-600 leading-relaxed mb-6 line-clamp-3">
                {featuredPost.excerpt}
              </p>
              <div className="flex items-center gap-3 text-sm text-neutral-500 mb-6">
                <span className="size-8 rounded-full bg-brand-primary-lighter text-brand-primary font-bold text-xs flex items-center justify-center shrink-0">
                  {featuredPost.author.initials}
                </span>
                <span className="font-medium text-neutral-700">{featuredPost.author.name}</span>
                <span aria-hidden="true">·</span>
                <span>{featuredPost.date}</span>
                <span aria-hidden="true">·</span>
                <span>{featuredPost.readTime}</span>
              </div>
              <Link
                href={`/blog/${featuredPost.slug}`}
                className="inline-flex items-center gap-2 text-brand-primary font-semibold hover:underline"
              >
                Read Article <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </article>
      ) : null}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 mb-10">
        {CATEGORIES.map((cat) => {
          const isActive = cat === activeCategory;

          return (
            <Link
              key={cat}
              href={cat === "All" ? "/blog" : `/blog?category=${categorySlug(cat)}`}
              aria-current={isActive ? "page" : undefined}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
                isActive
                  ? "border-brand-primary bg-brand-primary text-white"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-brand-primary hover:text-brand-primary"
              }`}
            >
              {cat}
            </Link>
          );
        })}
      </div>

      {/* Blog Card Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {gridPosts.map((post) => (
            <article
              key={post.slug}
              className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col"
            >
              <div className="aspect-[16/9] bg-neutral-200 w-full" aria-hidden="true" />
              <div className="flex flex-col flex-1 p-5">
                <span className="inline-block bg-brand-primary-lighter text-brand-primary text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3 w-fit">
                  {post.category}
                </span>
                <h3 className="text-lg font-bold text-neutral-900 font-heading leading-snug mb-2 line-clamp-2 group-hover:text-brand-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed mb-4 line-clamp-2 flex-1">
                  {post.excerpt}
                </p>
                <div className="flex items-center gap-2 text-xs text-neutral-500 mt-auto pt-3 border-t border-neutral-100">
                  <span className="size-7 rounded-full bg-brand-primary-lighter text-brand-primary font-bold text-xs flex items-center justify-center shrink-0">
                    {post.author.initials}
                  </span>
                  <span className="font-medium text-neutral-700 truncate">{post.author.name}</span>
                  <span aria-hidden="true" className="shrink-0">·</span>
                  <span className="shrink-0">{post.date}</span>
                  <span aria-hidden="true" className="shrink-0">·</span>
                  <span className="shrink-0">{post.readTime}</span>
                </div>
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-1 text-brand-primary font-semibold text-sm mt-4 hover:underline"
                >
                  Read more <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mb-12 rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center">
          <h2 className="text-2xl font-bold text-neutral-900 font-heading mb-3">
            No articles found
          </h2>
          <p className="text-neutral-600">
            There are no {activeCategory.toLowerCase()} articles available yet.
          </p>
        </div>
      )}

      {/* Load More */}
      {filteredPosts.length > 0 ? (
        <div className="flex justify-center">
          <Button variant="outline" className="px-8 py-3 border-neutral-300 text-neutral-700 hover:border-brand-primary hover:text-brand-primary font-semibold">
            Load More Articles
          </Button>
        </div>
      ) : null}
    </div>
  );
}
