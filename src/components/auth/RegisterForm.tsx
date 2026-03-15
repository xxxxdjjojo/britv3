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
import { assignRole } from "@/services/auth/role-service";
import type { UserRole } from "@/types/auth";

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  intent: z.enum(["buy", "rent"]),
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
      const displayName = `${data.firstName} ${data.lastName}`.trim();
      const { error: authError } = await signUp(
        data.email,
        data.password,
        displayName,
      );
      if (authError) {
        const msg = authError.message ?? "";
        if (
          (authError as { status?: number }).status === 429 ||
          msg.includes("429") ||
          /rate/i.test(msg)
        ) {
          setError("Too many attempts. Please wait a moment.");
        } else {
          setError(msg || "An unexpected error occurred. Please try again.");
        }
        return;
      }

      // Bug 5: Replace inline role assignment with assignRole from role-service
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
          // Pass browser client so role-service doesn't reach for next/headers
          await assignRole(user.id, role, supabase);
        }
      } catch {
        // Non-blocking: role can be set later
      }

      // Bug 3: Redirect to /verify-email instead of /dashboard
      router.push("/verify-email");
    } catch (err) {
      if (err instanceof TypeError) {
        setError("No internet connection. Please try again.");
      } else if (
        err instanceof Error &&
        (err.message.includes("429") || /rate/i.test(err.message))
      ) {
        setError("Too many attempts. Please wait a moment.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
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
      <div className="grid grid-cols-2 gap-3">
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

      {/* Terms (inline) */}
      <p className="text-xs text-neutral-500">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="text-brand-accent hover:underline" target="_blank">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-brand-accent hover:underline" target="_blank">
          Privacy Policy
        </Link>
      </p>

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
