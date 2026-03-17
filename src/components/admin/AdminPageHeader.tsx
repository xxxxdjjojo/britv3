import type { ReactNode } from "react";

type Props = Readonly<{
  title: string;
  description?: string;
  actions?: ReactNode;
}>;

export function AdminPageHeader({ title, description, actions }: Props) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1
          className="text-2xl font-semibold text-neutral-900"
          style={{ fontFamily: "Plus Jakarta Sans" }}
        >
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
