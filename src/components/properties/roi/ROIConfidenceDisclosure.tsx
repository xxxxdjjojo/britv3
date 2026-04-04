/**
 * ROIConfidenceDisclosure
 *
 * Disclaimer rendered beneath all ROI renovation scenario cards.
 * Server component — no interactivity needed.
 */

export function ROIConfidenceDisclosure() {
  return (
    <aside
      aria-label="ROI estimates disclaimer"
      className="mt-4 rounded-lg border border-brand-accent/20 bg-brand-accent/5 px-4 py-3"
    >
      <p className="text-xs leading-relaxed text-neutral-600">
        <span className="font-semibold text-neutral-700">Disclaimer: </span>
        ROI estimates are AI-generated using Land Registry data and renovation
        benchmarks. Actual returns vary.{" "}
        <span className="font-medium">Confidence:</span>{" "}
        <span className="text-success">High</span> = strong regional data,{" "}
        <span className="text-warning">Medium</span> = some data,{" "}
        <span className="text-neutral-500">Low</span> = area averages only.
      </p>
    </aside>
  );
}
