"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
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
import { PENDING_SIGNUP_EMAIL_KEY } from "@/lib/auth/signup-confirmation";
import type { UserRole } from "@/types/auth";

// Buyer/renter signup collects only email + password (+ consent). Names are
// collected ONLY for professional roles, where they are still required —
// professional auth is intentionally unchanged. The conditional requirement is
// enforced by superRefine on `isProfessional`.
const registerSchema = z
  .object({
    firstName: z.string().max(50, "First name must be 50 characters or fewer").optional(),
    lastName: z.string().max(50, "Last name must be 50 characters or fewer").optional(),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    intent: z.enum(["buy", "rent"]),
    isProfessional: z.boolean(),
    termsAccepted: z.literal(true, "You must accept the Terms of Service and Privacy Policy"),
    marketingConsent: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.isProfessional) return;
    if (!data.firstName || data.firstName.trim().length < 1) {
      ctx.addIssue({ path: ["firstName"], code: "custom", message: "First name is required" });
    }
    if (!data.lastName || data.lastName.trim().length < 1) {
      ctx.addIssue({ path: ["lastName"], code: "custom", message: "Last name is required" });
    }
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
      isProfessional: false,
      termsAccepted: false as unknown as true,
      marketingConsent: false,
    },
  });

  // Bug 4: Read ?professional= param on mount and pre-set role intent
  // Also reads ?role= as a fallback (used by the pricing page)
  useEffect(() => {
    const professional = searchParams.get("professional") ?? searchParams.get("role");
    if (professional) {
      const mappedRole = PROFESSIONAL_ROLE_MAP[professional.toLowerCase()];
      if (mappedRole) {
        setProfessionalRole(mappedRole);
        setValue("isProfessional", true);
      }
    }
  }, [searchParams, setValue]);

  const password = watch("password");
  const intent = watch("intent");

  async function onSubmit(data: RegisterFormValues) {
    // Bug 9: Wrap entire onSubmit in try/catch with specific error handling
    try {
      setError(null);
      // Names are professional-only; consumers register without a display name
      // (it can be set later in profile settings).
      const displayName = professionalRole
        ? sanitize(`${data.firstName ?? ""} ${data.lastName ?? ""}`.trim())
        : undefined;
      // Role travels as signup metadata (role_intent); the email-confirmation
      // callback assigns it once the user confirms — there is no authenticated
      // session at this point to call assign_role_atomic against.
      const role: UserRole = professionalRole
        ? professionalRole
        : data.intent === "rent"
          ? "renter"
          : "homebuyer";
      const { error: authError } = await signUp(
        data.email,
        data.password,
        displayName,
        role,
      );
      if (authError) {
        setError(handleSupabaseError(authError).message);
        return;
      }

      // Remember which email is awaiting confirmation so /verify-email can
      // surface it and offer a resend.
      window.localStorage.setItem(PENDING_SIGNUP_EMAIL_KEY, data.email);

      // Trigger referral attribution.
      // The API reads the httpOnly britestate_ref cookie server-side (eng review 6A).
      try {
        await fetch("/api/referrals/v2/attribute", { method: "POST" });
      } catch {
        // Non-critical — don't block signup
        console.warn("[referral] Failed to trigger attribution");
      }

      // Persist marketing consent to consent_records (GDPR audit trail)
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
          // Non-blocking — consent can be managed in settings
        }
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

      {/* Name fields — professional roles only; buyers/renters sign up with
          just email + password (names can be added later in settings). */}
      {professionalRole && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="Jane"
              className="h-11"
              autoComplete="given-name"
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
              autoComplete="family-name"
              aria-invalid={!!errors.lastName}
              {...register("lastName")}
            />
            {errors.lastName && (
              <p className="text-xs text-error">{errors.lastName.message}</p>
            )}
          </div>
        </div>
      )}

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="register-email">Email address</Label>
        <Input
          id="register-email"
          type="email"
          placeholder="you@example.com"
          className="h-11"
          autoComplete="email"
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
        <div className="relative">
          <Input
            id="register-password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a password"
            className="h-11 pr-10"
            autoComplete="new-password"
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
        <PasswordStrengthMeter password={password} />
      </div>

      {/* GDPR-compliant consent — UK GDPR Article 7 */}
      <div className="space-y-3">
        <div className="flex items-start gap-2">
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
            <Link href="/legal/terms" className="text-brand-accent hover:underline" target="_blank">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/legal/privacy" className="text-brand-accent hover:underline" target="_blank">Privacy Policy</Link>
          </label>
        </div>
        {errors.termsAccepted && (
          <p className="text-xs text-error">{errors.termsAccepted.message}</p>
        )}

        <div className="flex items-start gap-2">
          <Checkbox
            id="marketing-consent"
            checked={watch("marketingConsent") === true}
            onCheckedChange={(checked) =>
              setValue("marketingConsent", checked === true)
            }
            className="mt-0.5"
          />
          <label htmlFor="marketing-consent" className="text-xs text-neutral-500 leading-relaxed cursor-pointer">
            I&apos;d like to receive property alerts and promotional offers via email
          </label>
        </div>
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
