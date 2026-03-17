"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Home,
  MessageSquare,
  Eye,
  BarChart2,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard/seller", icon: LayoutDashboard },
  { label: "My Listings", href: "/dashboard/seller/listings", icon: Home },
  { label: "Enquiries", href: "/dashboard/seller/enquiries", icon: MessageSquare },
  { label: "Viewings", href: "/dashboard/seller/viewings", icon: Eye },
  { label: "Market Analytics", href: "/dashboard/seller/analytics", icon: BarChart2 },
  { label: "Settings", href: "/dashboard/seller/settings", icon: Settings },
] as const;

type Props = Readonly<{
  userName: string;
  avatarUrl: string | null;
}>;

export function SellerSidebar({ userName, avatarUrl }: Props) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-[#1B4D3E] flex flex-col z-40">
      <div className="px-6 py-6 border-b border-white/10">
        <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-white tracking-tight">
          britestate
        </span>
        <p className="text-white/60 text-xs mt-0.5">Seller Portal</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = href === "/dashboard/seller"
            ? pathname === href
            : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                active
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <span className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                active ? "bg-white/20" : "bg-white/10",
              )}>
                <Icon size={16} />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10">
          {avatarUrl ? (
            <img src={avatarUrl} alt={userName} className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{userName}</p>
            <p className="text-white/50 text-xs">Premium Seller</p>
          </div>
          <Link href="/logout" className="text-white/40 hover:text-white transition-colors" title="Sign out">
            <LogOut size={14} />
          </Link>
        </div>
      </div>
    </aside>
  );
}
