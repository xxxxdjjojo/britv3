import { beforeAll, describe, expect, it } from "vitest";

import type { DatedDeadline } from "@/content/rra-deadlines";

/**
 * Golden-file + parser tests for the Landlord Deadline Diary .ics feed.
 * All fixture dates are fixed — no Date.now in any assertion. DTSTAMP is
 * derived from the content checked date, so output is fully deterministic.
 */

// Token signing needs a secret before the lib is first exercised.
beforeAll(() => {
  process.env.UNSUBSCRIBE_TOKEN_SECRET = "test-secret-for-ics";
});

const FIXTURE: DatedDeadline[] = [
  {
    id: "commencement",
    kind: "dated",
    date: "2026-05-01",
    title: "New tenancy system in force, England",
    summary: "Section 21 abolished; existing ASTs converted.",
    appliesTo: ["all_landlords"],
    citations: [
      {
        instrument: "Renters' Rights Act 2025",
        section: "Act as enacted (c. 26)",
        url: "https://www.legislation.gov.uk/ukpga/2025/26",
      },
    ],
    agentUsuallyHandles: false,
  },
  {
    id: "s21-longstop",
    kind: "dated",
    date: "2026-07-31",
    title: "Pre-commencement Section 21 claims long-stop",
    summary: "Claims relying on a pre-1 May 2026 notice must reach court.",
    appliesTo: ["pre_may_tenancies"],
    citations: [
      {
        instrument: "Renters' Rights Act 2025",
        section: "Act as enacted (c. 26)",
        url: "https://www.legislation.gov.uk/ukpga/2025/26",
      },
    ],
    agentUsuallyHandles: true,
  },
];

/** RFC 5545 unfold: continuation lines start with a single space. */
function unfold(ics: string): string {
  return ics.replace(/\r\n /g, "");
}

describe("buildDeadlineCalendar", () => {
  it("matches the golden output for a single fixed entry", async () => {
    const { buildDeadlineCalendar } = await import(
      "@/app/api/landlords/deadline-diary/ics"
    );
    const ics = buildDeadlineCalendar({
      entries: [FIXTURE[0]],
      checkedDate: "2026-07-03",
      uidDomain: "truedeed.co.uk",
    });

    const golden =
      [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//TrueDeed//Landlord Deadline Diary//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:Renters' Rights Act deadlines (TrueDeed)",
        "BEGIN:VEVENT",
        "UID:rra-commencement@truedeed.co.uk",
        "DTSTAMP:20260703T000000Z",
        "DTSTART;VALUE=DATE:20260501",
        "DTEND;VALUE=DATE:20260502",
        "SUMMARY:New tenancy system in force\\, England",
        "DESCRIPTION:Section 21 abolished\\; existing ASTs converted.\\nSource: https" +
          "\r\n ://www.legislation.gov.uk/ukpga/2025/26",
        "URL:https://www.legislation.gov.uk/ukpga/2025/26",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n") + "\r\n";

    expect(ics).toBe(golden);
  });

  it("emits one all-day VEVENT per dated entry with exclusive DTEND", async () => {
    const { buildDeadlineCalendar } = await import(
      "@/app/api/landlords/deadline-diary/ics"
    );
    const ics = unfold(
      buildDeadlineCalendar({
        entries: FIXTURE,
        checkedDate: "2026-07-03",
        uidDomain: "truedeed.co.uk",
      }),
    );

    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain("DTSTART;VALUE=DATE:20260731");
    expect(ics).toContain("DTEND;VALUE=DATE:20260801");
    expect(ics).toContain("UID:rra-s21-longstop@truedeed.co.uk");
    // DTSTAMP comes from the checked date, never from Date.now.
    expect(ics.match(/DTSTAMP:20260703T000000Z/g)).toHaveLength(2);
  });

  it("keeps every raw line within the RFC 5545 75-octet limit", async () => {
    const { buildDeadlineCalendar } = await import(
      "@/app/api/landlords/deadline-diary/ics"
    );
    const ics = buildDeadlineCalendar({
      entries: FIXTURE,
      checkedDate: "2026-07-03",
      uidDomain: "truedeed.co.uk",
    });
    for (const line of ics.split("\r\n")) {
      expect(line.length).toBeLessThanOrEqual(75);
    }
  });
});

describe("GET /api/landlords/deadline-diary/[token]/calendar.ics", () => {
  async function invoke(token: string): Promise<Response> {
    const { GET } = await import(
      "@/app/api/landlords/deadline-diary/[token]/calendar.ics/route"
    );
    return GET(undefined as never, { params: Promise.resolve({ token }) });
  }

  it("returns the calendar for a valid landlord_diary calendar token", async () => {
    const { generateNewsletterToken } = await import("@/lib/newsletter-token");
    const token = generateNewsletterToken(
      "landlord@example.com",
      "landlord_diary",
      "calendar",
    );

    const response = await invoke(token);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/calendar");

    const body = unfold(await response.text());
    expect(body).toContain("BEGIN:VCALENDAR");
    // Real content: the s21 transitional long-stop is a dated entry.
    expect(body).toContain("UID:rra-s21-longstop@truedeed.co.uk");
    // Trigger-rule entries (no published date) must NOT become events.
    expect(body).not.toContain("prs-database");
  });

  it("404s a garbage token", async () => {
    const response = await invoke("not-a-token");
    expect(response.status).toBe(404);
  });

  it("404s a token minted for a different purpose", async () => {
    const { generateNewsletterToken } = await import("@/lib/newsletter-token");
    const token = generateNewsletterToken(
      "landlord@example.com",
      "landlord_diary",
      "unsubscribe",
    );
    const response = await invoke(token);
    expect(response.status).toBe(404);
  });

  it("404s a calendar token for a different audience", async () => {
    const { generateNewsletterToken } = await import("@/lib/newsletter-token");
    const token = generateNewsletterToken(
      "agent@example.com",
      "agent_briefing",
      "calendar",
    );
    const response = await invoke(token);
    expect(response.status).toBe(404);
  });
});
