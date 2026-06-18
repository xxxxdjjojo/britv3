import { describe, it, expect } from "vitest";

describe("FOUND-04 — required package imports", () => {
  // 15s timeout (matches react-day-picker/tus-js-client below, added in 64acc287):
  // the first dynamic import() of these packages can exceed the default 5s test
  // timeout when the full suite saturates the CPU. Passes in <1s in isolation.
  it("nanoid exports nanoid function", async () => {
    const { nanoid } = await import("nanoid");
    expect(typeof nanoid).toBe("function");
    const code = nanoid(10);
    expect(code).toHaveLength(10);
    expect(typeof code).toBe("string");
  }, 15000);

  it("date-fns exports format function", async () => {
    const { format } = await import("date-fns");
    expect(typeof format).toBe("function");
    const result = format(new Date("2026-01-01"), "yyyy-MM-dd");
    expect(result).toBe("2026-01-01");
  }, 15000);

  it("react-day-picker exports DayPicker component", async () => {
    const rdp = await import("react-day-picker");
    expect(rdp.DayPicker).toBeDefined();
  }, 15000);

  it("tus-js-client exports Upload class", async () => {
    const tus = await import("tus-js-client");
    expect(tus.Upload).toBeDefined();
  }, 15000);
});
