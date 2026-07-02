import { createClient } from "@/lib/supabase/client";
import { browserAuthCallbackUrl } from "@/lib/auth/signup-confirmation";
import { getSignupSource } from "@/lib/analytics/signup-attribution";
import type { UserRole } from "@/types/auth";

function getSupabase() {
  return createClient();
}

export async function signUp(
  email: string,
  password: string,
  displayName?: string,
  roleIntent: UserRole = "homebuyer",
) {
  const supabase = getSupabase();
  // First-touch attribution (utm/referrer/landing path) travels with the
  // signup metadata when available so cohorts can be attributed at source.
  const signupSource = getSignupSource();
  return supabase.auth.signUp({
    email,
    password,
    options: {
      // Buyers/renters sign up without a name; only set display_name when given.
      // role_intent is always recorded so the confirmation callback can assign the role.
      data: {
        ...(displayName ? { display_name: displayName } : {}),
        role_intent: roleIntent,
        ...(signupSource ? { signup_source: signupSource } : {}),
      },
      emailRedirectTo: browserAuthCallbackUrl(),
    },
  });
}

export async function signIn(email: string, password: string) {
  const supabase = getSupabase();
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signInWithOAuth(provider: "google" | "apple") {
  const supabase = getSupabase();
  const options: Record<string, unknown> = {
    redirectTo: `${window.location.origin}/auth/callback`,
  };

  if (provider === "google") {
    options.queryParams = {
      access_type: "offline",
      prompt: "consent",
    };
  }

  return supabase.auth.signInWithOAuth({
    provider,
    options,
  });
}

export async function signOut() {
  const supabase = getSupabase();
  return supabase.auth.signOut();
}

export async function resetPassword(email: string) {
  const supabase = getSupabase();
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
}

export async function updatePassword(password: string) {
  const supabase = getSupabase();
  return supabase.auth.updateUser({ password });
}

export async function getUser() {
  const supabase = getSupabase();
  return supabase.auth.getUser();
}
