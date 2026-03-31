import type { ReactNode } from "react";

type Props = Readonly<{
  title: string;
  description?: string;
  actions?: ReactNode;
}>;

export function AdminPageHeader({ title, description, actions }: Props) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="font-heading text-xl font-semibold text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-1 font-body text-sm text-neutral-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
