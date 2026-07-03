import type { DatedDeadline } from "@/content/rra-deadlines";

/**
 * Pure iCalendar (RFC 5545) builder for the Landlord Deadline Diary feed.
 *
 * Deterministic on purpose: DTSTAMP comes from the content-version checked
 * date (not Date.now), so the same content version always produces the same
 * bytes — golden-file testable and friendly to calendar-app polling.
 */

const CRLF = "\r\n";
const FOLD_AT = 74;

/** RFC 5545 §3.3.11 TEXT escaping. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** RFC 5545 §3.1 line folding: continuation lines start with a space. */
function fold(line: string): string {
  if (line.length <= FOLD_AT) return line;
  const chunks: string[] = [];
  let rest = line;
  while (rest.length > FOLD_AT) {
    chunks.push(rest.slice(0, FOLD_AT));
    rest = rest.slice(FOLD_AT);
  }
  chunks.push(rest);
  return chunks.join(`${CRLF} `);
}

/** "2026-05-01" → "20260501". */
function compactDate(isoDate: string): string {
  return isoDate.replace(/-/g, "");
}

/** Day after an ISO date, compact form (all-day DTEND is exclusive). */
function compactNextDay(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

export type BuildCalendarInput = Readonly<{
  entries: ReadonlyArray<DatedDeadline>;
  /** Content checked date, ISO YYYY-MM-DD — becomes every event's DTSTAMP. */
  checkedDate: string;
  /** UID host, e.g. "truedeed.co.uk". */
  uidDomain: string;
}>;

export function buildDeadlineCalendar({
  entries,
  checkedDate,
  uidDomain,
}: BuildCalendarInput): string {
  const dtstamp = `${compactDate(checkedDate)}T000000Z`;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TrueDeed//Landlord Deadline Diary//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Renters' Rights Act deadlines (TrueDeed)",
  ];

  for (const entry of entries) {
    const citationUrl = entry.citations[0]?.url;
    const description = citationUrl
      ? `${entry.summary}\nSource: ${citationUrl}`
      : entry.summary;
    lines.push(
      "BEGIN:VEVENT",
      `UID:rra-${entry.id}@${uidDomain}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${compactDate(entry.date)}`,
      `DTEND;VALUE=DATE:${compactNextDay(entry.date)}`,
      `SUMMARY:${escapeText(entry.title)}`,
      `DESCRIPTION:${escapeText(description)}`,
    );
    if (citationUrl) {
      lines.push(`URL:${citationUrl}`);
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  return lines.map(fold).join(CRLF) + CRLF;
}
