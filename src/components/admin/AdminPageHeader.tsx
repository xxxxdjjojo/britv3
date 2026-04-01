import type { ReactNode } from "react";

type Props = Readonly<{
  title: string;
  label?: string;
  description?: string;
  actions?: ReactNode;
}>;

export function AdminPageHeader({ title, label = "System Overview", description, actions }: Props) {
  return (
    <div className="flex items-end justify-between mb-8">
      <div className="space-y-1">
        <span className="font-body text-[10px] tracking-[0.15em] text-brand-secondary-dark font-semibold uppercase block">
          {label}
        </span>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight text-brand-primary-dark">
          {title}
        </h1>
        {description && (
          <p className="font-body text-sm text-neutral-500 mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
