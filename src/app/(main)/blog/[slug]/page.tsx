import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Twitter, Linkedin, Mail, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyLinkButton } from "./CopyLinkButton";

type ArticleBlock =
  | { type: "paragraph"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "blockquote"; text: string }
  | { type: "list"; items: string[] };

type BlogArticle = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: {
    name: string;
    initials: string;
    title: string;
    bio: string;
  };
  date: string;
  readTime: string;
  body: ArticleBlock[];
};

const MOCK_ARTICLE: BlogArticle = {
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

const BLOG_ARTICLES: Record<string, BlogArticle> = {
  [MOCK_ARTICLE.slug]: MOCK_ARTICLE,
  "uk-property-market-forecast-2026": {
    ...MOCK_ARTICLE,
    slug: "uk-property-market-forecast-2026",
    title: "UK Property Market Forecast: What to Expect in 2026",
    excerpt:
      "As interest rates stabilise, we analyse the potential growth areas and investment opportunities across major UK cities for the upcoming year.",
    category: "Market Trends",
    date: "28 Feb 2026",
    readTime: "6 min read",
    author: {
      name: "Emma Clarke",
      initials: "EC",
      title: "Market Analyst at Britestate",
      bio: "Emma tracks regional housing data, buyer demand, and affordability signals across the UK market.",
    },
    body: [
      {
        type: "paragraph",
        text: "The UK property market in 2026 is expected to be shaped by improving affordability, steadier mortgage pricing, and renewed confidence in well-connected regional cities.",
      },
      {
        type: "h2",
        text: "Affordability Will Lead Buyer Behaviour",
      },
      {
        type: "paragraph",
        text: "Buyers are still highly payment-sensitive, so areas with strong transport links and comparatively lower monthly costs are likely to outperform overheated prime postcodes.",
      },
      {
        type: "h2",
        text: "Regional Cities Remain Competitive",
      },
      {
        type: "paragraph",
        text: "Manchester, Birmingham, Bristol, Leeds, and parts of Glasgow continue to attract demand from movers looking for employment access, rental resilience, and more space.",
      },
    ],
  },
  "first-time-buyer-checklist": {
    ...MOCK_ARTICLE,
    slug: "first-time-buyer-checklist",
    title: "First-Time Buyer's Checklist: From Viewing to Keys",
    excerpt:
      "Navigating your first property purchase can be daunting. Our comprehensive guide breaks down every step of the process to ensure a smooth transaction.",
    category: "Buying Guide",
    date: "18 Feb 2026",
    readTime: "7 min read",
    body: [
      {
        type: "paragraph",
        text: "Buying your first home is easier to manage when each decision is broken into a clear sequence, from finance preparation through exchange and completion.",
      },
      {
        type: "h2",
        text: "Before You View",
      },
      {
        type: "list",
        items: [
          "Confirm your deposit and monthly affordability",
          "Get an agreement in principle",
          "Shortlist locations by commute, schools, and running costs",
          "Research recent sold prices before making offers",
        ],
      },
      {
        type: "h2",
        text: "After Your Offer Is Accepted",
      },
      {
        type: "paragraph",
        text: "Instruct your solicitor quickly, book the right survey, keep your mortgage broker updated, and track each milestone so delays do not drift unnoticed.",
      },
    ],
  },
  "eco-friendly-upgrades": {
    ...MOCK_ARTICLE,
    slug: "eco-friendly-upgrades",
    title: "Eco-Friendly Upgrades That Add Value to Your Home",
    excerpt:
      "Discover which sustainable improvements offer the best return on investment while lowering your carbon footprint and energy bills.",
    category: "Sustainability",
    date: "12 Feb 2026",
    readTime: "5 min read",
    author: {
      name: "Rachel Hughes",
      initials: "RH",
      title: "Homes Editor at Britestate",
      bio: "Rachel writes about home improvements, energy performance, and design decisions that improve everyday living.",
    },
    body: [
      {
        type: "paragraph",
        text: "Energy-efficient upgrades can make a home cheaper to run, more comfortable to live in, and more attractive to future buyers.",
      },
      {
        type: "h2",
        text: "Start With Fabric Improvements",
      },
      {
        type: "paragraph",
        text: "Insulation, draught-proofing, and high-performance glazing often deliver more reliable comfort gains than visible technology upgrades alone.",
      },
      {
        type: "h2",
        text: "Choose Upgrades Buyers Understand",
      },
      {
        type: "paragraph",
        text: "Solar panels, smart heating controls, efficient boilers, and EV charging points can all strengthen a listing when the benefits are documented clearly.",
      },
    ],
  },
};

function getArticleBySlug(slug: string): BlogArticle {
  return BLOG_ARTICLES[slug] ?? MOCK_ARTICLE;
}

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
  const post = getArticleBySlug(slug);
  return {
    title: `${post.title} | Britestate Blog`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const post = getArticleBySlug(slug);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-8 flex-wrap" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand-primary transition-colors">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/blog" className="hover:text-brand-primary transition-colors">
          Blog
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href={`/blog?category=${encodeURIComponent(post.category)}`}
          className="hover:text-brand-primary transition-colors"
        >
          {post.category}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-neutral-900 font-medium line-clamp-1 max-w-[220px]">
          {post.title}
        </span>
      </nav>

      <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-12">
        {/* ── Main Article Column ── */}
        <div className="min-w-0">
          {/* Article Header */}
          <header className="mb-8">
            <span className="inline-block bg-brand-primary-lighter text-brand-primary text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
              {post.category}
            </span>
            <h1 className="text-3xl lg:text-4xl font-bold text-neutral-900 font-heading leading-snug mb-4">
              {post.title}
            </h1>
            <p className="text-lg text-neutral-600 leading-relaxed mb-6">
              {post.excerpt}
            </p>

            {/* Author + meta row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
              <span className="size-12 rounded-full bg-brand-primary text-white font-bold text-sm flex items-center justify-center shrink-0">
                {post.author.initials}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-neutral-900">{post.author.name}</div>
                <div className="text-sm text-neutral-500">{post.author.title}</div>
              </div>
              <div className="flex items-center gap-4 text-sm text-neutral-500 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-4 shrink-0" />
                  <span>{post.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="size-4 shrink-0" />
                  <span>{post.readTime}</span>
                </div>
              </div>
            </div>

            {/* Share buttons */}
            <div className="flex items-center gap-3 mt-5 flex-wrap">
              <span className="text-sm font-medium text-neutral-600">Share:</span>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 text-neutral-700 text-sm font-medium hover:border-brand-primary hover:text-brand-primary transition-colors bg-white"
              >
                <Twitter className="size-4" />
                Share on Twitter
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://britestate.co.uk/blog/${post.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 text-neutral-700 text-sm font-medium hover:border-brand-primary hover:text-brand-primary transition-colors bg-white"
              >
                <Linkedin className="size-4" />
                Share on LinkedIn
              </a>
              <CopyLinkButton url={`https://britestate.co.uk/blog/${post.slug}`} />
            </div>
          </header>

          {/* Hero Image Placeholder */}
          <div className="aspect-[16/9] w-full bg-neutral-200 rounded-2xl mb-8" aria-hidden="true" />

          {/* Article Body */}
          <div className="prose-neutral max-w-none mb-12">
            {post.body.map((block, i) => {
              if (block.type === "paragraph") {
                return (
                  <p key={i} className="text-neutral-700 leading-relaxed mb-5 text-base">
                    {block.text}
                  </p>
                );
              }
              if (block.type === "h2") {
                return (
                  <h2
                    key={i}
                    className="text-2xl font-bold text-neutral-900 font-heading mt-10 mb-4"
                  >
                    {block.text}
                  </h2>
                );
              }
              if (block.type === "h3") {
                return (
                  <h3
                    key={i}
                    className="text-xl font-bold text-neutral-900 font-heading mt-8 mb-3"
                  >
                    {block.text}
                  </h3>
                );
              }
              if (block.type === "blockquote") {
                return (
                  <blockquote
                    key={i}
                    className="border-l-4 border-brand-primary bg-brand-primary-lighter rounded-r-xl px-6 py-4 my-6 text-brand-primary font-medium italic leading-relaxed"
                  >
                    &ldquo;{block.text}&rdquo;
                  </blockquote>
                );
              }
              if (block.type === "list") {
                return (
                  <ul key={i} className="list-disc list-inside space-y-2 mb-5 text-neutral-700">
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
          <div className="border border-neutral-100 bg-white rounded-2xl p-6 mb-12 flex gap-5">
            <span className="size-16 rounded-full bg-brand-primary text-white font-bold text-lg flex items-center justify-center shrink-0">
              {post.author.initials}
            </span>
            <div>
              <div className="font-bold text-neutral-900 text-lg mb-0.5">{post.author.name}</div>
              <div className="text-sm text-brand-primary font-medium mb-3">{post.author.title}</div>
              <p className="text-sm text-neutral-600 leading-relaxed">{post.author.bio}</p>
            </div>
          </div>

          {/* More from Category */}
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 font-heading mb-6">
              More from {post.category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {MORE_FROM_CATEGORY.map((item) => (
                <article
                  key={item.slug}
                  className="bg-white border border-neutral-100 rounded-2xl overflow-hidden group hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="aspect-[16/9] bg-neutral-200" aria-hidden="true" />
                  <div className="p-4 flex flex-col flex-1">
                    <span className="inline-block bg-brand-primary-lighter text-brand-primary text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full mb-2 w-fit">
                      {item.category}
                    </span>
                    <h3 className="text-sm font-bold text-neutral-900 font-heading leading-snug mb-3 group-hover:text-brand-primary transition-colors line-clamp-2 flex-1">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mt-auto">
                      <span className="size-6 rounded-full bg-brand-primary-lighter text-brand-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {item.author.initials}
                      </span>
                      <span className="font-medium text-neutral-700 truncate">{item.author.name}</span>
                      <span aria-hidden="true">·</span>
                      <span className="shrink-0">{item.readTime}</span>
                    </div>
                    <Link
                      href={`/blog/${item.slug}`}
                      className="inline-flex items-center gap-1 text-brand-primary font-semibold text-xs mt-3 hover:underline"
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
            <div className="bg-white border border-neutral-100 rounded-2xl p-5">
              <h3 className="text-base font-bold text-neutral-900 font-heading mb-4">
                Related Articles
              </h3>
              <div className="flex flex-col gap-3">
                {RELATED_ARTICLES.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/blog/${article.slug}`}
                    className="group flex flex-col gap-1 p-3 rounded-xl hover:bg-neutral-50 transition-colors"
                  >
                    <span className="inline-block bg-brand-primary-lighter text-brand-primary text-xs font-semibold px-2 py-0.5 rounded-full w-fit mb-1">
                      {article.category}
                    </span>
                    <span className="text-sm font-semibold text-neutral-900 group-hover:text-brand-primary transition-colors leading-snug">
                      {article.title}
                    </span>
                    <span className="text-xs text-neutral-400 flex items-center gap-1">
                      <Clock className="size-3" />
                      {article.readTime}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter Widget */}
            <div className="bg-brand-primary-lighter border border-brand-primary/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="size-5 text-brand-primary" />
                <h3 className="text-base font-bold text-brand-primary font-heading">
                  Property insights, weekly
                </h3>
              </div>
              <p className="text-sm text-neutral-700 mb-4 leading-relaxed">
                Get expert guidance for every stage of your property journey, straight to your inbox.
              </p>
              <label htmlFor="sidebar-email" className="sr-only">
                Email address
              </label>
              <input
                id="sidebar-email"
                type="email"
                placeholder="Your email address"
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-brand-primary/20 bg-white outline-none focus:ring-2 focus:ring-brand-primary/20 text-neutral-900 placeholder:text-neutral-400 mb-3"
              />
              <Button className="w-full bg-brand-primary text-white hover:bg-brand-primary-light text-sm font-semibold">
                Subscribe
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
