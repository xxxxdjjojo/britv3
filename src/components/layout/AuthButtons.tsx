"use client";

import Link from "next/link";
import { Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { SavedBadge } from "./SavedBadge";
import type { User as SupabaseUser } from "@supabase/supabase-js";

type AuthButtonsProps = Readonly<{
  user: SupabaseUser | null;
  transparent?: boolean;
}>;

export function AuthButtons({ user, transparent = false }: AuthButtonsProps) {
  if (user) {
    const initial = user.email?.[0]?.toUpperCase();

    return (
      <div className="hidden items-center gap-1 md:flex">
        <SavedBadge transparent={transparent} />

        <Link
          href={ROUTES.notifications}
          className={cn(
            "relative inline-flex items-center justify-center rounded-lg p-2 transition-colors",
            transparent
              ? "text-white/80 hover:text-white hover:bg-white/10"
              : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100",
          )}
          aria-label="Notifications"
        >
          <Bell className="size-5" />
        </Link>

        <Link
          href="/dashboard"
          className="flex items-center justify-center rounded-full"
          aria-label="Your dashboard"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-brand-primary text-sm font-medium text-white">
            {initial ?? <User className="size-4" />}
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-2 md:flex">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/login">Sign In</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/register">List Property</Link>
      </Button>
    </div>
  );
}
