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
      className="group block rounded-xl bg-white p-6 shadow-[0_20px_50px_rgba(26,28,28,0.03)] transition-all duration-500 hover:bg-brand-primary-dark cursor-pointer"
    >
      <p className="font-body text-[10px] tracking-[0.1em] text-neutral-500 group-hover:text-brand-primary-lighter/70 uppercase mb-4">
        {title}
      </p>
      <div className="flex flex-col">
        {Icon ? (
          <div className="flex items-end justify-between">
            <p className="font-heading text-3xl font-extrabold text-brand-primary-dark group-hover:text-white leading-none">
              {count.toLocaleString()}
            </p>
            <div className="rounded-lg bg-brand-primary-lighter p-2 group-hover:bg-white/10">
              <Icon className="size-4 text-brand-primary group-hover:text-brand-primary-light" />
            </div>
          </div>
        ) : (
          <p className="font-heading text-3xl font-extrabold text-brand-primary-dark group-hover:text-white leading-none">
            {count.toLocaleString()}
          </p>
        )}
      </div>
    </Link>
  );
}
