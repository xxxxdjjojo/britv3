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
      className="block rounded-xl bg-card p-5 shadow-sm ring-1 ring-neutral-200/60 transition hover:shadow-md dark:ring-neutral-700/60"
    >
      <div className="flex items-center gap-3">
        {Icon ? (
          <div className="rounded-lg bg-brand-primary-lighter p-2.5 dark:bg-brand-primary/20">
            <Icon className="size-5 text-brand-primary" />
          </div>
        ) : null}
        <div>
          <p className="font-body text-xs text-neutral-500">{title}</p>
          <p className="font-heading text-2xl font-bold text-foreground">
            {count.toLocaleString()}
          </p>
        </div>
      </div>
    </Link>
  );
}
