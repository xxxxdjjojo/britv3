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

const featuredPost = BLOG_POSTS[0];
const gridPosts = BLOG_POSTS.slice(1);

export default function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  void searchParams;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-8 flex items-center gap-2 font-body text-sm text-neutral-500" aria-label="Breadcrumb">
        <Link href="/" className="transition-colors hover:text-brand-primary">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-foreground">Blog</span>
      </nav>

      {/* Hero */}
      <div className="mb-10 text-center">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Britestate Advice &amp; Insights
        </h1>
        <p className="mx-auto mt-2 max-w-2xl font-body text-base text-neutral-500">
          Expert guidance for every stage of your property journey.
        </p>
        {/* Newsletter signup */}
        <div className="mx-auto mt-6 flex max-w-md items-center overflow-hidden rounded-lg bg-card ring-1 ring-neutral-200/60 shadow-sm dark:ring-neutral-700/60">
          <div className="flex items-center pl-3 text-neutral-400">
            <Mail className="size-4" />
          </div>
          <label htmlFor="hero-email" className="sr-only">
            Email address
          </label>
          <input
            id="hero-email"
            type="email"
            placeholder="Enter your email"
            className="flex-1 bg-transparent px-3 py-2.5 font-body text-sm text-foreground placeholder:text-neutral-400 outline-none"
          />
          <Button className="rounded-none rounded-r-lg bg-brand-primary px-5 font-body text-sm font-medium text-white hover:bg-brand-primary/90 focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2">
            Subscribe
          </Button>
        </div>
      </div>

      {/* Featured Post */}
      <article className="mb-10 overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 group hover:shadow-md transition-shadow">
        <div className="grid lg:grid-cols-2">
          <div className="aspect-[16/9] lg:aspect-auto min-h-[260px] bg-muted/30" aria-hidden="true" />
          <div className="flex flex-col justify-center p-8 lg:p-10">
            <span className="inline-block w-fit rounded-full bg-brand-primary-lighter px-3 py-1 font-body text-xs font-medium text-brand-primary">
              {featuredPost.category}
            </span>
            <h2 className="mt-3 font-heading text-xl font-semibold text-foreground leading-snug group-hover:text-brand-primary transition-colors">
              {featuredPost.title}
            </h2>
            <p className="mt-2 font-body text-sm text-neutral-500 leading-relaxed line-clamp-3">
              {featuredPost.excerpt}
            </p>
            <div className="mt-4 flex items-center gap-3 font-body text-sm text-neutral-500">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-primary-lighter font-bold text-xs text-brand-primary">
                {featuredPost.author.initials}
              </span>
              <span className="font-medium text-foreground">{featuredPost.author.name}</span>
              <span aria-hidden="true">·</span>
              <span>{featuredPost.date}</span>
              <span aria-hidden="true">·</span>
              <span>{featuredPost.readTime}</span>
            </div>
            <Link
              href={`/blog/${featuredPost.slug}`}
              className="mt-5 inline-flex items-center gap-2 font-body text-sm font-semibold text-brand-primary hover:underline focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
            >
              Read Article <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </article>

      {/* Category Filter Pills */}
      <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={cat === "All" ? "/blog" : `/blog?category=${encodeURIComponent(cat)}`}
            className="shrink-0 rounded-full bg-card px-4 py-1.5 font-body text-sm font-medium text-neutral-600 ring-1 ring-neutral-200/60 transition-colors hover:bg-muted hover:text-brand-primary whitespace-nowrap dark:ring-neutral-700/60 focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* Blog Card Grid */}
      <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {gridPosts.map((post) => (
          <article
            key={post.slug}
            className="group flex flex-col overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 hover:shadow-md transition-all duration-300"
          >
            <div className="aspect-[16/9] w-full bg-muted/30" aria-hidden="true" />
            <div className="flex flex-1 flex-col p-5">
              <span className="inline-block w-fit rounded-full bg-brand-primary-lighter px-2.5 py-0.5 font-body text-xs font-medium text-brand-primary">
                {post.category}
              </span>
              <h3 className="mt-2 font-heading text-base font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-brand-primary transition-colors">
                {post.title}
              </h3>
              <p className="mt-1 flex-1 font-body text-xs text-neutral-500 leading-relaxed line-clamp-2">
                {post.excerpt}
              </p>
              <div className="mt-auto flex items-center gap-2 border-t border-neutral-100 pt-3 font-body text-xs text-neutral-500 dark:border-neutral-800">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-primary-lighter font-bold text-xs text-brand-primary">
                  {post.author.initials}
                </span>
                <span className="truncate font-medium text-foreground">{post.author.name}</span>
                <span aria-hidden="true" className="shrink-0">·</span>
                <span className="shrink-0">{post.date}</span>
                <span aria-hidden="true" className="shrink-0">·</span>
                <span className="shrink-0">{post.readTime}</span>
              </div>
              <Link
                href={`/blog/${post.slug}`}
                className="mt-4 inline-flex items-center gap-1 font-body text-sm font-semibold text-brand-primary hover:underline focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
              >
                Read more <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>

      {/* Load More */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          className="px-8 py-3 font-body text-sm font-medium text-neutral-600 ring-1 ring-neutral-200/60 hover:text-brand-primary hover:ring-brand-primary dark:ring-neutral-700/60 focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
        >
          Load More Articles
        </Button>
      </div>

      {/* Newsletter CTA */}
      <div className="mt-12 rounded-xl bg-brand-primary p-8 text-center text-white">
        <h2 className="font-heading text-xl font-semibold">Subscribe to our newsletter</h2>
        <p className="mt-2 font-body text-sm text-white/70">Stay updated with the latest property insights.</p>
        <div className="mt-4 flex justify-center gap-2">
          <input
            type="email"
            placeholder="Your email address"
            className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 font-body text-sm text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-white/30"
          />
          <button className="rounded-lg bg-white px-4 py-2 font-body text-sm font-medium text-brand-primary hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2">
            Subscribe
          </button>
        </div>
      </div>
    </div>
  );
}
