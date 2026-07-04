import { Info } from "lucide-react";
import { TOP_LIST_DISCLAIMER } from "@/lib/top-properties/top-list-config";

type Props = Readonly<{
  /** The category's methodology copy — states exactly what is counted. */
  methodology: string;
  /** ISO timestamp of when the ranking was generated. */
  generatedAt: string;
}>;

function formatUpdated(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Visible ranking methodology + last-updated block for a list page. */
export function TopListMethodology({ methodology, generatedAt }: Props) {
  return (
    <section
      aria-labelledby="methodology-heading"
      className="rounded-2xl border border-neutral-200 bg-muted p-5 sm:p-6"
    >
      <h2
        id="methodology-heading"
        className="flex items-center gap-2 font-heading text-base font-bold text-neutral-900"
      >
        <Info className="size-4 text-brand-primary" aria-hidden="true" />
        How this list is ranked
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">
        {methodology}
      </p>
      <p className="mt-3 text-xs text-neutral-500">{TOP_LIST_DISCLAIMER}</p>
      <p className="mt-2 text-xs font-medium text-neutral-500">
        Last updated{" "}
        <time dateTime={generatedAt}>{formatUpdated(generatedAt)}</time>
      </p>
    </section>
  );
}
