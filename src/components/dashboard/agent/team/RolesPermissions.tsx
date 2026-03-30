"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import type { TeamRole } from "@/types/agent";
import { TEAM_ROLES } from "@/types/agent";
import { ShieldCheck } from "lucide-react";

const PERMISSION_MATRIX = [
  { category: "Listings", perms: ["View", "Create", "Edit", "Archive"] },
  { category: "Leads", perms: ["View", "Manage", "Assign"] },
  { category: "Offers", perms: ["View", "Manage", "Negotiate"] },
  { category: "Viewings", perms: ["View", "Manage"] },
  { category: "CRM", perms: ["View", "Edit"] },
  { category: "Analytics", perms: ["View"] },
  { category: "Team", perms: ["Manage"] },
  { category: "Billing", perms: ["View", "Manage"] },
];

const ROLE_LABELS: Record<TeamRole, string> = {
  admin: "Admin",
  senior_negotiator: "Senior Neg.",
  negotiator: "Negotiator",
  lettings_manager: "Lettings Mgr",
  viewer: "Viewer",
};

const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  admin: "Full access to all features",
  senior_negotiator: "Manage listings, leads & offers",
  negotiator: "Day-to-day client interactions",
  lettings_manager: "Manage lettings pipeline",
  viewer: "Read-only access",
};

const ROLE_BADGE: Record<TeamRole, { bg: string; text: string }> = {
  admin: { bg: "bg-error-light", text: "text-error" },
  senior_negotiator: { bg: "bg-info-light", text: "text-info" },
  negotiator: { bg: "bg-success-light", text: "text-success" },
  lettings_manager: {
    bg: "bg-brand-primary-lighter",
    text: "text-brand-primary",
  },
  viewer: { bg: "bg-neutral-100", text: "text-neutral-500" },
};

type PermKey = string;

const DEFAULT_PERMISSIONS: Record<TeamRole, Record<PermKey, boolean>> = {
  admin: Object.fromEntries(
    PERMISSION_MATRIX.flatMap(({ category, perms }) =>
      perms.map((p) => [`${category}-${p}`, true]),
    ),
  ),
  senior_negotiator: {
    "Listings-View": true,
    "Listings-Create": true,
    "Listings-Edit": true,
    "Listings-Archive": true,
    "Leads-View": true,
    "Leads-Manage": true,
    "Leads-Assign": true,
    "Offers-View": true,
    "Offers-Manage": true,
    "Offers-Negotiate": true,
    "Viewings-View": true,
    "Viewings-Manage": true,
    "CRM-View": true,
    "CRM-Edit": true,
    "Analytics-View": true,
    "Team-Manage": false,
    "Billing-View": false,
    "Billing-Manage": false,
  },
  negotiator: {
    "Listings-View": true,
    "Listings-Create": true,
    "Listings-Edit": true,
    "Listings-Archive": false,
    "Leads-View": true,
    "Leads-Manage": true,
    "Leads-Assign": false,
    "Offers-View": true,
    "Offers-Manage": true,
    "Offers-Negotiate": false,
    "Viewings-View": true,
    "Viewings-Manage": true,
    "CRM-View": true,
    "CRM-Edit": true,
    "Analytics-View": false,
    "Team-Manage": false,
    "Billing-View": false,
    "Billing-Manage": false,
  },
  lettings_manager: {
    "Listings-View": true,
    "Listings-Create": true,
    "Listings-Edit": true,
    "Listings-Archive": true,
    "Leads-View": true,
    "Leads-Manage": true,
    "Leads-Assign": true,
    "Offers-View": true,
    "Offers-Manage": true,
    "Offers-Negotiate": true,
    "Viewings-View": true,
    "Viewings-Manage": true,
    "CRM-View": true,
    "CRM-Edit": true,
    "Analytics-View": true,
    "Team-Manage": false,
    "Billing-View": false,
    "Billing-Manage": false,
  },
  viewer: {
    "Listings-View": true,
    "Listings-Create": false,
    "Listings-Edit": false,
    "Listings-Archive": false,
    "Leads-View": true,
    "Leads-Manage": false,
    "Leads-Assign": false,
    "Offers-View": true,
    "Offers-Manage": false,
    "Offers-Negotiate": false,
    "Viewings-View": true,
    "Viewings-Manage": false,
    "CRM-View": true,
    "CRM-Edit": false,
    "Analytics-View": true,
    "Team-Manage": false,
    "Billing-View": false,
    "Billing-Manage": false,
  },
};

const STORAGE_KEY = "agent_permission_customizations";

function loadSaved(): Record<TeamRole, Record<PermKey, boolean>> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Record<TeamRole, Record<PermKey, boolean>>;
  } catch {
    return null;
  }
}

export function RolesPermissions() {
  const [permissions, setPermissions] = useState<
    Record<TeamRole, Record<PermKey, boolean>>
  >(() => loadSaved() ?? DEFAULT_PERMISSIONS);

  function toggle(role: TeamRole, key: PermKey) {
    setPermissions((prev) => ({
      ...prev,
      [role]: { ...prev[role], [key]: !prev[role][key] },
    }));
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(permissions));
      toast.success("Permission customizations saved");
    } catch {
      toast.error("Failed to save permissions");
    }
  }

  function reset() {
    setPermissions(DEFAULT_PERMISSIONS);
    localStorage.removeItem(STORAGE_KEY);
    toast.success("Permissions reset to defaults");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-neutral-900">
            Roles &amp; Permissions
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Configure what each role can access and manage
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={reset}
          >
            Reset Defaults
          </Button>
          <Button
            className="rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90"
            onClick={save}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {TEAM_ROLES.map((role) => {
          const badge = ROLE_BADGE[role];
          return (
            <div
              key={role}
              className="overflow-hidden rounded-2xl bg-white shadow-sm"
            >
              <div className={`px-3 py-2 ${badge.bg}`}>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className={`size-3.5 ${badge.text}`} />
                  <p className={`text-xs font-bold ${badge.text}`}>
                    {ROLE_LABELS[role]}
                  </p>
                </div>
              </div>
              <div className="px-3 py-2">
                <p className="text-[10px] leading-tight text-neutral-500">
                  {ROLE_DESCRIPTIONS[role]}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permission table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="bg-neutral-50 px-5 py-4">
          <p className="font-semibold text-neutral-900">Permission Matrix</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Toggle permissions per role. Admin permissions are fixed.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50">
                <th className="w-48 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Permission
                </th>
                {TEAM_ROLES.map((role) => {
                  const badge = ROLE_BADGE[role];
                  return (
                    <th
                      key={role}
                      className="min-w-[110px] px-4 py-3 text-center"
                    >
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${badge.bg} ${badge.text}`}
                      >
                        {ROLE_LABELS[role]}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_MATRIX.map(({ category, perms }, catIdx) =>
                perms.map((perm, permIdx) => {
                  const key = `${category}-${perm}`;
                  const isFirst = permIdx === 0;
                  return (
                    <tr
                      key={key}
                      className={
                        catIdx % 2 === 0 ? "bg-white" : "bg-neutral-50/50"
                      }
                    >
                      <td className="px-5 py-2.5">
                        {isFirst && (
                          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                            {category}
                          </p>
                        )}
                        <span className="text-sm text-neutral-700">
                          {perm}
                        </span>
                      </td>
                      {TEAM_ROLES.map((role) => (
                        <td key={role} className="px-4 py-2.5 text-center">
                          <Switch
                            checked={permissions[role][key] ?? false}
                            onCheckedChange={() => toggle(role, key)}
                            disabled={role === "admin"}
                            aria-label={`${ROLE_LABELS[role]} ${key}`}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
