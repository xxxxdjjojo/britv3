"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signIn } from "@/services/auth/auth-service";
import { handleSupabaseError } from "@/lib/supabase-error";
import Link from "next/link";

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
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = getOAuthErrorMessage(searchParams.get("error"));
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const { error: authError } = await signIn(data.email, data.password);
    if (authError) {
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
    const redirectTo = searchParams.get("redirectTo");
    const destination =
      redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
        ? redirectTo
        : "/dashboard";
    router.push(destination);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
      <div className="space-y-1.5">
        <Label htmlFor="email" className="font-sans text-sm font-semibold text-brand-primary pl-1">
          Email address
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="py-3 pl-12 rounded-xl border-transparent bg-surface-container-low text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:border-transparent"
            autoComplete="email"
            aria-label="Email address"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-error" role="alert">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="password" className="font-sans text-sm font-semibold text-brand-primary pl-1">
          Password
        </Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            className="py-3 pl-12 pr-12 rounded-xl border-transparent bg-surface-container-low text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:border-transparent"
            autoComplete="current-password"
            aria-label="Password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-error" role="alert">{errors.password.message}</p>
        )}
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register("rememberMe")}
            aria-label="Remember me"
            className="size-4 rounded border-neutral-300 accent-brand-primary"
          />
          <span className="font-sans text-sm text-neutral-500">Remember me</span>
        </label>
        <Link
          href="/forgot-password"
          className="font-sans text-sm font-semibold text-brand-primary hover:underline underline-offset-2 transition-colors"
          aria-label="Forgot password"
        >
          Forgot password?
        </Link>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        className="w-full h-auto py-4 rounded-xl bg-brand-primary font-bold text-lg text-white hover:bg-brand-primary-light transition-colors shadow-lg shadow-brand-primary/20"
        disabled={isSubmitting}
        aria-label={isSubmitting ? "Signing in…" : "Sign in"}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            Signing in…
          </>
        ) : (
          <>
            Sign In
            <ArrowRight className="size-5" aria-hidden="true" />
          </>
        )}
      </Button>
    </form>
  );
}
