import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Compass, KeyRound, Scale } from "lucide-react";
import { NewsletterForm } from "@/components/blog/NewsletterForm";
import { getPostBySlug } from "@/content/blog";
import {
  JOURNEY_STAGES,
  getHubPosts,
  getHubPostsByStage,
} from "@/content/blog/hub";
import type { JourneyStage } from "@/content/blog/types";

const SITE = "https://truedeed.co.uk";
const CANONICAL = `${SITE}/blog/first-time-buyers`;

export const metadata: Metadata = {
  title: "First-Time Buyer Guide 2026: 20 Essential Guides | TrueDeed",
  description:
    "The complete first-time buyer hub for 2026 — 20 expert UK guides on deposits, mortgages, schemes, surveys, conveyancing and completion, in one place.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "First-Time Buyer Guide 2026 | TrueDeed",
    description:
      "20 expert UK guides for first-time buyers — deposits, mortgages, schemes, conveyancing and completion, organised by your buying journey.",
    type: "website",
    url: CANONICAL,
  },
};

const STAGE_META: Record<
  JourneyStage,
  { icon: typeof Compass; blurb: string }
> = {
  Awareness: {
    icon: Compass,
    blurb:
      "Getting started — understand the journey and build your deposit before you start viewing.",
  },
  Consideration: {
    icon: Scale,
    blurb:
      "Weighing it up — mortgages, government schemes, and the type of home that fits your budget.",
  },
  Decision: {
    icon: KeyRound,
    blurb:
      "Sealing the deal — surveys, chains, exchange and completion, right through to picking up the keys.",
  },
};

function ArticleCard({ slug }: { slug: string }) {
  const post = getPostBySlug(slug);
  if (!post) return null;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white transition-shadow hover:shadow-md">
      <Link
        href={`/blog/${post.slug}`}
        className="flex flex-1 flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-100">
          <Image
            src={post.heroImage}
            alt={post.heroAlt}
            width={480}
            height={270}
            loading="lazy"
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-1 flex-col p-5">
          <span className="mb-2 w-fit rounded-full bg-brand-primary-lighter px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-brand-primary">
            {post.category}
          </span>
          <h3 className="mb-2 font-heading text-base font-bold leading-snug text-neutral-900 transition-colors group-hover:text-brand-primary">
            {post.title}
          </h3>
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-neutral-600">
            {post.excerpt}
          </p>
          <div className="mt-auto flex items-center gap-2 text-xs text-neutral-500">
            <Clock className="size-3 shrink-0" />
            <span>{post.readTime}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function FirstTimeBuyerHubPage() {
  const pillar = getPostBySlug("how-to-buy-a-house-uk");
  const byStage = getHubPostsByStage();
  const hubPosts = getHubPosts();

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "First-Time Buyer Guide 2026",
    description: metadata.description,
    url: CANONICAL,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: hubPosts.length,
      itemListElement: hubPosts.map((post, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE}/blog/${post.slug}`,
        name: post.title,
      })),
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
      {
        "@type": "ListItem",
        position: 3,
        name: "First-Time Buyers",
        item: CANONICAL,
      },
    ],
  };

  return (
    <div className="bg-surface">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* ── Hero ── */}
      <section
        aria-labelledby="ftb-hero-heading"
        className="border-b border-brand-primary/10 bg-brand-primary-lighter/50"
      >
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <nav
            className="mb-6 flex items-center gap-2 text-sm text-neutral-500"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="transition-colors hover:text-brand-primary">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href="/blog"
              className="transition-colors hover:text-brand-primary"
            >
              Blog
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-neutral-900">First-Time Buyers</span>
          </nav>

          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-primary">
              The First-Time Buyer Hub
            </p>
            <h1
              id="ftb-hero-heading"
              className="font-heading text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl"
            >
              Buy your first home with confidence
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-neutral-600">
              Twenty expert, up-to-date UK guides that walk you through every
              stage of buying your first home in 2026 — from your first savings
              target to picking up the keys. Follow them in order, or jump to the
              stage you have reached.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/tools/affordability-calculator"
                className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-light"
              >
                Check what you can afford
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 rounded-full border border-brand-primary/30 bg-white px-6 py-3 text-sm font-semibold text-brand-primary transition-colors hover:bg-brand-primary-lighter"
              >
                Browse first homes
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* ── Start-here pillar ── */}
        {pillar ? (
          <section aria-labelledby="start-here-heading" className="mb-16">
            <h2 id="start-here-heading" className="sr-only">
              Start here
            </h2>
            <Link
              href={`/blog/${pillar.slug}`}
              className="group grid overflow-hidden rounded-3xl border border-brand-primary/15 bg-white transition-shadow hover:shadow-lg lg:grid-cols-2"
            >
              <div className="relative min-h-[240px] overflow-hidden bg-neutral-100">
                <Image
                  src={pillar.heroImage}
                  alt={pillar.heroAlt}
                  width={800}
                  height={600}
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col justify-center p-8 lg:p-10">
                <span className="mb-3 w-fit rounded-full bg-brand-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  Start here
                </span>
                <h3 className="mb-3 font-heading text-2xl font-bold leading-snug text-neutral-900 lg:text-3xl">
                  {pillar.title}
                </h3>
                <p className="mb-5 text-base leading-relaxed text-neutral-600">
                  {pillar.excerpt}
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary">
                  Read the complete guide
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          </section>
        ) : null}

        {/* ── Journey stages ── */}
        <div className="space-y-16">
          {JOURNEY_STAGES.map((stage) => {
            const posts = byStage[stage];
            if (posts.length === 0) return null;
            const { icon: Icon, blurb } = STAGE_META[stage];

            return (
              <section
                key={stage}
                aria-labelledby={`stage-${stage}`}
                className="scroll-mt-8"
              >
                <div className="mb-6 flex items-start gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-primary-lighter text-brand-primary">
                    <Icon className="size-6" />
                  </span>
                  <div>
                    <h2
                      id={`stage-${stage}`}
                      className="font-heading text-2xl font-bold text-neutral-900"
                    >
                      {stage}
                    </h2>
                    <p className="mt-1 max-w-2xl text-base leading-relaxed text-neutral-600">
                      {blurb}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {posts.map((post) => (
                    <ArticleCard key={post.slug} slug={post.slug} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* ── Newsletter ── */}
        <section className="mt-16 rounded-3xl border border-brand-primary/10 bg-brand-primary-lighter p-8 sm:p-10">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-2 font-heading text-2xl font-bold text-brand-primary">
              First-time buyer tips, weekly
            </h2>
            <p className="mb-6 text-base leading-relaxed text-neutral-700">
              Join our newsletter for practical guidance on saving, mortgages and
              schemes — written for buyers getting on the ladder.
            </p>
            <div className="mx-auto max-w-md text-left">
              <NewsletterForm source="first-time-buyer-hub" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
