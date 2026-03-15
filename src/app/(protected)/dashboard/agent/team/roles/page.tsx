import { Shield } from "lucide-react";
import { RolesPermissions } from "@/components/dashboard/agent/team/RolesPermissions";

export const metadata = {
  title: "Roles & Permissions",
};

export default function RolesPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Shield className="size-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Roles &amp; Permissions
          </h1>
          <p className="text-muted-foreground">
            Define what each team role can see and do across the dashboard.
          </p>
        </div>
      </div>

      <RolesPermissions />
    </div>
  );
}
