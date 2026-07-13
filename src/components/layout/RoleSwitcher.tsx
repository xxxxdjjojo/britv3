"use client";

import { useState } from "react";
import { useRole } from "@/hooks/useRole";
import { ROLES } from "@/lib/constants";
import type { UserRole } from "@/types/auth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  Key,
  Tag,
  Building,
  Briefcase,
  Wrench,
  ChevronDown,
  Check,
  Loader2,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  Key,
  Tag,
  Building,
  Briefcase,
  Wrench,
};

function getRoleDefinition(role: UserRole) {
  return ROLES.find((r) => r.value === role);
}

export function RoleSwitcher() {
  const { roles, activeRole, switchRole, loading } = useRole();
  const [switching, setSwitching] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Loader2 className="size-4 animate-spin text-neutral-400" />
        <span className="text-sm text-neutral-400">Loading...</span>
      </div>
    );
  }

  const activeRoleDef = activeRole ? getRoleDefinition(activeRole) : null;
  const ActiveIcon = activeRoleDef ? ICON_MAP[activeRoleDef.icon] : null;

  async function handleSwitch(role: UserRole) {
    if (role === activeRole) return;
    setSwitching(true);
    await switchRole(role);
    setSwitching(false);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full min-h-11 items-center justify-start gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none">
        {switching ? (
          <Loader2 className="size-4 animate-spin" />
        ) : ActiveIcon ? (
          <ActiveIcon className="size-4 text-brand-primary" />
        ) : null}
        <span className="flex-1 truncate text-left">
          {activeRoleDef?.label ?? "Select role"}
        </span>
        <ChevronDown className="size-4 text-neutral-400" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" sideOffset={4}>
        <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {roles.map((role) => {
          const def = getRoleDefinition(role);
          const Icon = def ? ICON_MAP[def.icon] : null;
          const isActive = role === activeRole;

          return (
            <DropdownMenuItem key={role} onClick={() => handleSwitch(role)}>
              {Icon && <Icon className="size-4" />}
              <span className="flex-1">{def?.label ?? role}</span>
              {isActive && <Check className="size-4 text-brand-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
