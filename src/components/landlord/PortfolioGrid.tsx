import type { PortfolioProperty } from "@/services/landlord/portfolio-service";
import { PropertyCard } from "@/components/landlord/PropertyCard";

export function PortfolioGrid(
  props: Readonly<{ properties: PortfolioProperty[] }>,
) {
  if (props.properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <h3 className="text-lg font-medium text-muted-foreground">
          No rental properties found
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a rental listing to start managing your portfolio.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {props.properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
