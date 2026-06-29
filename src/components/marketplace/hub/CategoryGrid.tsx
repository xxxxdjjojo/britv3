import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { CATEGORIES, type CategoryCard } from "@/app/(main)/marketplace/categories";

function CategoryTile({ slug, label, blurb, icon: Icon, href }: CategoryCard) {
  return (
    <a
      key={slug}
      href={href}
      className="group flex flex-col gap-4 rounded-2xl border border-border bg-brand-primary-lighter/40 p-6 transition-all hover:-translate-y-1 hover:border-brand-primary/40 hover:shadow-xl hover:shadow-brand-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:border-slate-800 dark:bg-slate-900"
    >
      <span className="flex size-14 items-center justify-center rounded-xl bg-white text-brand-primary shadow-sm transition-colors group-hover:bg-brand-primary group-hover:text-white dark:bg-slate-800 dark:text-brand-primary-light">
        <Icon className="size-7" />
      </span>
      <div>
        <h3 className="font-heading text-lg font-bold text-brand-primary-dark dark:text-white">
          {label}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
      </div>
    </a>
  );
}

/**
 * "Popular Categories" grid. Renders every real category from `categories.ts`
 * (each tile links to a real implemented route) followed by a "Browse All"
 * tile pointing at the full services directory.
 */
export function CategoryGrid() {
  return (
    <section
      aria-labelledby="categories-heading"
      className="bg-white py-24 dark:bg-slate-900/40"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex items-end justify-between gap-4">
          <div className="text-left">
            <h2
              id="categories-heading"
              className="font-heading text-3xl font-bold tracking-tight text-brand-primary-dark dark:text-white"
            >
              Popular Categories
            </h2>
            <p className="mt-2 text-muted-foreground">
              Our most requested home improvement services and property
              professionals.
            </p>
          </div>
          <Link
            href="/services"
            className="hidden items-center gap-2 text-sm font-semibold text-brand-primary transition-all hover:gap-3 dark:text-brand-primary-light sm:flex"
          >
            Browse all categories
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <CategoryTile key={c.slug} {...c} />
          ))}

          {/* Browse all tile → full services directory */}
          <Link
            href="/services"
            className="group flex flex-col items-center justify-center gap-4 rounded-2xl border border-brand-primary/20 bg-brand-primary-lighter p-6 text-center transition-all hover:bg-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:border-brand-primary/30 dark:bg-brand-primary/15"
          >
            <Compass className="size-9 text-brand-primary transition-colors group-hover:text-white dark:text-brand-primary-light" />
            <h3 className="font-heading text-lg font-bold text-brand-primary transition-colors group-hover:text-white dark:text-brand-primary-light">
              Browse All 40+ Services
            </h3>
          </Link>
        </div>

        <div className="mt-10 flex justify-center sm:hidden">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary dark:text-brand-primary-light"
          >
            Browse all categories
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
