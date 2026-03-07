"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  signInWithOAuth as authSignInWithOAuth,
} from "@/services/auth/auth-service";

/**
 * Client-side auth hook - provides user state and auth operations.
 * Stub created by Plan 04 (auth UI); full implementation in Plan 03.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(
    (email: string, password: string) => authSignIn(email, password),
    [],
  );

  const signUp = useCallback(
    (email: string, password: string, displayName: string) =>
      authSignUp(email, password, displayName),
    [],
  );

  const signOut = useCallback(() => authSignOut(), []);

  const signInWithOAuth = useCallback(
    (provider: "google" | "apple") => authSignInWithOAuth(provider),
    [],
  );

  return { user, loading, signIn, signUp, signOut, signInWithOAuth };
}
