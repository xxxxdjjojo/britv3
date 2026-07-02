/**
 * Stamps content with the legislation-check date and content version.
 * Server-safe.
 */
export function ContentVersionStamp({
  checkedDate,
  version,
}: Readonly<{ checkedDate: string; version: number }>) {
  // <time dateTime> must be machine-readable (YYYY-MM-DD); omit it when the
  // display string can't be parsed rather than emit an invalid attribute.
  const parsed = new Date(checkedDate);
  const iso = Number.isNaN(parsed.getTime())
    ? undefined
    : parsed.toISOString().slice(0, 10);
  return (
    <p className="text-xs text-muted-foreground">
      Checked against legislation in force on{" "}
      <time dateTime={iso}>{checkedDate}</time>, v{version}
    </p>
  );
}
