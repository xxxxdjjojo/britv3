"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { signUp } from "@/services/auth/auth-service";
import { createClient } from "@/lib/supabase/client";
import { handleSupabaseError } from "@/lib/supabase-error";
import { sanitize } from "@/lib/sanitize";
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
  termsAccepted: z.literal(true, "You must accept the Terms of Service and Privacy Policy"),
  marketingConsent: z.boolean().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

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
  const [showPassword, setShowPassword] = useState(false);

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
      termsAccepted: false as unknown as true,
      marketingConsent: false,
    },
  });

  useEffect(() => {
    const professional = searchParams.get("professional") ?? searchParams.get("role");
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
    try {
      setError(null);
      const displayName = sanitize(`${data.firstName} ${data.lastName}`.trim());
      const { error: authError } = await signUp(
        data.email,
        data.password,
        displayName,
      );
      if (authError) {
        setError(handleSupabaseError(authError).message);
        return;
      }

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

      try {
        await fetch("/api/referrals/v2/attribute", { method: "POST" });
      } catch {
        // Non-critical — don't block signup
      }

      if (data.marketingConsent) {
        try {
          const supabase = createClient();
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            await supabase.from("consent_records").upsert(
              {
                user_id: currentUser.id,
                consent_type: "marketing",
                granted: true,
                ip_address: null,
                user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
              },
              { onConflict: "user_id,consent_type" },
            );
          }
        } catch {
          // Non-blocking
        }
      }

      router.push("/verify-email");
    } catch (err) {
      setError(handleSupabaseError(err).message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

      {/* Intent Toggle — hidden when professional role is pre-selected */}
      {!professionalRole && (
        <div className="flex rounded-xl border border-neutral-200 bg-neutral-50 p-1 gap-1">
          <button
            type="button"
            onClick={() => setValue("intent", "buy")}
            aria-label="I want to buy"
            className={`flex-1 rounded-lg py-2 text-center text-sm font-medium transition-all duration-150 ${
              intent === "buy"
                ? "bg-brand-primary text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            I want to buy
          </button>
          <button
            type="button"
            onClick={() => setValue("intent", "rent")}
            aria-label="I want to rent"
            className={`flex-1 rounded-lg py-2 text-center text-sm font-medium transition-all duration-150 ${
              intent === "rent"
                ? "bg-brand-primary text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            I want to rent
          </button>
        </div>
      )}

      {/* Name fields — side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName" className="font-body text-sm font-medium text-neutral-700">
            First name
          </Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <Input
              id="firstName"
              type="text"
              placeholder="Jane"
              className="h-11 pl-10 rounded-lg border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-brand-primary/30 focus-visible:border-brand-primary"
              autoComplete="given-name"
              aria-label="First name"
              aria-invalid={!!errors.firstName}
              {...register("firstName")}
            />
          </div>
          {errors.firstName && (
            <p className="text-xs text-error" role="alert">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName" className="font-body text-sm font-medium text-neutral-700">
            Last name
          </Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <Input
              id="lastName"
              type="text"
              placeholder="Smith"
              className="h-11 pl-10 rounded-lg border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-brand-primary/30 focus-visible:border-brand-primary"
              autoComplete="family-name"
              aria-label="Last name"
              aria-invalid={!!errors.lastName}
              {...register("lastName")}
            />
          </div>
          {errors.lastName && (
            <p className="text-xs text-error" role="alert">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="register-email" className="font-body text-sm font-medium text-neutral-700">
          Email address
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
          <Input
            id="register-email"
            type="email"
            placeholder="you@example.com"
            className="h-11 pl-10 rounded-lg border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-brand-primary/30 focus-visible:border-brand-primary"
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
        <Label htmlFor="register-password" className="font-body text-sm font-medium text-neutral-700">
          Password
        </Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
          <Input
            id="register-password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a strong password"
            className="h-11 pl-10 pr-11 rounded-lg border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-brand-primary/30 focus-visible:border-brand-primary"
            autoComplete="new-password"
            aria-label="Password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-error" role="alert">{errors.password.message}</p>
        )}
        <PasswordStrengthMeter password={password} />
      </div>

      {/* GDPR consent — UK GDPR Article 7 */}
      <div className="space-y-3 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
        <div className="flex items-start gap-2.5">
          <Checkbox
            id="terms-accepted"
            checked={watch("termsAccepted") === true}
            onCheckedChange={(checked) =>
              setValue("termsAccepted", checked === true ? true : (false as unknown as true), { shouldValidate: true })
            }
            aria-invalid={!!errors.termsAccepted}
            className="mt-0.5"
          />
          <label htmlFor="terms-accepted" className="text-xs text-neutral-600 leading-relaxed cursor-pointer">
            I agree to the{" "}
            <Link href="/terms" className="font-medium text-brand-primary hover:underline" target="_blank">
              Terms of Service
            </Link>
            {" "}and{" "}
            <Link href="/privacy" className="font-medium text-brand-primary hover:underline" target="_blank">
              Privacy Policy
            </Link>
          </label>
        </div>
        {errors.termsAccepted && (
          <p className="text-xs text-error" role="alert">{errors.termsAccepted.message}</p>
        )}

        <div className="flex items-start gap-2.5">
          <Checkbox
            id="marketing-consent"
            checked={watch("marketingConsent") === true}
            onCheckedChange={(checked) =>
              setValue("marketingConsent", checked === true)
            }
            className="mt-0.5"
          />
          <label htmlFor="marketing-consent" className="text-xs text-neutral-500 leading-relaxed cursor-pointer">
            Send me property alerts and offers (optional)
          </label>
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        className="w-full h-11 rounded-lg bg-brand-primary font-semibold text-white hover:bg-brand-primary-light transition-colors shadow-sm"
        disabled={isSubmitting}
        aria-label={isSubmitting ? "Creating account…" : "Create account"}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Creating account…
          </>
        ) : (
          "Create Account"
        )}
      </Button>

      {/* Professional link */}
      <div className="text-center">
        <Link
          href="/register/role-select"
          className="text-sm font-medium text-brand-primary hover:underline underline-offset-2 transition-colors"
          aria-label="Sign up as a professional"
        >
          I&apos;m a professional — see professional options
        </Link>
      </div>
    </form>
  );
}
