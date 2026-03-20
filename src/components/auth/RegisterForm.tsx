"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { signUp } from "@/services/auth/auth-service";
import { createClient } from "@/lib/supabase/client";
import { handleSupabaseError } from "@/lib/supabase-error";
import { sanitize } from "@/lib/sanitize";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import type { UserRole } from "@/types/auth";

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name must be 50 characters or fewer"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name must be 50 characters or fewer"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  intent: z.enum(["buy", "rent"]),
  termsConsent: z.literal(true, { message: "You must agree to the terms" }),
  marketingConsent: z.boolean().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

// Professional roles that can be pre-selected via ?professional= param
const PROFESSIONAL_ROLE_MAP: Record<string, UserRole> = {
  agent: "agent",
  seller: "seller",
  landlord: "landlord",
  provider: "service_provider",
  service_provider: "service_provider",
};

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [professionalRole, setProfessionalRole] = useState<UserRole | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      intent: "buy",
      termsConsent: false as unknown as true,
      marketingConsent: false,
    },
  });

  // Bug 4: Read ?professional= param on mount and pre-set role intent
  useEffect(() => {
    const professional = searchParams.get("professional");
    if (professional) {
      const mappedRole = PROFESSIONAL_ROLE_MAP[professional.toLowerCase()];
      if (mappedRole) {
        setProfessionalRole(mappedRole);
      }
    }
  }, [searchParams]);

  const password = watch("password");
  const intent = watch("intent");

  async function onSubmit(data: RegisterFormValues) {
    // Bug 9: Wrap entire onSubmit in try/catch with specific error handling
    try {
      setError(null);

      // Verify CAPTCHA if Turnstile is configured
      if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captchaToken) {
        setError("Please complete the CAPTCHA verification.");
        return;
      }

      const displayName = sanitize(`${data.firstName} ${data.lastName}`.trim());
      const intendedRole = professionalRole
        ? professionalRole
        : data.intent === "rent"
          ? "renter"
          : "homebuyer";
      const { error: authError } = await signUp(
        data.email,
        data.password,
        displayName,
        captchaToken,
        intendedRole,
      );
      // Always redirect to verify-email regardless of error to prevent enumeration.
      // If user already exists, they'll get a "reset password" email instead.
      // Only show error for network/unexpected failures.
      if (authError) {
        const errMsg = (authError as { message?: string }).message ?? "";
        const isUserExists = /already registered|already been registered|user_already_exists/i.test(errMsg);
        if (isUserExists) {
          // Don't reveal that the user exists — show same flow as success
          router.push("/verify-email");
          return;
        }
        // Only show error for genuine failures (network, server error, etc.)
        setError(handleSupabaseError(authError).message);
        return;
      }

      // Assign role atomically via RPC (avoids importing server-only role-service)
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const role: UserRole = professionalRole
            ? professionalRole
            : data.intent === "rent"
              ? "renter"
              : "homebuyer";
          await supabase.rpc("assign_role_atomic", {
            p_user_id: user.id,
            p_role: role,
          });
        }
      } catch {
        // Non-blocking: role can be set later via callback
      }

      // Trigger referral attribution.
      // The API reads the httpOnly britestate_ref cookie server-side (eng review 6A).
      try {
        await fetch("/api/referrals/v2/attribute", { method: "POST" });
      } catch {
        // Non-critical — don't block signup
        console.warn("[referral] Failed to trigger attribution");
      }

      // Bug 3: Redirect to /verify-email instead of /dashboard
      router.push("/verify-email");
    } catch (err) {
      setError(handleSupabaseError(err).message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Role badge */}
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-medium text-brand-primary">
          {professionalRole
            ? `Signing up as: ${professionalRole.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}`
            : `Signing up as: ${intent === "rent" ? "Renter" : "Buyer"}`}
        </span>
      </div>

      {/* Intent Toggle: Buy / Rent — hidden when professional role is pre-selected */}
      {!professionalRole && (
        <div className="flex rounded-lg border border-neutral-200 p-1">
          <button
            type="button"
            onClick={() => setValue("intent", "buy")}
            className={`flex-1 rounded-md py-2 text-center text-sm font-medium transition-colors ${
              intent === "buy"
                ? "bg-brand-primary text-white"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            I want to buy
          </button>
          <button
            type="button"
            onClick={() => setValue("intent", "rent")}
            className={`flex-1 rounded-md py-2 text-center text-sm font-medium transition-colors ${
              intent === "rent"
                ? "bg-brand-primary text-white"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            I want to rent
          </button>
        </div>
      )}

      {/* Name fields — side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            type="text"
            placeholder="Jane"
            className="h-11"
            aria-invalid={!!errors.firstName}
            {...register("firstName")}
          />
          {errors.firstName && (
            <p className="text-xs text-error">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Smith"
            className="h-11"
            aria-invalid={!!errors.lastName}
            {...register("lastName")}
          />
          {errors.lastName && (
            <p className="text-xs text-error">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="register-email">Email address</Label>
        <Input
          id="register-email"
          type="email"
          placeholder="you@example.com"
          className="h-11"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-xs text-error">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="register-password">Password</Label>
        <Input
          id="register-password"
          type="password"
          placeholder="Create a password"
          className="h-11"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-error">{errors.password.message}</p>
        )}
        <PasswordStrengthMeter password={password} />
      </div>

      {/* GDPR Consent */}
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="termsConsent"
            {...register("termsConsent")}
            className="mt-1 size-4 rounded border-neutral-300 accent-brand-primary"
          />
          <label htmlFor="termsConsent" className="text-xs text-neutral-600 cursor-pointer">
            I agree to the{" "}
            <Link href="/legal/terms" className="text-brand-accent hover:underline" target="_blank">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/legal/privacy" className="text-brand-accent hover:underline" target="_blank">
              Privacy Policy
            </Link>{" "}
            <span className="text-error">*</span>
          </label>
        </div>
        {errors.termsConsent && (
          <p className="text-xs text-error">{errors.termsConsent.message}</p>
        )}

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="marketingConsent"
            {...register("marketingConsent")}
            className="mt-1 size-4 rounded border-neutral-300 accent-brand-primary"
          />
          <label htmlFor="marketingConsent" className="text-xs text-neutral-600 cursor-pointer">
            I&apos;d like to receive property alerts and market updates (optional)
          </label>
        </div>
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
            Creating account...
          </>
        ) : (
          "Continue"
        )}
      </Button>

      {/* Professional link */}
      <div className="text-center">
        <Link
          href="/register/role-select"
          className="text-sm font-medium text-brand-accent hover:underline"
        >
          I am a professional
        </Link>
      </div>
    </form>
  );
}
