import { CATEGORIES, type CategoryCard } from "@/app/(main)/marketplace/categories";

function CategoryTile({ slug, label, blurb, icon: Icon, href }: CategoryCard) {
  return (
    <a
      key={slug}
      href={href}
      className="group relative flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-brand-primary/40 hover:shadow-lg hover:shadow-brand-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900"
    >
      <span className="flex size-11 items-center justify-center rounded-xl bg-brand-primary-lighter text-brand-primary transition-colors group-hover:bg-brand-primary group-hover:text-white dark:bg-brand-primary/15 dark:text-brand-primary-light">
        <Icon className="size-5" />
      </span>
      <div>
        <h3 className="font-heading text-sm font-bold text-foreground dark:text-white">
          {label}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{blurb}</p>
      </div>
    </a>
  );
}

/**
 * Two-tier category grid: hands-on trades and property professionals. Every
 * tile links to a real implemented route (see `categories.ts`).
 */
export function CategoryGrid() {
  const trades = CATEGORIES.filter((c) => c.group === "trade");
  const professionals = CATEGORIES.filter((c) => c.group === "professional");

  return (
    <section
      aria-labelledby="categories-heading"
      className="mx-auto max-w-6xl px-6 py-20"
    >
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary-mid">
          Browse the directory
        </span>
        <h2
          id="categories-heading"
          className="font-heading text-3xl font-bold tracking-tight text-foreground dark:text-white"
        >
          What do you need done?
        </h2>
      </div>

      <div className="mt-10">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Trades
        </h3>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {trades.map((c) => (
            <CategoryTile key={c.slug} {...c} />
          ))}
        </div>
      </div>

      <div className="mt-12">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Property professionals
        </h3>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {professionals.map((c) => (
            <CategoryTile key={c.slug} {...c} />
          ))}
        </div>
      </div>
    </section>
  );
}
