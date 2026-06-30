import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPortfolioProperties } from "@/services/landlord/portfolio-service";
import { MaintenanceForm } from "@/components/landlord/MaintenanceForm";

type NewMaintenancePageProps = Readonly<{
  searchParams: Promise<{ propertyId?: string }>;
}>;

export default async function NewPortfolioMaintenancePage({
  searchParams,
}: NewMaintenancePageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const properties = await getPortfolioProperties(supabase);
  const { propertyId } = await searchParams;
  const selectedProperty = properties.find((property) => property.id === propertyId);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/landlord/maintenance"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          &larr; Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          New Maintenance Request
        </h1>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-gray-100">
            Add a property before creating a maintenance request.
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Maintenance requests must be linked to a property in your portfolio.
          </p>
          <Link
            href="/dashboard/landlord/properties/add"
            className="mt-4 inline-flex rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
          >
            Add Property
          </Link>
        </div>
      ) : (
        <>
          <form className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-slate-900">
            <label
              htmlFor="propertyId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Property
            </label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <select
                id="propertyId"
                name="propertyId"
                defaultValue={selectedProperty?.id ?? ""}
                className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="">Select a property</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {[property.address_line_1, property.city, property.postcode]
                      .filter(Boolean)
                      .join(", ")}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-surface dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Continue
              </button>
            </div>
          </form>

          {propertyId && !selectedProperty ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
              Select a property from your portfolio to continue.
            </div>
          ) : null}

          {selectedProperty ? (
            <MaintenanceForm propertyId={selectedProperty.id} />
          ) : null}
        </>
      )}
    </div>
  );
}
