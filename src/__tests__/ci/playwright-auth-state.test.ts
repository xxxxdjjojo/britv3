import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertSupabaseStorageState,
  createPlaywrightStorageState,
  supabaseStorageKeyForUrl,
} from "../../../e2e/fixtures/supabase-auth-state";

const AUTH_SETUP = join(process.cwd(), "e2e", "auth.setup.ts");

describe("Playwright Supabase auth state contract", () => {
  it("uses the same default auth storage key as supabase-js", () => {
    expect(supabaseStorageKeyForUrl("http://127.0.0.1:54321")).toBe(
      "sb-127-auth-token",
    );
    expect(supabaseStorageKeyForUrl("https://ynkqzzpcbpphjczmrfva.supabase.co")).toBe(
      "sb-ynkqzzpcbpphjczmrfva-auth-token",
    );
  });

  it("converts Supabase SSR cookies into Playwright storage state for the app host", () => {
    const nowMs = Date.UTC(2026, 5, 30, 12, 0, 0);
    const state = createPlaywrightStorageState({
      baseURL: "http://localhost:3100",
      cookies: [
        {
          name: "sb-127-auth-token",
          value: "base64-session",
          options: { path: "/", sameSite: "lax", maxAge: 400 * 24 * 60 * 60 },
        },
      ],
      nowMs,
    });

    expect(state).toEqual({
      cookies: [
        {
          name: "sb-127-auth-token",
          value: "base64-session",
          domain: "localhost",
          path: "/",
          expires: Math.floor(nowMs / 1000) + 400 * 24 * 60 * 60,
          httpOnly: false,
          secure: false,
          sameSite: "Lax",
        },
      ],
      origins: [],
    });
  });

  it("rejects empty storage state for auth-required smoke runs", () => {
    expect(() => assertSupabaseStorageState({ cookies: [], origins: [] }, "landlord"))
      .toThrow(/No Supabase auth cookies for role "landlord"/);
  });

  it("does not silently replace failed setup with empty auth state", () => {
    const setupSource = readFileSync(AUTH_SETUP, "utf8");

    expect(setupSource).toContain("loadPlaywrightEnv(process.cwd())");
    expect(setupSource).toContain("writeSupabaseAuthState");
    expect(setupSource).toContain("assertSupabaseAuthStateFile");
    expect(setupSource).not.toContain("JSON.stringify({ cookies: [], origins: [] }");
    expect(setupSource).not.toContain("page.goto(\"/login\")");
  });
});
