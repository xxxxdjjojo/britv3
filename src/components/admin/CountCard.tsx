import Link from "next/link";
import * as LucideIcons from "lucide-react";
import type { LucideProps } from "lucide-react";

type CountCardProps = Readonly<{
  title: string;
  count: number;
  href: string;
  icon: string;
}>;

export function CountCard({ title, count, href, icon }: CountCardProps) {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<LucideProps>>)[icon];

  return (
    <Link
      href={href}
      className="block rounded-lg border border-neutral-200 bg-white p-6 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        {Icon ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary-lighter">
            <Icon className="h-5 w-5 text-brand-primary" />
          </div>
        ) : null}
        <div>
          <p className="text-3xl font-bold text-neutral-900">
            {count.toLocaleString()}
          </p>
          <p className="text-sm font-medium text-neutral-500">{title}</p>
        </div>
      </div>
    </Link>
  );
}
