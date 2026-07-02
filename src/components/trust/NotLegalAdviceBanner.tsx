const VARIANT_COPY: Record<"rights" | "tax" | "finance", string> = {
  rights: "This is general information, not legal advice.",
  tax: "This is general information, not tax advice.",
  finance: "This is general information, not financial advice.",
};

/**
 * Persistent disclaimer banner for rights/tax/finance content. Server-safe.
 */
export function NotLegalAdviceBanner({
  variant,
}: Readonly<{ variant: "rights" | "tax" | "finance" }>) {
  return (
    <div
      role="note"
      className="rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground"
    >
      <span className="font-medium text-foreground">{VARIANT_COPY[variant]}</span>{" "}
      Speak to a qualified professional about your situation.
    </div>
  );
}
