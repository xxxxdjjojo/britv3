import { describe, it, expect } from "vitest";
import manifest from "./manifest";

describe("manifest", () => {
  it("returns correct name and short_name", () => {
    const result = manifest();
    expect(result.name).toBe("Britestate - UK Property Portal");
    expect(result.short_name).toBe("Britestate");
  });

  it("returns start_url as /", () => {
    const result = manifest();
    expect(result.start_url).toBe("/");
  });

  it("returns standalone display mode", () => {
    const result = manifest();
    expect(result.display).toBe("standalone");
  });

  it("returns brand theme_color and white background_color", () => {
    const result = manifest();
    expect(result.theme_color).toBe("#005F73");
    expect(result.background_color).toBe("#ffffff");
  });

  it("returns 3 icons with correct sizes and purposes", () => {
    const result = manifest();
    expect(result.icons).toHaveLength(3);
    expect(result.icons).toEqual([
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ]);
  });

  it("includes a description", () => {
    const result = manifest();
    expect(result.description).toBeTruthy();
  });
});
