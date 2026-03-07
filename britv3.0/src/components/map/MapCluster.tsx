/**
 * MapCluster presentational component.
 * Cluster visualization is handled via MapLibre layers in PropertyMap.
 * This component provides a reusable cluster badge for custom rendering scenarios.
 */

type MapClusterProps = Readonly<{
  count: number;
  size?: "sm" | "md" | "lg";
}>;

const SIZES = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
} as const;

function clusterSize(count: number): "sm" | "md" | "lg" {
  if (count < 10) return "sm";
  if (count < 50) return "md";
  return "lg";
}

export function MapCluster({ count, size }: MapClusterProps) {
  const resolvedSize = size ?? clusterSize(count);

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-brand-green font-semibold text-white shadow-md ${SIZES[resolvedSize]}`}
      role="img"
      aria-label={`Cluster of ${count} properties`}
    >
      {count}
    </div>
  );
}
