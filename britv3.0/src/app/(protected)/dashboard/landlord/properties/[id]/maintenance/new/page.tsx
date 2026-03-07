import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MaintenanceForm } from "@/components/landlord/MaintenanceForm";
import Link from "next/link";

export default async function NewMaintenancePage(
  props: Readonly<{ params: Promise<{ id: string }> }>,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id: propertyId } = await props.params;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/landlord/properties/${propertyId}/maintenance`}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          &larr; Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          New Maintenance Request
        </h1>
      </div>

      <MaintenanceForm propertyId={propertyId} />
    </div>
  );
}
