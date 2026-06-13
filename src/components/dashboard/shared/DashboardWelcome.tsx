
/**
 * Welcome banner for dashboard pages.
 * Displays a greeting, contextual message, and optional CTA buttons.
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

type WelcomeAction = {
  label: string;
  href: string;
  variant?: "default" | "outline" | "ghost";
  icon?: LucideIcon;
};

export function DashboardWelcome({
  name,
  message,
  actions,
  variant = "default",
}: Readonly<{
  name: string;
  message?: string;
  actions?: WelcomeAction[];
  variant?: "default" | "hero";
}>) {
  const greeting = getGreeting();

  if (variant === "hero") {
    return (
      <section className="relative overflow-hidden rounded-2xl bg-brand-primary p-8 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary-dark via-brand-primary to-brand-primary" />
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/5" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <h1 className="text-3xl font-extrabold tracking-tight font-heading">
            {greeting}, {name}.
          </h1>
          {message && (
            <p className="text-lg leading-relaxed text-white/80">
              {message}
            </p>
          )}
          {actions && actions.length > 0 && (
            <div className="flex flex-wrap gap-3 pt-2">
              {actions.map((action) => (
                <Button
                  key={action.label}
                  asChild
                  variant={action.variant ?? "default"}
                  className={
                    action.variant === "outline"
                      ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
                      : "bg-brand-gold text-brand-gold-foreground hover:bg-brand-gold/90"
                  }
                >
                  <Link href={action.href}>
                    {action.icon && <action.icon className="mr-2 size-4" />}
                    {action.label}
                  </Link>
                </Button>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-bold tracking-tight font-heading">
        {greeting}, {name}.
      </h1>
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
