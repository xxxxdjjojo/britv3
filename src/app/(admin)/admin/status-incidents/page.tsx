import { Activity } from "lucide-react";

import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusIncidentsClient } from "@/components/admin/StatusIncidentsClient";
import { createAdminClient } from "@/lib/supabase/admin";
import { listAllIncidents } from "@/services/admin/status-incident-service";

export const dynamic = "force-dynamic";

export default async function StatusIncidentsPage() {
  const incidents = await listAllIncidents(createAdminClient());

  return (
    <div>
      <AdminPageHeader
        eyebrow="Operations"
        title="Status Incidents"
        description="Draft incidents privately, then publish to the public /status page. Publishing and every status change is recorded in the admin audit log."
      />

      {incidents.length === 0 ? (
        <AdminEmptyState
          icon={Activity}
          title="No incidents"
          description="Create an incident to communicate an outage or scheduled maintenance to customers."
        />
      ) : null}

      <StatusIncidentsClient incidents={incidents} />
    </div>
  );
}
