import type { PortfolioProperty } from "@/services/landlord/portfolio-service";
import { PropertyCard } from "@/components/landlord/PropertyCard";

export function PortfolioGrid(
  props: Readonly<{ properties: PortfolioProperty[] }>,
) {
  if (props.properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 p-12 text-center dark:border-neutral-700">
        <h3 className="font-heading text-lg font-semibold text-neutral-600 dark:text-neutral-400">
          No rental properties found
        </h3>
        <p className="mt-1 text-sm text-neutral-500">
          Add a rental listing to start managing your portfolio.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {props.properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
