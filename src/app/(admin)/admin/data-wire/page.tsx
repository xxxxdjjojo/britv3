import { Newspaper } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { DataWireClient } from "@/components/admin/DataWireClient";
import { getWireAreas } from "@/services/data-wire/data-wire-service";

export const dynamic = "force-dynamic";

export default async function DataWirePage() {
  const { period, areas } = await getWireAreas();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Growth"
        title="Local Paper Data Wire"
        description="Pick a district and generate a localised press pack for local newspapers in one click."
      />

      {!period || areas.length === 0 ? (
        <AdminEmptyState
          icon={Newspaper}
          title="No districts to wire yet"
          description="No districts clear the sample thresholds yet — packs unlock as Reality Gap coverage grows."
        />
      ) : (
        <DataWireClient period={period} areas={[...areas]} />
      )}
    </div>
  );
}
