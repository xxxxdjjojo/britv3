import { createClient } from "@/lib/supabase/client";

function getSupabase() {
  return createClient();
}

export async function signUp(email: string, password: string, displayName: string) {
  const supabase = getSupabase();
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
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
