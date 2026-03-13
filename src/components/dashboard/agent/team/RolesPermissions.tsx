"use client";

import type { TeamRole } from "@/types/agent";

const ROLES: { key: TeamRole; label: string }[] = [
  { key: "admin", label: "Admin" },
  { key: "senior_negotiator", label: "Senior Negotiator" },
  { key: "negotiator", label: "Negotiator" },
  { key: "lettings_manager", label: "Lettings Manager" },
  { key: "viewer", label: "Viewer" },
];

const PERMISSIONS = [
  "Listings",
  "Leads",
  "Offers",
  "Viewings",
  "CRM",
  "Analytics",
  "Team",
  "Billing",
] as const;

type Permission = (typeof PERMISSIONS)[number];

const MATRIX: Record<Permission, Record<TeamRole, boolean>> = {
  Listings: {
    admin: true,
    senior_negotiator: true,
    negotiator: true,
    lettings_manager: true,
    viewer: false,
  },
  Leads: {
    admin: true,
    senior_negotiator: true,
    negotiator: true,
    lettings_manager: true,
    viewer: false,
  },
  Offers: {
    admin: true,
    senior_negotiator: true,
    negotiator: true,
    lettings_manager: false,
    viewer: false,
  },
  Viewings: {
    admin: true,
    senior_negotiator: true,
    negotiator: true,
    lettings_manager: true,
    viewer: true,
  },
  CRM: {
    admin: true,
    senior_negotiator: true,
    negotiator: false,
    lettings_manager: true,
    viewer: false,
  },
  Analytics: {
    admin: true,
    senior_negotiator: true,
    negotiator: false,
    lettings_manager: false,
    viewer: false,
  },
  Team: {
    admin: true,
    senior_negotiator: false,
    negotiator: false,
    lettings_manager: false,
    viewer: false,
  },
  Billing: {
    admin: true,
    senior_negotiator: false,
    negotiator: false,
    lettings_manager: false,
    viewer: false,
  },
};

const ROLE_HEADER_COLORS: Record<TeamRole, string> = {
  admin: "text-purple-700 dark:text-purple-400",
  senior_negotiator: "text-blue-700 dark:text-blue-400",
  negotiator: "text-green-700 dark:text-green-400",
  lettings_manager: "text-amber-700 dark:text-amber-400",
  viewer: "text-gray-600 dark:text-gray-400",
};

export function RolesPermissions() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
        <p className="text-muted-foreground">
          Overview of what each team role can access
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-semibold">Permission</th>
              {ROLES.map((role) => (
                <th
                  key={role.key}
                  className={`px-4 py-3 text-center font-semibold ${ROLE_HEADER_COLORS[role.key]}`}
                >
                  {role.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((perm, idx) => (
              <tr
                key={perm}
                className={idx % 2 === 0 ? "bg-background" : "bg-muted/30"}
              >
                <td className="px-4 py-3 font-medium">{perm}</td>
                {ROLES.map((role) => (
                  <td key={role.key} className="px-4 py-3 text-center">
                    {MATRIX[perm][role.key] ? (
                      <span className="text-green-600 dark:text-green-400" aria-label="Allowed">
                        &#10003;
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600" aria-label="Not allowed">
                        &mdash;
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        <p>
          <strong>Note:</strong> These permissions define the default access level
          for each role. Admins have full access to all features. Contact your
          agency administrator to request role changes.
        </p>
      </div>
    </div>
  );
}
