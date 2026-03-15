"use client";

import { useState } from "react";
import type { TeamRole } from "@/types/agent";
import { TEAM_ROLES } from "@/types/agent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Save } from "lucide-react";

// ---- Role display -----------------------------------------------------------

const ROLE_LABELS: Record<TeamRole, string> = {
  admin: "Admin",
  senior_negotiator: "Senior Negotiator",
  negotiator: "Negotiator",
  lettings_manager: "Lettings Manager",
  viewer: "Viewer",
};

const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  admin: "Full access — manage team, billing, and all features",
  senior_negotiator: "Manage listings, leads, offers, and viewings",
  negotiator: "Create and manage own listings and leads",
  lettings_manager: "Manage rentals, tenancies, and leads",
  viewer: "Read-only access to listings and analytics",
};

// ---- Permissions matrix definition -----------------------------------------

type PermissionKey = string;

type PermissionCategory = {
  category: string;
  permissions: { key: PermissionKey; label: string }[];
};

const PERMISSION_MATRIX: PermissionCategory[] = [
  {
    category: "Listings",
    permissions: [
      { key: "listings.view", label: "View listings" },
      { key: "listings.create", label: "Create listings" },
      { key: "listings.edit", label: "Edit listings" },
      { key: "listings.archive", label: "Archive listings" },
    ],
  },
  {
    category: "Leads",
    permissions: [
      { key: "leads.view", label: "View leads" },
      { key: "leads.manage", label: "Manage leads" },
      { key: "leads.assign", label: "Assign leads" },
    ],
  },
  {
    category: "Offers",
    permissions: [
      { key: "offers.view", label: "View offers" },
      { key: "offers.manage", label: "Manage offers" },
      { key: "offers.negotiate", label: "Negotiate offers" },
    ],
  },
  {
    category: "Viewings",
    permissions: [
      { key: "viewings.view", label: "View viewings" },
      { key: "viewings.manage", label: "Manage viewings" },
    ],
  },
  {
    category: "CRM",
    permissions: [
      { key: "crm.view", label: "View clients" },
      { key: "crm.edit", label: "Edit clients" },
    ],
  },
  {
    category: "Analytics",
    permissions: [{ key: "analytics.view", label: "View analytics" }],
  },
  {
    category: "Team",
    permissions: [{ key: "team.manage", label: "Manage team" }],
  },
  {
    category: "Billing",
    permissions: [
      { key: "billing.view", label: "View billing" },
      { key: "billing.manage", label: "Manage billing" },
    ],
  },
];

// ---- Default permissions per role ------------------------------------------

type PermissionSet = Record<PermissionKey, boolean>;

