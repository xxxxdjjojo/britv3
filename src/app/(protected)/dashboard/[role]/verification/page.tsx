"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Mail,
  Phone,
  Fingerprint,
  Briefcase,
  CheckCircle2,
  Circle,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type VerificationItem = {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  href: string;
};

const ROLE_CREDENTIALS: Record<string, string> = {
  agent: "RICS / Propertymark membership",
  provider: "Trade qualifications & insurance",
  landlord: "Landlord registration certificate",
};

export default function VerificationPage({
  params,
}: Readonly<{ params: Promise<{ role: string }> }>) {
  const { role } = use(params);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [identityVerified, setIdentityVerified] = useState(false);
  const [credentialsVerified, setCredentialsVerified] = useState(false);

  useEffect(() => {
    async function loadVerification() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setEmailVerified(!!user.email_confirmed_at);
          setPhoneVerified(!!user.phone);

          const { data: profile } = await supabase
            .from("profiles")
            .select("identity_verified, provider_verification_status")
            .eq("id", user.id)
            .single();

          if (profile) {
            setIdentityVerified(!!profile.identity_verified);
            setCredentialsVerified(
              profile.provider_verification_status === "verified",
            );
          }
        }
      } catch {
        // Silently handle errors
      } finally {
        setLoading(false);
      }
    }

    loadVerification();
  }, []);

  const hasProfessionalRole = ["agent", "provider", "landlord"].includes(role);

  const items: VerificationItem[] = [
    {
      key: "email",
      label: "Email Verified",
      description: "Confirm your email address to secure your account",
      icon: <Mail className="w-5 h-5" />,
      completed: emailVerified,
      href: `/dashboard/${role}/settings/security`,
    },
    {
      key: "phone",
      label: "Phone Verified",
      description: "Add and verify your phone number for two-factor authentication",
      icon: <Phone className="w-5 h-5" />,
      completed: phoneVerified,
      href: `/dashboard/${role}/settings/security`,
    },
    {
      key: "identity",
      label: "Identity Verified",
      description:
        "Upload a government-issued ID to verify your identity",
      icon: <Fingerprint className="w-5 h-5" />,
      completed: identityVerified,
      href: `/dashboard/${role}/settings/security`,
    },
    ...(hasProfessionalRole
      ? [
          {
            key: "credentials",
            label: "Professional Credentials",
            description:
              ROLE_CREDENTIALS[role] ??
              "Upload your professional credentials for verification",
            icon: <Briefcase className="w-5 h-5" />,
            completed: credentialsVerified,
            href: `/dashboard/${role}/settings/profile`,
          },
        ]
      : []),
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const allComplete = completedCount === totalCount;

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Header */}
      <div className="mb-10">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-on-surface mb-2">
              Verification
            </h1>
            <p className="text-on-surface-variant font-sans max-w-2xl">
              Complete your verification to unlock all features and build trust
              with other users.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-xl">
            <ShieldCheck
              className={`w-5 h-5 ${allComplete ? "text-brand-primary" : "text-outline"}`}
            />
            <span className="text-sm font-semibold text-on-surface">
              {completedCount}/{totalCount} complete
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-10">
        <div className="h-2 bg-surface-container-low rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-primary rounded-full transition-all duration-500"
            style={{
              width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : "0%",
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface-container-lowest rounded-xl p-6 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-container-low" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-container-low rounded w-1/3" />
                  <div className="h-3 bg-surface-container-low rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {allComplete && (
            <div className="flex items-center gap-3 rounded-xl bg-primary-container/20 px-5 py-4 mb-6">
              <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold text-brand-primary">
                  Fully verified
                </p>
                <p className="text-xs text-brand-primary/70">
                  Your account is fully verified. You have access to all platform
                  features.
                </p>
              </div>
            </div>
          )}

          {items.map((item) => (
            <div
              key={item.key}
              className={`bg-surface-container-lowest rounded-xl p-6 flex items-center gap-5 shadow-[0_4px_24px_rgba(26,28,28,0.04)] hover:shadow-[0_8px_32px_rgba(26,28,28,0.08)] transition-all duration-300 ${
                item.completed
                  ? "border-l-4 border-brand-primary"
                  : "border-l-4 border-outline-variant"
              }`}
            >
              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  item.completed
                    ? "bg-primary-container/20 text-brand-primary"
                    : "bg-surface-container-low text-outline"
                }`}
              >
                {item.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-heading text-base font-bold text-on-surface">
                    {item.label}
                  </h3>
                  {item.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-outline shrink-0" />
                  )}
                </div>
                <p className="text-sm text-on-surface-variant">
                  {item.description}
                </p>
              </div>

              {/* Action */}
              {!item.completed && (
                <Link
                  href={item.href}
                  className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-white rounded-lg text-sm font-semibold hover:bg-brand-primary/90 transition-colors"
                >
                  Verify
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          ))}

          {!allComplete && (
            <div className="flex items-center gap-3 rounded-xl bg-surface-container-low px-5 py-4 mt-6">
              <AlertCircle className="w-4 h-4 text-outline shrink-0" />
              <p className="text-xs text-on-surface-variant">
                Verification helps protect your account and builds trust with
                other users on Britestate. Some features may be limited until
                verification is complete.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
