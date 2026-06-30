import { createBrowserClient } from "@supabase/ssr";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

type SupabaseCookieOptions = {
  path?: string;
  sameSite?: boolean | "lax" | "strict" | "none";
  httpOnly?: boolean;
  secure?: boolean;
  maxAge?: number;
  expires?: Date;
};

type CapturedCookie = {
  name: string;
  value: string;
  options?: SupabaseCookieOptions;
};

type PlaywrightSameSite = "Strict" | "Lax" | "None";

type PlaywrightCookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: PlaywrightSameSite;
};

export type PlaywrightStorageState = {
  cookies: PlaywrightCookie[];
  origins: Array<{
    origin: string;
    localStorage: Array<{ name: string; value: string }>;
  }>;
};

export function supabaseStorageKeyForUrl(supabaseUrl: string): string {
  const baseUrl = new URL(supabaseUrl);
  return `sb-${baseUrl.hostname.split(".")[0]}-auth-token`;
}

function normalizeSameSite(
  sameSite: SupabaseCookieOptions["sameSite"] | undefined,
): PlaywrightSameSite {
  if (sameSite === "strict" || sameSite === true) return "Strict";
  if (sameSite === "none") return "None";
  return "Lax";
}

export function createPlaywrightStorageState({
  baseURL,
  cookies,
  nowMs = Date.now(),
}: {
  baseURL: string;
  cookies: CapturedCookie[];
  nowMs?: number;
}): PlaywrightStorageState {
  const appUrl = new URL(baseURL);

  return {
    cookies: cookies
      .filter((cookie) => cookie.value.length > 0)
      .map((cookie) => {
        const maxAge = cookie.options?.maxAge;
        const expires =
          cookie.options?.expires instanceof Date
            ? Math.floor(cookie.options.expires.getTime() / 1000)
            : typeof maxAge === "number" && maxAge > 0
              ? Math.floor(nowMs / 1000) + maxAge
              : -1;

        return {
          name: cookie.name,
          value: cookie.value,
          domain: appUrl.hostname,
          path: cookie.options?.path ?? "/",
          expires,
          httpOnly: cookie.options?.httpOnly ?? false,
          secure: cookie.options?.secure ?? appUrl.protocol === "https:",
          sameSite: normalizeSameSite(cookie.options?.sameSite),
        };
      }),
    origins: [],
  };
}

export function assertSupabaseStorageState(
  state: PlaywrightStorageState,
  role: string,
): void {
  const hasAuthCookie = state.cookies.some(
    (cookie) =>
      /^sb-.+-auth-token(?:\.\d+)?$/.test(cookie.name) &&
      cookie.value.length > 0,
  );

  if (!hasAuthCookie) {
    throw new Error(`No Supabase auth cookies for role "${role}".`);
  }
}

export function assertSupabaseAuthStateFile(authFile: string, role: string): void {
  const raw = readFileSync(authFile, "utf8");
  assertSupabaseStorageState(JSON.parse(raw) as PlaywrightStorageState, role);
}

export async function writeSupabaseAuthState({
  authFile,
  role,
  email,
  password,
  baseURL,
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL,
  anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
}: {
  authFile: string;
  role: string;
  email: string;
  password: string;
  baseURL: string;
  supabaseUrl?: string;
  anonKey?: string;
}): Promise<void> {
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL is required for E2E auth setup.");
  }
  if (!anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is required for E2E auth setup.");
  }

  const capturedCookies = new Map<string, CapturedCookie>();
  const supabase = createBrowserClient(supabaseUrl, anonKey, {
    isSingleton: false,
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: true,
    },
    cookies: {
      getAll() {
        return Array.from(capturedCookies.values()).map(({ name, value }) => ({
          name,
          value,
        }));
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          if (!cookie.value || cookie.options?.maxAge === 0) {
            capturedCookies.delete(cookie.name);
            continue;
          }

          capturedCookies.set(cookie.name, {
            name: cookie.name,
            value: cookie.value,
            options: cookie.options,
          });
        }
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(
      `Failed to create E2E auth state for role "${role}" (${email}): ${
        error?.message ?? "no session returned"
      }`,
    );
  }

  const storageKey = supabaseStorageKeyForUrl(supabaseUrl);
  const hasExpectedStorageKey = Array.from(capturedCookies.keys()).some(
    (name) => name === storageKey || name.startsWith(`${storageKey}.`),
  );

  if (!hasExpectedStorageKey) {
    throw new Error(
      `Supabase sign-in for role "${role}" did not write expected auth cookie "${storageKey}".`,
    );
  }

  const state = createPlaywrightStorageState({
    baseURL,
    cookies: Array.from(capturedCookies.values()),
  });
  assertSupabaseStorageState(state, role);

  mkdirSync(dirname(authFile), { recursive: true });
  writeFileSync(authFile, JSON.stringify(state, null, 2));
  assertSupabaseAuthStateFile(authFile, role);
}
