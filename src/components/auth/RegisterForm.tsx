"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { signUp } from "@/services/auth/auth-service";
import { createClient } from "@/lib/supabase/client";
import { CONSENT_TYPES } from "@/lib/constants";
import type { ConsentType } from "@/types/gdpr";

const registerSchema = z
  .object({
    displayName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "You must accept the Terms of Service and Privacy Policy",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [consentPrefs, setConsentPrefs] = useState<
    Record<ConsentType, boolean>
  >({
    marketing: false,
    analytics: false,
    third_party: false,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
    },
  });

  const password = watch("password");
  const termsAccepted = watch("termsAccepted");

  async function onSubmit(data: RegisterFormValues) {
    setError(null);
    const { error: authError } = await signUp(
      data.email,
      data.password,
      data.displayName,
    );
    if (authError) {
      setError(authError.message);
      return;
    }

    // Initialize consent records after signup
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const records = (
          Object.entries(consentPrefs) as [ConsentType, boolean][]
        ).map(([consentType, granted]) => ({
          user_id: user.id,
          consent_type: consentType,
          granted,
          ip_address: null,
          user_agent: navigator.userAgent,
        }));
        await supabase.from("consent_records").insert(records);
      }
    } catch {
      // Non-blocking: consent can be updated later in settings
    }

    router.push("/verify-email");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Display Name */}
      <div className="space-y-2">
        <Label htmlFor="displayName">Full name</Label>
        <Input
          id="displayName"
          type="text"
          placeholder="Your full name"
          className="h-10"
          aria-invalid={!!errors.displayName}
          {...register("displayName")}
        />
        {errors.displayName && (
          <p className="text-xs text-error">{errors.displayName.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <Input
          id="register-email"
          type="email"
          placeholder="you@example.com"
          className="h-10"
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
          className="h-10"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-error">{errors.password.message}</p>
        )}
        <PasswordStrengthMeter password={password} />
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          className="h-10"
          aria-invalid={!!errors.confirmPassword}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-error">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Terms & Privacy */}
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Checkbox
            id="termsAccepted"
            checked={termsAccepted}
            onCheckedChange={(checked: boolean) =>
              setValue("termsAccepted", checked, { shouldValidate: true })
            }
            className="mt-0.5"
          />
          <Label
            htmlFor="termsAccepted"
            className="text-xs font-normal leading-snug text-neutral-600"
          >
            I agree to the{" "}
            <Link
              href="/terms"
              className="font-medium text-brand-accent hover:underline"
              target="_blank"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="font-medium text-brand-accent hover:underline"
              target="_blank"
            >
              Privacy Policy
            </Link>
          </Label>
        </div>
        {errors.termsAccepted && (
          <p className="text-xs text-error">
            {errors.termsAccepted.message}
          </p>
        )}
      </div>

      {/* Optional Consent Toggles */}
      <div className="space-y-3 rounded-lg border border-neutral-200 p-3">
        <p className="font-body text-xs font-medium text-neutral-700">
          Optional data preferences
        </p>
        {CONSENT_TYPES.map((ct) => (
          <div
            key={ct.value}
            className="flex items-center justify-between gap-2"
          >
            <div>
              <p className="font-body text-xs font-medium text-neutral-700">
                {ct.label}
              </p>
              <p className="font-body text-[10px] text-neutral-500">
                {ct.description}
              </p>
            </div>
            <Switch
              checked={consentPrefs[ct.value]}
              onCheckedChange={(checked: boolean) =>
                setConsentPrefs((prev) => ({
                  ...prev,
                  [ct.value]: checked,
                }))
              }
              aria-label={ct.label}
              size="sm"
            />
          </div>
        ))}
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
          "Create Account"
        )}
      </Button>
    </form>
  );
}
