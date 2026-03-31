import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Twitter, Linkedin, Link2, Mail, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOCK_ARTICLE = {
  slug: "stamp-duty-guide-2025",
  title: "First-Time Buyer's Complete Guide to Stamp Duty 2025",
  excerpt:
    "Everything you need to know about stamp duty land tax, the first-time buyer relief, and how to calculate your liability before making an offer.",
  category: "Buying",
  author: {
    name: "Sarah Mitchell",
    initials: "SM",
    title: "Property Expert at Britestate",
    bio: "Sarah has spent over a decade helping first-time buyers navigate the UK property market. A former solicitor, she specialises in making complex legal and financial topics accessible to everyday buyers.",
  },
  date: "15 Jan 2025",
  readTime: "8 min read",
  body: [
    {
      type: "paragraph" as const,
      text: "Stamp Duty Land Tax (SDLT) is one of the most significant costs you will face when buying a property in England or Northern Ireland. For first-time buyers, understanding the relief on offer — and when it applies — can save you thousands of pounds.",
    },
    {
      type: "h2" as const,
      text: "What Is Stamp Duty?",
    },
    {
      type: "paragraph" as const,
      text: "SDLT is a tax payable to HMRC when you purchase a residential property above a certain threshold. The rate you pay depends on the purchase price, your buyer status (first-time, home-mover, additional property), and the property type. In Scotland and Wales, equivalent taxes apply — Land and Buildings Transaction Tax (LBTT) and Land Transaction Tax (LTT) respectively.",
    },
    {
      type: "h2" as const,
      text: "First-Time Buyer Relief",
    },
    {
      type: "paragraph" as const,
      text: "First-time buyers benefit from a generous SDLT relief. As of April 2025, you pay no stamp duty on the first £300,000 of your purchase price, and 5% on the portion between £300,001 and £500,000. If you are purchasing above £500,000, you lose the relief entirely and pay the standard rates. This means the maximum saving available to first-time buyers is £5,000.",
    },
    {
      type: "blockquote" as const,
      text: "The stamp duty relief for first-time buyers is one of the most valuable government incentives in the market — but it only works if you plan your purchase around the thresholds.",
    },
    {
      type: "h3" as const,
      text: "Who Qualifies as a First-Time Buyer?",
    },
    {
      type: "paragraph" as const,
      text: "You must never have owned a freehold or leasehold interest in a residential property anywhere in the world. This applies to all purchasers on the transaction — if you are buying with a partner who has previously owned property, neither of you will qualify for first-time buyer relief.",
    },
    {
      type: "list" as const,
      items: [
        "You must be purchasing your only or main residence",
        "The property must be in England or Northern Ireland",
        "All buyers on the transaction must be first-time buyers",
        "The purchase price must not exceed £500,000 to qualify",
        "You must complete the purchase, not just exchange contracts",
      ],
    },
    {
      type: "h2" as const,
      text: "How to Calculate Your Stamp Duty Bill",
    },
    {
      type: "paragraph" as const,
      text: "SDLT is calculated on a tiered basis — like income tax. You only pay the higher rate on the portion of the price that falls within each band. For a first-time buyer purchasing a £350,000 property, the calculation is: 0% on the first £300,000, and 5% on the remaining £50,000, giving a total SDLT bill of £2,500.",
    },
    {
      type: "h3" as const,
      text: "Timing Your Purchase",
    },
    {
      type: "paragraph" as const,
      text: "The SDLT thresholds have changed several times since 2020, and there is no guarantee they will remain at current levels. If you are close to a threshold — for example, purchasing at £490,000 versus £510,000 — the difference in stamp duty can be dramatic. Always calculate your SDLT liability before making an offer, and factor it into your deposit and legal costs budget.",
    },
    {
      type: "paragraph" as const,
      text: "Use the Britestate Stamp Duty Calculator to model different purchase prices and see how your liability changes. Our AI can also factor SDLT into your full cost-of-purchase breakdown, including legal fees, survey costs, and moving expenses, so you never face a financial surprise at completion.",
    },
  ],
};

const RELATED_ARTICLES = [
  {
    slug: "conveyancing-timeline-explained",
    title: "Conveyancing Timeline: How Long Does It Really Take?",
    category: "Legal & Finance",
    readTime: "5 min read",
  },
  {
    slug: "first-time-buyer-checklist",
    title: "First-Time Buyer's Checklist: From Viewing to Keys",
    category: "Buying",
    readTime: "7 min read",
  },
  {
    slug: "uk-property-market-forecast-2025",
    title: "UK Property Market Forecast: Key Trends for 2025",
    category: "Market News",
    readTime: "6 min read",
  },
];

