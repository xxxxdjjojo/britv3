"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signIn } from "@/services/auth/auth-service";
import { handleSupabaseError } from "@/lib/supabase-error";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";

function getSafeRedirectTarget(redirectTo: string | null): string {
  if (
    redirectTo &&
    redirectTo.startsWith("/") &&
    !redirectTo.startsWith("//")
  ) {
    return redirectTo;
  }
  return "/dashboard";
}

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  auth_callback_error: "Something went wrong signing you in. Please try again.",
  role_setup_failed: "Account created but setup incomplete. Please contact support.",
};

function getOAuthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  return OAUTH_ERROR_MESSAGES[code] ?? "An error occurred. Please try again.";
}

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = getOAuthErrorMessage(searchParams.get("error"));
  const successMessage =
    searchParams.get("message") === "password-updated"
      ? "Password updated successfully. Please sign in with your new password."
      : null;
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  async function onSubmit(data: LoginFormValues) {
    setError(null);

    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captchaToken) {
      setError("Please complete the CAPTCHA verification.");
      return;
    }

    const { error: authError } = await signIn(data.email, data.password);
    if (authError) {
      // Detect account lockout / rate-limit: redirect rather than showing an
      // inline error so the user gets a dedicated, informative page.
      const errObj = authError as { status?: number; code?: string; message?: string };
      const isLockout =
        errObj.status === 429 ||
        errObj.code === "over_request_rate_limit" ||
        /too many/i.test(errObj.message ?? "");
      const isBanned = errObj.code === "user_banned";

      if (isLockout) {
        router.push("/account-locked");
        return;
      }
      if (isBanned) {
        router.push("/account-suspended");
        return;
      }

      setError(handleSupabaseError(authError).message);
      return;
    }

    const redirectTarget = getSafeRedirectTarget(searchParams.get("redirectTo"));

    const supabase = createClient();

    // Reconcile intended_role from signup metadata with active_role in DB.
    // Handles case where client-side RPC failed during registration or
    // email verification callback hasn't run yet.
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const intendedRole = user.user_metadata?.intended_role as string | undefined;
        if (intendedRole) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("active_role")
            .eq("id", user.id)
            .single();

          if (profile && profile.active_role !== intendedRole) {
            await supabase.rpc("assign_role_atomic", {
              p_user_id: user.id,
              p_role: intendedRole,
            });
          }
        }
      }
    } catch {
      // Non-blocking: role can be fixed on next login or via settings
    }

    const { data: mfaData } = await supabase.auth.mfa.listFactors();
    const hasTotp = mfaData?.totp && mfaData.totp.length > 0;
    if (hasTotp) {
      router.push(`/two-factor?next=${encodeURIComponent(redirectTarget)}`);
      return;
    }

    router.push(redirectTarget);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {successMessage && (
        <div
          role="alert"
          className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          {successMessage}
        </div>
      )}
      {oauthError && (
        <Alert variant="destructive">
          <AlertDescription>{oauthError}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="h-10 pl-9"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-error">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            className="h-10 pr-10"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-error">{errors.password.message}</p>
        )}
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register("rememberMe")}
            className="size-4 rounded border-neutral-300 accent-brand-primary"
          />
          <span className="font-body text-sm text-neutral-600">Remember me</span>
        </label>
        <Link href="/forgot-password" className="font-body text-sm font-medium text-brand-accent hover:underline">
          Forgot password?
        </Link>
      </div>

      {/* CAPTCHA */}
      <TurnstileWidget
        onVerify={setCaptchaToken}
        onExpire={() => setCaptchaToken(null)}
        onError={() => setCaptchaToken(null)}
      />

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  );
}
