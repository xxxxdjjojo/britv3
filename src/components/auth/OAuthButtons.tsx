"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

function GoogleIcon() {
  return (
    <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.31.07 2.22.74 2.98.8 1.12-.22 2.19-.91 3.39-.84 1.44.1 2.52.64 3.23 1.64-2.95 1.77-2.25 5.65.22 6.74-.51 1.39-1.19 2.76-1.82 4.52zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function OAuthButtonsInner() {
  const [loadingProvider, setLoadingProvider] = useState<"google" | "apple" | null>(null);
  const searchParams = useSearchParams();

  async function handleOAuth(provider: "google" | "apple") {
    setLoadingProvider(provider);
    try {
      const supabase = createClient();
      const professionalRole = searchParams.get("professional");
      const origin = window.location.origin;

      sessionStorage.setItem("brite_return_url", window.location.pathname);

      if (professionalRole) {
        document.cookie = `britestate_professional_role=${encodeURIComponent(professionalRole)};path=/;max-age=600;SameSite=Lax`;
      }

      const options =
        provider === "google"
          ? {
              queryParams: {
                access_type: "offline",
                prompt: "consent",
              },
              redirectTo: `${origin}/auth/callback?next=/dashboard`,
            }
          : {
              redirectTo: `${origin}/auth/callback?next=/dashboard`,
            };

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options,
      });

      if (error) {
        // OAuth redirect failed — surface silently (user stays on page)
        setLoadingProvider(null);
      }
    } catch {
      setLoadingProvider(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="outline"
        size="lg"
        className="w-full h-11 gap-3 rounded-lg border-neutral-200 bg-white font-sans font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors shadow-sm"
        onClick={() => handleOAuth("google")}
        disabled={loadingProvider !== null}
        aria-label="Continue with Google"
      >
        {loadingProvider === "google" ? (
          <Loader2 className="size-4 animate-spin text-neutral-400" aria-hidden="true" />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </Button>

      <Button
        variant="outline"
        size="lg"
        className="w-full h-11 gap-3 rounded-lg border-neutral-200 bg-white font-sans font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors shadow-sm"
        onClick={() => handleOAuth("apple")}
        disabled={loadingProvider !== null}
        aria-label="Sign in with Apple"
      >
        {loadingProvider === "apple" ? (
          <Loader2 className="size-4 animate-spin text-neutral-400" aria-hidden="true" />
        ) : (
          <AppleIcon />
        )}
        Continue with Apple
      </Button>
    </div>
  );
}

export function OAuthButtons() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            size="lg"
            className="w-full h-11 gap-3 rounded-lg border-neutral-200 bg-white font-sans font-medium text-neutral-700 shadow-sm"
            disabled
            aria-label="Loading Google sign-in"
          >
            <GoogleIcon />
            Continue with Google
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full h-11 gap-3 rounded-lg border-neutral-200 bg-white font-sans font-medium text-neutral-700 shadow-sm"
            disabled
            aria-label="Loading Apple sign-in"
          >
            <AppleIcon />
            Continue with Apple
          </Button>
        </div>
      }
    >
      <OAuthButtonsInner />
    </Suspense>
  );
}
