/**
 * Stamps content with the legislation-check date and content version.
 * Server-safe.
 */
export function ContentVersionStamp({
  checkedDate,
  version,
}: Readonly<{ checkedDate: string; version: number }>) {
  return (
    <p className="text-xs text-muted-foreground">
      Checked against legislation in force on{" "}
      <time dateTime={checkedDate}>{checkedDate}</time>, v{version}
    </p>
  );
}
