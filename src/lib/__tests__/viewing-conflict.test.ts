import { describe, it, expect } from "vitest";
import { hasViewingConflict } from "../viewing-conflict";

describe("hasViewingConflict", () => {
  const base = "2026-03-25T10:00:00Z";

  it("returns no conflict when there are no existing viewings", () => {
    const result = hasViewingConflict([], base);
    expect(result).toEqual({ conflict: false });
  });

  it("returns no conflict when existing viewings are far apart", () => {
    const existing = [
      { start_time: "2026-03-25T08:00:00Z", status: "confirmed" },
      { start_time: "2026-03-25T14:00:00Z", status: "confirmed" },
    ];
    const result = hasViewingConflict(existing, base);
    expect(result).toEqual({ conflict: false });
  });

  it("detects a conflict when times overlap within the buffer", () => {
    const existing = [
      { start_time: "2026-03-25T10:30:00Z", status: "confirmed" },
    ];
    const result = hasViewingConflict(existing, base);
    expect(result).toEqual({
      conflict: true,
      conflictWith: "2026-03-25T10:30:00Z",
    });
  });

  it("ignores cancelled viewings", () => {
    const existing = [
      { start_time: "2026-03-25T10:15:00Z", status: "cancelled" },
    ];
    const result = hasViewingConflict(existing, base);
    expect(result).toEqual({ conflict: false });
  });

  it("returns no conflict at exactly the buffer boundary (60 minutes)", () => {
    const existing = [
      { start_time: "2026-03-25T11:00:00Z", status: "confirmed" },
    ];
    // Exactly 60 minutes apart — should NOT conflict (uses < not <=)
    const result = hasViewingConflict(existing, base);
    expect(result).toEqual({ conflict: false });
  });

  it("detects conflict at 59 minutes (just inside the buffer)", () => {
    const existing = [
      { start_time: "2026-03-25T10:59:00Z", status: "confirmed" },
    ];
    const result = hasViewingConflict(existing, base);
    expect(result).toEqual({
      conflict: true,
      conflictWith: "2026-03-25T10:59:00Z",
    });
  });

  it("respects a custom buffer", () => {
    const existing = [
      { start_time: "2026-03-25T10:25:00Z", status: "confirmed" },
    ];
    // 25 minutes apart, 30-minute buffer → conflict
    expect(hasViewingConflict(existing, base, 30)).toEqual({
      conflict: true,
      conflictWith: "2026-03-25T10:25:00Z",
    });
    // 25 minutes apart, 20-minute buffer → no conflict
    expect(hasViewingConflict(existing, base, 20)).toEqual({ conflict: false });
  });

  it("detects conflict with viewings before the new slot too", () => {
    const existing = [
      { start_time: "2026-03-25T09:30:00Z", status: "pending" },
    ];
    // 30 minutes before — within the 60-minute buffer
    const result = hasViewingConflict(existing, base);
    expect(result).toEqual({
      conflict: true,
      conflictWith: "2026-03-25T09:30:00Z",
    });
  });
});
