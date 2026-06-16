import type { ReactNode } from "react";

type Props = Readonly<{
  title: string;
  description?: string;
  /** Optional uppercase eyebrow above the title (Stitch editorial header). */
  eyebrow?: string;
  actions?: ReactNode;
}>;

export function AdminPageHeader({ title, description, eyebrow, actions }: Props) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
            {eyebrow}
          </p>
        )}
        <h1 className="font-heading text-2xl font-bold text-neutral-900 md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-neutral-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
