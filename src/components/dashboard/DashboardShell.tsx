/**
 * Shared dashboard layout shell.
 * Provides greeting, responsive stat card grid, content area, and activity feed.
 * Server component wrapper -- client children handle interactivity.
 */

import type { UserRole } from "@/types/auth";

const ROLE_LABELS: Record<UserRole, string> = {
  homebuyer: "Homebuyer",
  renter: "Renter",
  seller: "Seller",
  landlord: "Landlord",
  agent: "Estate Agent",
  service_provider: "Service Provider",
  mortgage_broker: "Mortgage Broker",
};

export function DashboardShell({
  role,
  title,
  displayName,
  children,
  sidebar,
}: Readonly<{
  role: UserRole;
  title?: string;
  displayName?: string;
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}>) {
  const greeting = displayName
    ? `Welcome back, ${displayName}`
    : `Welcome back`;

  const heading = title ?? `${ROLE_LABELS[role]} Dashboard`;

  return (
    <div className="flex flex-col gap-6">
      {/* Header — Stitch editorial: eyebrow above a large heading */}
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
          {greeting}
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
          {heading}
        </h1>
      </div>

      {/* Main layout: content + sidebar */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Content area */}
        <div className="flex flex-1 flex-col gap-6">
          {children}
        </div>

        {/* Sidebar (activity feed) -- below content on mobile, right on desktop */}
        {sidebar && (
          <aside className="w-full shrink-0 lg:w-80">
            {sidebar}
          </aside>
        )}
      </div>
    </div>
  );
}

/**
 * Responsive grid for stat cards.
 * 1 col on mobile, 2 cols on md, 3-4 cols on lg.
 */
export function StatCardGrid({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {children}
    </div>
  );
}
