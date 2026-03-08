import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { log } from "./logger";

describe("log", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("routes info level to console.log", () => {
    log("info", "test message");
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("routes warn level to console.log", () => {
    log("warn", "warning message");
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("routes error level to console.error", () => {
    log("error", "error message");
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("outputs valid JSON", () => {
    log("info", "test");
    const output = consoleSpy.mock.calls[0][0] as string;
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it("includes required fields: level, message, timestamp", () => {
    log("info", "check fields");
    const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(output).toEqual(
      expect.objectContaining({
        level: "info",
        message: "check fields",
        timestamp: expect.any(String),
      }),
    );
  });

  it("timestamp is ISO 8601 format", () => {
    log("info", "timestamp check");
    const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(new Date(output.timestamp).toISOString()).toBe(output.timestamp);
  });

  it("spreads context fields into output", () => {
    log("info", "with context", { userId: "u1", action: "click" });
    const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(output).toEqual(
      expect.objectContaining({
        level: "info",
        message: "with context",
        userId: "u1",
        action: "click",
      }),
    );
  });

  it("works without context parameter", () => {
    log("warn", "no context");
    const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(output.level).toBe("warn");
    expect(output.message).toBe("no context");
  });
});
