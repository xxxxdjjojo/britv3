import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

type InternalLinkCardProps = Readonly<{ title: string; description: string; href: string; icon?: ReactNode }>;

export function InternalLinkCard({ title, description, href, icon }: InternalLinkCardProps) {
  return (
    <Link href={href} className="group flex items-center gap-4 bg-white dark:bg-neutral-900 border border-primary/10 rounded-xl p-4 hover:shadow-md hover:border-primary/20 transition-all">
      {icon && <div className="flex-shrink-0 text-primary">{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-neutral-900 dark:text-neutral-100 text-sm group-hover:text-primary transition-colors">{title}</p>
        <p className="text-xs text-neutral-500 truncate">{description}</p>
      </div>
      <ArrowRight className="size-4 text-neutral-300 group-hover:text-primary transition-colors flex-shrink-0" />
    </Link>
  );
}
