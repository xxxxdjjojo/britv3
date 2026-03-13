"use client";

import { useState } from "react";
import { ROLES } from "@/lib/constants";
import type { RoleDefinition } from "@/lib/constants";
import type { UserRole } from "@/types/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home,
  Key,
  Tag,
  Building,
  Briefcase,
  Wrench,
  Landmark,
  Check,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  Key,
  Tag,
  Building,
  Briefcase,
  Wrench,
  Landmark,
};

export function RoleSelector(
  props: Readonly<{
    onSubmit: (roles: UserRole[]) => void;
    loading?: boolean;
    roles?: readonly RoleDefinition[];
    singleSelect?: boolean;
  }>,
) {
  const roles = props.roles ?? ROLES;
  const [selectedRoles, setSelectedRoles] = useState<Set<UserRole>>(new Set());

  function toggleRole(role: UserRole) {
    setSelectedRoles((prev) => {
      if (props.singleSelect) {
        return new Set([role]);
      }
      const next = new Set(prev);
      if (next.has(role)) {
        next.delete(role);
      } else {
        next.add(role);
      }
      return next;
    });
  }

  function handleSubmit() {
    if (selectedRoles.size > 0) {
      props.onSubmit([...selectedRoles]);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => {
          const Icon = ICON_MAP[role.icon];
          const isSelected = selectedRoles.has(role.value);

          return (
            <button
              key={role.value}
              type="button"
              onClick={() => toggleRole(role.value)}
              className={cn(
                "relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all",
                isSelected
                  ? "border-brand-primary bg-brand-primary/5"
                  : "border-neutral-200 bg-white hover:border-neutral-300",
              )}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 flex size-6 items-center justify-center rounded-full bg-brand-primary">
                  <Check className="size-4 text-white" />
                </div>
              )}
              {Icon && (
                <Icon
                  className={cn(
                    "size-8",
                    isSelected ? "text-brand-primary" : "text-neutral-400",
                  )}
                />
              )}
              <div>
                <p className="font-medium text-neutral-900">{role.label}</p>
                <p className="mt-1 text-sm text-neutral-500">{role.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={selectedRoles.size === 0 || props.loading}
        className="w-full"
        size="lg"
      >
        {props.loading ? "Setting up..." : "Continue"}
      </Button>
    </div>
  );
}
