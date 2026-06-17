/**
 * InsightPanel — Stitch dark-green feature block.
 * Used for "Market Insight", "Refine Your Vision", "Privacy & Encryption", etc.
 * Deep-green surface, white text, optional gold CTA.
 */

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InsightPanelProps = Readonly<{
  title: string;
  children?: React.ReactNode;
  eyebrow?: string;
  icon?: LucideIcon;
  action?: { label: string; href: string };
  className?: string;
}>;

export function InsightPanel({
  title,
  children,
  eyebrow,
  icon: Icon,
  action,
  className,
}: InsightPanelProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-xl bg-brand-primary p-6 text-white",
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary-dark via-brand-primary to-brand-primary" />
      <div className="pointer-events-none absolute -right-10 -bottom-10 size-40 rounded-full bg-white/5" />
      <div className="relative z-10 flex flex-col gap-3">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">
            {eyebrow}
          </p>
        )}
        <div className="flex items-center gap-2">
          {Icon && <Icon className="size-5 text-brand-gold" />}
          <h3 className="font-heading text-lg font-bold">{title}</h3>
        </div>
        {children && (
          <div className="text-sm leading-relaxed text-white/80">{children}</div>
        )}
        {action && (
          <Button
            asChild
            className="mt-1 w-fit gap-2 bg-brand-gold text-brand-gold-foreground hover:bg-brand-gold/90"
          >
            <Link href={action.href}>
              {action.label}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        )}
      </div>
    </section>
  );
}
