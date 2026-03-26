"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, User, LayoutDashboard, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SavedBadge } from "./SavedBadge";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

type AuthButtonsProps = Readonly<{
  user: SupabaseUser | null;
  transparent?: boolean;
}>;

export function AuthButtons({ user, transparent = false }: AuthButtonsProps) {
  const router = useRouter();

  if (user) {
    const initial = user.email?.[0]?.toUpperCase();
    const displayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.display_name ||
      user.email;

    async function handleSignOut() {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    }

    return (
      <div className="hidden items-center gap-1 md:flex">
        <SavedBadge transparent={transparent} />

        <Link
          href="/dashboard/notifications"
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

        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
            aria-label="Account menu"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-brand-primary text-sm font-medium text-white transition-opacity hover:opacity-90">
              {initial ?? <User className="size-4" />}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56"
            align="end"
            sideOffset={8}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-medium text-white">
                    {initial ?? <User className="size-4" />}
                  </span>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium text-neutral-900">
                      {displayName}
                    </span>
                    {user.email && (
                      <span className="truncate text-xs text-neutral-500">
                        {user.email}
                      </span>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => router.push("/dashboard")}
              >
                <LayoutDashboard className="size-4" />
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push("/settings")}
              >
                <Settings className="size-4" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={handleSignOut}
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
