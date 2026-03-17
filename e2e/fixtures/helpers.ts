import { readFileSync } from "node:fs";
import type { TestType } from "@playwright/test";

/**
 * Check whether a storageState file contains real auth data (cookies or origins with localStorage).
 * Returns false if the file is missing, empty, or contains only empty arrays.
 */
export function isAuthenticated(authFilePath: string): boolean {
  try {
    const raw = readFileSync(authFilePath, "utf-8");
    const state = JSON.parse(raw) as {
      cookies?: unknown[];
      origins?: { localStorage?: unknown[] }[];
    };

    const hasCookies = Array.isArray(state.cookies) && state.cookies.length > 0;
    const hasStorage =
      Array.isArray(state.origins) &&
      state.origins.some(
        (o) => Array.isArray(o.localStorage) && o.localStorage.length > 0,
      );

    return hasCookies || hasStorage;
  } catch {
    return false;
  }
}

/**
 * Skip the current test if auth state for the given role is not available.
 * Call at the top of any test that requires authentication:
 *
 *   skipIfNoAuth(test, "homebuyer");
 */
export function skipIfNoAuth(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: TestType<any, any>,
  role: string,
): void {
  const authFile = `e2e/.auth/${role}.json`;
  t.skip(
    !isAuthenticated(authFile),
    `Skipping — no auth state available for role "${role}". Ensure test users exist in the database.`,
  );
}