const DEFAULT_PERMISSIONS: Record<TeamRole, PermissionSet> = {
  admin: {
    "listings.view": true,
    "listings.create": true,
    "listings.edit": true,
    "listings.archive": true,
    "leads.view": true,
    "leads.manage": true,
    "leads.assign": true,
    "offers.view": true,
    "offers.manage": true,
    "offers.negotiate": true,
    "viewings.view": true,
    "viewings.manage": true,
    "crm.view": true,
    "crm.edit": true,
    "analytics.view": true,
    "team.manage": true,
    "billing.view": true,
    "billing.manage": true,
  },
  senior_negotiator: {
    "listings.view": true,
    "listings.create": true,
    "listings.edit": true,
    "listings.archive": true,
    "leads.view": true,
    "leads.manage": true,
    "leads.assign": true,
    "offers.view": true,
    "offers.manage": true,
    "offers.negotiate": true,
    "viewings.view": true,
    "viewings.manage": true,
    "crm.view": true,
    "crm.edit": true,
    "analytics.view": true,
    "team.manage": false,
    "billing.view": false,
    "billing.manage": false,
  },
  negotiator: {
    "listings.view": true,
    "listings.create": true,
    "listings.edit": true,
    "listings.archive": false,
    "leads.view": true,
    "leads.manage": true,
    "leads.assign": false,
    "offers.view": true,
    "offers.manage": true,
    "offers.negotiate": false,
    "viewings.view": true,
    "viewings.manage": true,
    "crm.view": true,
    "crm.edit": false,
    "analytics.view": true,
    "team.manage": false,
    "billing.view": false,
    "billing.manage": false,
  },
  lettings_manager: {
    "listings.view": true,
    "listings.create": true,
    "listings.edit": true,
    "listings.archive": false,
    "leads.view": true,
    "leads.manage": true,
    "leads.assign": true,
    "offers.view": true,
    "offers.manage": false,
    "offers.negotiate": false,
    "viewings.view": true,
    "viewings.manage": true,
    "crm.view": true,
    "crm.edit": true,
    "analytics.view": true,
    "team.manage": false,
    "billing.view": false,
    "billing.manage": false,
  },
  viewer: {
    "listings.view": true,
    "listings.create": false,
    "listings.edit": false,
    "listings.archive": false,
    "leads.view": true,
    "leads.manage": false,
    "leads.assign": false,
    "offers.view": true,
    "offers.manage": false,
    "offers.negotiate": false,
    "viewings.view": true,
    "viewings.manage": false,
    "crm.view": true,
    "crm.edit": false,
    "analytics.view": true,
    "team.manage": false,
    "billing.view": false,
    "billing.manage": false,
  },
};

// ---- Component --------------------------------------------------------------

export function RolesPermissions() {
  const [permissions, setPermissions] = useState<
    Record<TeamRole, PermissionSet>
  >(DEFAULT_PERMISSIONS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(role: TeamRole, key: PermissionKey) {
    setPermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [key]: !prev[role][key],
      },
    }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    // In this phase permissions are informational (enforced via role check in
    // service layer). Future: persist custom_permissions JSONB on agency profile.
    await new Promise<void>((resolve) => setTimeout(resolve, 500));
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="space-y-6">
      {/* Role summary cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {TEAM_ROLES.map((role) => (
          <Card key={role} className="bg-muted/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                {ROLE_LABELS[role]}
              </CardTitle>
              <CardDescription className="text-xs">
                {ROLE_DESCRIPTIONS[role]}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Permission matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permission Matrix</CardTitle>
          <CardDescription>
            Toggle permissions per role. Changes here are informational and
            apply to role-based checks throughout the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="w-48 py-2 text-left font-medium text-muted-foreground">
                    Permission
                  </th>
                  {TEAM_ROLES.map((role) => (
                    <th
                      key={role}
                      className="min-w-[120px] px-3 py-2 text-center font-medium"
                    >
                      {ROLE_LABELS[role]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_MATRIX.map((cat, catIdx) => (
                  <>
                    {/* Category header row */}
                    <tr key={`cat-${catIdx}`} className="bg-muted/30">
                      <td
                        colSpan={TEAM_ROLES.length + 1}
                        className="px-0 py-1.5"
                      >
                        <Badge variant="outline" className="text-xs font-semibold">
                          {cat.category}
                        </Badge>
                      </td>
                    </tr>

                    {cat.permissions.map((perm) => (
                      <tr
                        key={perm.key}
                        className="border-b last:border-0 hover:bg-muted/20"
                      >
                        <td className="py-2 text-muted-foreground">
                          {perm.label}
                        </td>
                        {TEAM_ROLES.map((role) => (
                          <td key={role} className="px-3 py-2 text-center">
                            <div className="flex justify-center">
                              <Switch
                                checked={permissions[role][perm.key] ?? false}
                                onCheckedChange={() => toggle(role, perm.key)}
                                aria-label={`${ROLE_LABELS[role]} — ${perm.label}`}
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving} size="sm">
              <Save className="mr-2 size-4" />
              {saving ? "Saving..." : "Save Permissions"}
            </Button>
            {saved && (
              <p className="text-sm text-green-600">
                Permissions saved successfully.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
