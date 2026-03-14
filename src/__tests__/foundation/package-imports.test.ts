import { describe, it, expect } from "vitest";

describe("FOUND-04 — required package imports", () => {
  it("nanoid exports nanoid function", async () => {
    const { nanoid } = await import("nanoid");
    expect(typeof nanoid).toBe("function");
    const code = nanoid(10);
    expect(code).toHaveLength(10);
    expect(typeof code).toBe("string");
  });

  it("date-fns exports format function", async () => {
    const { format } = await import("date-fns");
    expect(typeof format).toBe("function");
    const result = format(new Date("2026-01-01"), "yyyy-MM-dd");
    expect(result).toBe("2026-01-01");
  });

  it("react-day-picker exports DayPicker component", async () => {
    const rdp = await import("react-day-picker");
    expect(rdp.DayPicker).toBeDefined();
  }, 15000);

  it("tus-js-client exports Upload class", async () => {
    const tus = await import("tus-js-client");
    expect(tus.Upload).toBeDefined();
  }, 15000);
});
