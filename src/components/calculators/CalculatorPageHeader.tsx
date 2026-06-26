type CalculatorPageHeaderProps = Readonly<{
  /** Page title rendered as the single <h1>. */
  title: string;
  /** Optional supporting copy under the title. */
  description?: string;
  /** Optional extra hero content (badge, stat row) rendered under the description. */
  children?: React.ReactNode;
}>;

/**
 * Shared hero header for every `/tools/*` calculator page.
 *
 * Single source of truth for calculator title size, weight, and alignment so
 * the pages can never drift apart again (the original bug: each page hand-rolled
 * its own <h1> — some centered `text-4xl font-bold`, others left `md:text-5xl
 * font-extrabold`). All calculator titles now render left-aligned at
 * `text-4xl md:text-5xl font-extrabold`, matching the mortgage calculator.
 *
 * Breadcrumbs are intentionally NOT rendered here — the global
 * `BreadcrumbsWrapper` in `(main)/layout.tsx` already emits a path-based
 * breadcrumb trail (with BreadcrumbList JSON-LD) for every page, so rendering a
 * second one here would duplicate it.
 */
export function CalculatorPageHeader({
  title,
  description,
  children,
}: CalculatorPageHeaderProps) {
  return (
    <div className="mb-12">
      <h1 className="mb-4 font-heading text-4xl font-extrabold tracking-tight text-neutral-900 md:text-5xl dark:text-white">
        {title}
      </h1>
      {description ? (
        <p className="max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
          {description}
        </p>
      ) : null}
      {children}
    </div>
  );
}
