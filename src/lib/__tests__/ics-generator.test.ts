import { describe, it, expect } from "vitest";
import { generateIcs } from "../ics-generator";

describe("generateIcs", () => {
  const event = {
    title: "Property Viewing - 10 Downing Street",
    location: "10 Downing Street, London",
    description: "Viewing arranged via Britestate",
    start: new Date("2026-04-15T10:00:00.000Z"),
    end: new Date("2026-04-15T10:30:00.000Z"),
  };

  it("wraps content in BEGIN:VCALENDAR / END:VCALENDAR", () => {
    const ics = generateIcs(event);
    expect(ics).toMatch(/^BEGIN:VCALENDAR/);
    expect(ics).toMatch(/END:VCALENDAR$/);
  });

  it("contains a VEVENT block", () => {
    const ics = generateIcs(event);
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
  });

  it("includes DTSTART and DTEND in the correct format", () => {
    const ics = generateIcs(event);
    // Expected format: YYYYMMDDTHHMMSSZ (no dashes, colons, or milliseconds)
    expect(ics).toContain("DTSTART:20260415T100000Z");
    expect(ics).toContain("DTEND:20260415T103000Z");
  });

  it("includes SUMMARY, LOCATION, and DESCRIPTION", () => {
    const ics = generateIcs(event);
    expect(ics).toContain("SUMMARY:Property Viewing - 10 Downing Street");
    expect(ics).toContain("LOCATION:10 Downing Street, London");
    expect(ics).toContain("DESCRIPTION:Viewing arranged via Britestate");
  });

  it("includes VERSION and PRODID", () => {
    const ics = generateIcs(event);
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("PRODID:-//Britestate//Viewing//EN");
  });

  it("uses CRLF line endings", () => {
    const ics = generateIcs(event);
    const lines = ics.split("\r\n");
    // Should have all lines separated by CRLF
    expect(lines.length).toBeGreaterThan(1);
    expect(lines[0]).toBe("BEGIN:VCALENDAR");
  });

  it("formats dates without dashes, colons, or milliseconds", () => {
    const ics = generateIcs({
      ...event,
      start: new Date("2026-12-31T23:59:59.999Z"),
      end: new Date("2027-01-01T00:30:00.000Z"),
    });
    expect(ics).toContain("DTSTART:20261231T235959Z");
    expect(ics).toContain("DTEND:20270101T003000Z");
  });
});
