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
    const redirectTo = searchParams.get("redirectTo");
    // Prevent open redirect — must be internal path
    const destination = redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/dashboard";
    router.push(destination);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            autoComplete="email"
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
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-0 top-1/2 -translate-y-1/2 flex min-h-11 min-w-11 items-center justify-center text-neutral-400 hover:text-neutral-600"
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
