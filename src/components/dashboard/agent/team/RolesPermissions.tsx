"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import type { TeamRole } from "@/types/agent";
import { TEAM_ROLES } from "@/types/agent";

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
  senior_negotiator: "Senior Negotiator",
  negotiator: "Negotiator",
  lettings_manager: "Lettings Manager",
  viewer: "Viewer",
};

const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  admin: "Full access to all features",
  senior_negotiator: "Manage listings, leads, and offers",
  negotiator: "Handle day-to-day client interactions",
  lettings_manager: "Manage lettings pipeline",
  viewer: "Read-only access",
};

type PermKey = string; // e.g. "Listings-View"

const DEFAULT_PERMISSIONS: Record<TeamRole, Record<PermKey, boolean>> = {
  admin: Object.fromEntries(
    PERMISSION_MATRIX.flatMap(({ category, perms }) =>
      perms.map((p) => [`${category}-${p}`, true]),
    ),
  ),
  senior_negotiator: {
    "Listings-View": true, "Listings-Create": true, "Listings-Edit": true, "Listings-Archive": true,
    "Leads-View": true, "Leads-Manage": true, "Leads-Assign": true,
    "Offers-View": true, "Offers-Manage": true, "Offers-Negotiate": true,
    "Viewings-View": true, "Viewings-Manage": true,
    "CRM-View": true, "CRM-Edit": true,
    "Analytics-View": true,
    "Team-Manage": false,
    "Billing-View": false, "Billing-Manage": false,
  },
  negotiator: {
    "Listings-View": true, "Listings-Create": true, "Listings-Edit": true, "Listings-Archive": false,
    "Leads-View": true, "Leads-Manage": true, "Leads-Assign": false,
    "Offers-View": true, "Offers-Manage": true, "Offers-Negotiate": false,
    "Viewings-View": true, "Viewings-Manage": true,
    "CRM-View": true, "CRM-Edit": true,
    "Analytics-View": false,
    "Team-Manage": false,
    "Billing-View": false, "Billing-Manage": false,
  },
  lettings_manager: {
    "Listings-View": true, "Listings-Create": true, "Listings-Edit": true, "Listings-Archive": true,
    "Leads-View": true, "Leads-Manage": true, "Leads-Assign": true,
    "Offers-View": true, "Offers-Manage": true, "Offers-Negotiate": true,
    "Viewings-View": true, "Viewings-Manage": true,
    "CRM-View": true, "CRM-Edit": true,
    "Analytics-View": true,
    "Team-Manage": false,
    "Billing-View": false, "Billing-Manage": false,
  },
  viewer: {
    "Listings-View": true, "Listings-Create": false, "Listings-Edit": false, "Listings-Archive": false,
    "Leads-View": true, "Leads-Manage": false, "Leads-Assign": false,
    "Offers-View": true, "Offers-Manage": false, "Offers-Negotiate": false,
    "Viewings-View": true, "Viewings-Manage": false,
    "CRM-View": true, "CRM-Edit": false,
    "Analytics-View": true,
    "Team-Manage": false,
    "Billing-View": false, "Billing-Manage": false,
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
  const [permissions, setPermissions] = useState<Record<TeamRole, Record<PermKey, boolean>>>(
    () => loadSaved() ?? DEFAULT_PERMISSIONS,
  );

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
          <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground">Configure what each role can access and manage</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset}>Reset Defaults</Button>
          <Button onClick={save}>Save Changes</Button>
        </div>
      </div>

      {/* Role descriptions */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {TEAM_ROLES.map((role) => (
          <Card key={role} className="p-3">
            <p className="font-semibold text-sm">{ROLE_LABELS[role]}</p>
            <p className="text-xs text-muted-foreground mt-1">{ROLE_DESCRIPTIONS[role]}</p>
          </Card>
        ))}
      </div>

      {/* Permission table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permission Matrix</CardTitle>
          <CardDescription>Toggle permissions per role. Changes are saved locally.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium w-48">Permission</th>
                {TEAM_ROLES.map((role) => (
                  <th key={role} className="px-4 py-3 text-center font-medium min-w-[120px]">
                    {ROLE_LABELS[role]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_MATRIX.map(({ category, perms }, catIdx) => (
                <>
                  {perms.map((perm, permIdx) => {
                    const key = `${category}-${perm}`;
                    return (
                      <tr
                        key={key}
                        className={`border-b ${catIdx % 2 === 0 ? "bg-white" : "bg-muted/20"}`}
                      >
                        <td className="px-4 py-2">
                          {permIdx === 0 && (
                            <span className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
                              {category}
                            </span>
                          )}
                          <br />
                          <span className="text-sm">{perm}</span>
                        </td>
                        {TEAM_ROLES.map((role) => (
                          <td key={role} className="px-4 py-2 text-center">
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
                  })}
                </>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