const MORE_FROM_CATEGORY = [
  {
    slug: "how-to-sell-your-home-fast",
    title: "How to Make a Winning Offer on a Property",
    category: "Buying",
    date: "3 Jan 2025",
    readTime: "4 min read",
    author: { name: "Tom Brennan", initials: "TB" },
  },
  {
    slug: "leasehold-reform-2025",
    title: "Shared Ownership Explained: Pros, Cons and How to Apply",
    category: "Buying",
    date: "18 Dec 2024",
    readTime: "8 min read",
    author: { name: "Sarah Mitchell", initials: "SM" },
  },
  {
    slug: "eco-upgrades-add-value",
    title: "Survey Types Compared: Which Report Do You Need?",
    category: "Buying",
    date: "10 Dec 2024",
    readTime: "6 min read",
    author: { name: "Rachel Hughes", initials: "RH" },
  },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  void slug;
  return {
    title: `${MOCK_ARTICLE.title} | Britestate Blog`,
    description: MOCK_ARTICLE.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  void slug;

  const post = MOCK_ARTICLE;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-8 flex flex-wrap items-center gap-2 font-body text-sm text-neutral-500" aria-label="Breadcrumb">
        <Link href="/" className="transition-colors hover:text-brand-primary">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/blog" className="transition-colors hover:text-brand-primary">
          Blog
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href={`/blog?category=${encodeURIComponent(post.category)}`}
          className="transition-colors hover:text-brand-primary"
        >
          {post.category}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="line-clamp-1 max-w-[220px] font-medium text-foreground">
          {post.title}
        </span>
      </nav>

      <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-12">
        {/* ── Main Article Column ── */}
        <div className="min-w-0">
          {/* Article Header */}
          <header className="mb-8">
            <span className="inline-block rounded-full bg-brand-primary-lighter px-3 py-1 font-body text-xs font-medium text-brand-primary">
              {post.category}
            </span>
            <h1 className="mt-3 font-heading text-2xl font-bold text-foreground leading-snug lg:text-3xl">
              {post.title}
            </h1>
            <p className="mt-2 font-body text-base text-neutral-500 leading-relaxed">
              {post.excerpt}
            </p>

            {/* Author + meta row */}
            <div className="mt-5 flex flex-col gap-4 rounded-xl bg-muted/30 p-4 ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 sm:flex-row sm:items-center">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-primary font-bold text-sm text-white">
                {post.author.initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-heading text-sm font-semibold text-foreground">{post.author.name}</div>
                <div className="font-body text-xs text-neutral-500">{post.author.title}</div>
              </div>
              <div className="flex shrink-0 items-center gap-4 font-body text-xs text-neutral-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 shrink-0" />
                  <span>{post.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5 shrink-0" />
                  <span>{post.readTime}</span>
                </div>
              </div>
            </div>

            {/* Share buttons */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="font-body text-sm font-medium text-neutral-500">Share:</span>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 font-body text-sm font-medium text-neutral-600 ring-1 ring-neutral-200/60 transition-colors hover:text-brand-primary hover:ring-brand-primary dark:ring-neutral-700/60 focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
              >
                <Twitter className="size-3.5" />
                Share on Twitter
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://britestate.co.uk/blog/${post.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 font-body text-sm font-medium text-neutral-600 ring-1 ring-neutral-200/60 transition-colors hover:text-brand-primary hover:ring-brand-primary dark:ring-neutral-700/60 focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
              >
                <Linkedin className="size-3.5" />
                Share on LinkedIn
              </a>
              <Link
                href="#"
                className="inline-flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 font-body text-sm font-medium text-neutral-600 ring-1 ring-neutral-200/60 transition-colors hover:text-brand-primary hover:ring-brand-primary dark:ring-neutral-700/60 focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
              >
                <Link2 className="size-3.5" />
                Copy Link
              </Link>
            </div>
          </header>

          {/* Hero Image Placeholder */}
          <div className="mb-8 aspect-[16/9] w-full rounded-xl bg-muted/30" aria-hidden="true" />

          {/* Article Body */}
          <div className="prose prose-neutral dark:prose-invert max-w-none mb-12">
            {post.body.map((block, i) => {
              if (block.type === "paragraph") {
                return (
                  <p key={i} className="mb-5 font-body text-base leading-relaxed text-foreground">
                    {block.text}
                  </p>
                );
              }
              if (block.type === "h2") {
                return (
                  <h2
                    key={i}
                    className="mb-4 mt-10 font-heading text-xl font-semibold text-foreground"
                  >
                    {block.text}
                  </h2>
                );
              }
              if (block.type === "h3") {
                return (
                  <h3
                    key={i}
                    className="mb-3 mt-8 font-heading text-lg font-semibold text-foreground"
                  >
                    {block.text}
                  </h3>
                );
              }
              if (block.type === "blockquote") {
                return (
                  <blockquote
                    key={i}
                    className="my-6 rounded-r-xl border-l-4 border-brand-primary bg-brand-primary-lighter px-6 py-4 font-body text-sm font-medium italic leading-relaxed text-brand-primary"
                  >
                    &ldquo;{block.text}&rdquo;
                  </blockquote>
                );
              }
              if (block.type === "list") {
                return (
                  <ul key={i} className="mb-5 list-inside list-disc space-y-2 font-body text-sm text-foreground">
                    {block.items.map((item, j) => (
                      <li key={j} className="leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                );
              }
              return null;
            })}
          </div>

          {/* Author Bio */}
          <div className="mb-12 flex gap-5 rounded-xl bg-card p-6 ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand-primary font-bold text-lg text-white">
              {post.author.initials}
            </span>
            <div>
              <div className="font-heading text-base font-semibold text-foreground">{post.author.name}</div>
              <div className="font-body text-xs font-medium text-brand-primary">{post.author.title}</div>
              <p className="mt-2 font-body text-sm leading-relaxed text-neutral-500">{post.author.bio}</p>
            </div>
          </div>

          {/* More from Category */}
          <section>
            <h2 className="mb-6 font-heading text-lg font-semibold text-foreground">
              More from {post.category}
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {MORE_FROM_CATEGORY.map((item) => (
                <article
                  key={item.slug}
                  className="group flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 hover:shadow-md transition-shadow"
                >
                  <div className="aspect-[16/9] bg-muted/30" aria-hidden="true" />
                  <div className="flex flex-1 flex-col p-4">
                    <span className="inline-block w-fit rounded-full bg-brand-primary-lighter px-2.5 py-0.5 font-body text-xs font-medium text-brand-primary">
                      {item.category}
                    </span>
                    <h3 className="mt-2 flex-1 font-heading text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-brand-primary transition-colors">
                      {item.title}
                    </h3>
                    <div className="mt-auto flex items-center gap-2 font-body text-xs text-neutral-500">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-primary-lighter font-bold text-xs text-brand-primary">
                        {item.author.initials}
                      </span>
                      <span className="truncate font-medium text-foreground">{item.author.name}</span>
                      <span aria-hidden="true">·</span>
                      <span className="shrink-0">{item.readTime}</span>
                    </div>
                    <Link
                      href={`/blog/${item.slug}`}
                      className="mt-3 inline-flex items-center gap-1 font-body text-xs font-semibold text-brand-primary hover:underline focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
                    >
                      Read more <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        {/* ── Sidebar ── */}
        <aside className="hidden lg:block">
          <div className="sticky top-8 flex flex-col gap-6">
            {/* Related Articles */}
            <div className="rounded-xl bg-card p-5 ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
              <h3 className="mb-4 font-heading text-base font-semibold text-foreground">
                Related Articles
              </h3>
              <div className="flex flex-col gap-2">
                {RELATED_ARTICLES.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/blog/${article.slug}`}
                    className="group flex flex-col gap-1 rounded-lg p-3 transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
                  >
                    <span className="inline-block w-fit rounded-full bg-brand-primary-lighter px-2 py-0.5 font-body text-xs font-medium text-brand-primary">
                      {article.category}
                    </span>
                    <span className="font-heading text-sm font-semibold text-foreground leading-snug group-hover:text-brand-primary transition-colors">
                      {article.title}
                    </span>
                    <span className="flex items-center gap-1 font-body text-xs text-neutral-500">
                      <Clock className="size-3" />
                      {article.readTime}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter Widget */}
            <div className="rounded-xl bg-brand-primary-lighter p-5 ring-1 ring-brand-primary/10">
              <div className="mb-2 flex items-center gap-2">
                <Mail className="size-4 text-brand-primary" />
                <h3 className="font-heading text-base font-semibold text-brand-primary">
                  Property insights, weekly
                </h3>
              </div>
              <p className="mb-4 font-body text-sm leading-relaxed text-neutral-500">
                Get expert guidance for every stage of your property journey, straight to your inbox.
              </p>
              <label htmlFor="sidebar-email" className="sr-only">
                Email address
              </label>
              <input
                id="sidebar-email"
                type="email"
                placeholder="Your email address"
                className="mb-3 w-full rounded-lg border border-brand-primary/20 bg-card px-3 py-2 font-body text-sm text-foreground placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
              <Button className="w-full bg-brand-primary font-body text-sm font-medium text-white hover:bg-brand-primary/90 focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2">
                Subscribe
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
