import { describe, it, expect } from "vitest";
import { brandConfig } from "@/config/brand";
import manifest from "./manifest";

describe("manifest", () => {
  it("returns TrueDeed app names from the brand config", () => {
    const result = manifest();
    expect(result.name).toBe(`${brandConfig.displayName} - UK Property Portal`);
    expect(result.short_name).toBe(brandConfig.shortName);
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

  it("returns 3 brand icons with correct sizes and purposes", () => {
    const result = manifest();
    expect(result.icons).toHaveLength(3);
    expect(result.icons).toEqual([
      {
        src: brandConfig.assets.icon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: brandConfig.assets.icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: brandConfig.assets.iconMaskable,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ]);
  });

  it("includes a description", () => {
    const result = manifest();
    expect(result.description).toContain(brandConfig.displayName);
  });
});
