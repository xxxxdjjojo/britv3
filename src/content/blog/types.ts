/**
 * Blog content model — the single source of truth for the TrueDeed blog.
 *
 * Both the index (`/blog`) and the article page (`/blog/[slug]`) read from this
 * module. Each article is one file under `posts/` exporting a `BlogPost`.
 */

export const BLOG_CATEGORIES = [
  "Buying",
  "Renting",
  "Selling",
  "Landlord Tips",
  "Market News",
  "Legal & Finance",
  "Investing",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export type ArticleBlock =
  | { type: "paragraph"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "blockquote"; text: string }
  | { type: "list"; items: readonly string[] }
  | { type: "cta"; text: string; href: string; label: string };

export type BlogAuthor = Readonly<{
  name: string;
  initials: string;
  title: string;
  bio: string;
}>;

export type BlogPost = Readonly<{
  /** URL slug, e.g. "stamp-duty-first-time-buyer-guide". */
  slug: string;
  title: string;
  /** Short summary shown on cards and as the meta description fallback. */
  excerpt: string;
  category: BlogCategory;
  author: BlogAuthor;
  /** ISO 8601 publish date, e.g. "2026-06-20" — used for sorting + JSON-LD. */
  date: string;
  /** Human-readable date label, e.g. "20 June 2026". */
  dateLabel: string;
  /** Reading time, e.g. "8 min read". */
  readTime: string;
  /** Public hero image path, e.g. "/blog/stamp-duty-first-time-buyer-guide.webp". */
  heroImage: string;
  /** Descriptive alt text for the hero image. */
  heroAlt: string;
  /** Target keywords for SEO + related-post matching. */
  keywords: readonly string[];
  seo: Readonly<{ title: string; description: string }>;
  body: readonly ArticleBlock[];
  /** At most one post should be featured per category surface. */
  featured?: boolean;
}>;
