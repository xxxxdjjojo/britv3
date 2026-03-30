"use client";

import { useState } from "react";
import { ROLES } from "@/lib/constants";
import type { RoleDefinition } from "@/lib/constants";
import type { UserRole } from "@/types/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Check } from "lucide-react";
import {
  Home,
  Key,
  Tag,
  Building,
  Briefcase,
  Wrench,
  Landmark,
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
    <div className="space-y-5">
      {/* Role cards grid */}
      <div className="grid grid-cols-2 gap-3">
        {roles.map((role) => {
          const Icon = ICON_MAP[role.icon];
          const isSelected = selectedRoles.has(role.value);

          return (
            <button
              key={role.value}
              type="button"
              onClick={() => toggleRole(role.value)}
              aria-label={`Select role: ${role.label}`}
              aria-pressed={isSelected}
              className={cn(
                "relative flex flex-col items-start gap-3 rounded-xl border-2 p-4 text-left transition-all duration-150",
                isSelected
                  ? "border-brand-primary bg-brand-primary/5 shadow-sm"
                  : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm",
              )}
            >
              {/* Selected check */}
              {isSelected && (
                <div className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-brand-primary" aria-hidden="true">
                  <Check className="size-3 text-white" />
                </div>
              )}

              {/* Icon */}
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  isSelected
                    ? "bg-brand-primary/10"
                    : "bg-neutral-100",
                )}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      "size-5",
                      isSelected ? "text-brand-primary" : "text-neutral-500",
                    )}
                  />
                )}
              </div>

              {/* Label & description */}
              <div>
                <p className={cn(
                  "text-sm font-semibold leading-tight",
                  isSelected ? "text-brand-primary" : "text-neutral-900",
                )}>
                  {role.label}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-neutral-500 line-clamp-2">
                  {role.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Continue button */}
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={selectedRoles.size === 0 || props.loading}
        size="lg"
        className="w-full h-11 rounded-lg bg-brand-primary font-semibold text-white hover:bg-brand-primary-light transition-colors shadow-sm disabled:opacity-40"
        aria-label={props.loading ? "Setting up your account…" : "Continue with selected role"}
      >
        {props.loading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Setting up…
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="size-4" aria-hidden="true" />
          </>
        )}
      </Button>
    </div>
  );
}
