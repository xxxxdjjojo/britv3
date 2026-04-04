import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getVerificationSteps,
  getProviderBadges,
} from "@/services/provider/provider-verification-service";
import { computeTrustScore } from "@/services/provider/trust-score-service";

export const metadata = {
  title: "Verification Overview | Provider Dashboard",
};

type VerificationCardConfig = Readonly<{
  icon: string;
  title: string;
  description: string;
  stepId: string;
  href: string;
}>;

const VERIFICATION_CARDS: VerificationCardConfig[] = [
  {
    icon: "badge",
    title: "Identity Verification",
    description: "Biometric and government ID authentication.",
    stepId: "id_check",
    href: "/dashboard/provider/verification/credentials",
  },
  {
    icon: "policy",
    title: "Insurance Documents",
    description: "Public Liability & Professional Indemnity.",
    stepId: "insurance",
    href: "/dashboard/provider/verification/credentials",
  },
  {
    icon: "school",
    title: "Professional Qualifications",
    description: "RICS accreditation and industry diplomas.",
    stepId: "qualifications",
    href: "/dashboard/provider/verification/credentials",
  },
  {
    icon: "groups",
    title: "Client References",
    description: "Awaiting verified client responses.",
    stepId: "client_references",
    href: "/dashboard/provider/verification/client-references",
  },
  {
    icon: "handshake",
    title: "Peer References",
    description: "Industry expert endorsements for Gold tier.",
    stepId: "peer_references",
    href: "/dashboard/provider/verification/peer-references",
  },
];

type StepStatusBadge = Readonly<{
  label: string;
  className: string;
  actionLabel: string;
  actionClass: string;
}>;

const STATUS_BADGE: Record<string, StepStatusBadge> = {
  approved: {
    label: "Verified",
    className: "bg-success-light text-success",
    actionLabel: "View Details",
    actionClass: "text-primary",
  },
  submitted: {
    label: "Under Review",
    className: "bg-secondary-container text-on-secondary-container",
    actionLabel: "View Details",
    actionClass: "text-primary",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-secondary-container text-on-secondary-container",
    actionLabel: "Continue",
    actionClass: "text-primary",
  },
  rejected: {
    label: "Rejected",
    className: "bg-error-container text-on-error-container",
    actionLabel: "Re-apply",
    actionClass: "text-error",
  },
  not_started: {
    label: "Not Started",
    className: "bg-surface-container text-on-surface-variant",
    actionLabel: "Get Started",
    actionClass: "text-primary",
  },
};

function getStatusForStep(stepId: string, stepsMap: Map<string, string>): string {
  return stepsMap.get(stepId) ?? "not_started";
}

// Insurance expiring in 14 days — this would normally come from actual doc data
const INSURANCE_EXPIRING = true;

export default async function VerificationOverviewPage() {
  try {
    const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = providerProfile?.user_id ?? user.id;

  const [steps, badges] = await Promise.all([
    getVerificationSteps(providerId, supabase),
    getProviderBadges(supabase, providerId).catch(() => []),
  ]);

  const trustScore = computeTrustScore(steps);
  const now = new Date();
  const activeCertCount = badges.filter((b) => {
    if (!b.expires_at) return true;
    return new Date(b.expires_at).getTime() > now.getTime();
  }).length;

  // Build a map of stepId -> status for quick lookup
  const stepsMap = new Map(steps.map((s) => [s.stepId, s.status]));

  // Approximate tier progress (trust score as proxy)
  const tierProgress = Math.min(Math.round(trustScore), 100);
  const tier = tierProgress >= 90 ? "Gold" : tierProgress >= 60 ? "Silver" : "Bronze";
  const nextTier = tier === "Gold" ? null : tier === "Silver" ? "Gold" : "Silver";

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Page Header */}
      <div className="mb-16">
        <span className="text-xs uppercase tracking-[0.05em] text-primary mb-2 block font-semibold font-label">
          Compliance Hub
        </span>
        <h1 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight mb-4">
          Verification Overview
        </h1>
        <p className="text-on-surface-variant max-w-2xl leading-relaxed">
          Maintain your professional standing to unlock premium property listings and higher trust
          scores within the network.
        </p>
      </div>

      {/* Central Status Card + Quick Stats */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
        {/* Hero card */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-xl bg-primary-container p-10 text-white flex flex-col justify-between shadow-[0_20px_50px_rgba(0,54,41,0.08)]">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full mb-6">
              <span className="text-xs font-label uppercase tracking-wider font-semibold">
                Current Status
              </span>
            </div>
            <h2 className="text-5xl font-headline font-bold mb-2">{tier} Tier</h2>
            {nextTier && (
              <p className="text-on-primary-container text-lg">
                You are {tierProgress}% of the way to {nextTier} Status.
              </p>
            )}
          </div>
          {nextTier && (
            <div className="mt-12 relative z-10">
              <div className="flex justify-between items-end mb-3">
                <span className="text-sm font-medium opacity-80">Progress to {nextTier}</span>
                <span className="text-2xl font-bold">{tierProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary-fixed-dim rounded-full transition-all"
                  style={{ width: `${tierProgress}%` }}
                />
              </div>
            </div>
          )}
          {/* Decorative */}
          <div className="absolute top-0 right-0 w-64 h-64 -translate-y-1/2 translate-x-1/4 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 translate-y-1/2 -translate-x-1/4 bg-secondary-fixed-dim/10 rounded-full blur-3xl" />
        </div>

        {/* Quick Stats */}
        <div className="bg-surface-container-low rounded-xl p-8 flex flex-col justify-center">
          <div className="mb-8">
            <span className="text-on-surface-variant text-sm block mb-1">Trust Score</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-headline font-bold text-on-surface">
                {Math.round(trustScore)}
              </span>
              <span className="text-success text-xs font-bold">pts</span>
            </div>
          </div>
          <div className="mb-8">
            <span className="text-on-surface-variant text-sm block mb-1">
              Active Certifications
            </span>
            <span className="text-4xl font-headline font-bold text-on-surface">
              {String(activeCertCount).padStart(2, "0")}
            </span>
          </div>
          <div>
            <Link
              href="/dashboard/provider/verification/badges"
              className="block w-full bg-secondary-fixed-dim text-on-secondary-fixed px-6 py-4 rounded-lg font-bold hover:opacity-90 transition-all text-sm uppercase tracking-widest text-center"
            >
              View Badges
            </Link>
          </div>
        </div>
      </section>

      {/* Verification Grid */}
      <section className="mb-20">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-2xl font-headline font-bold">Verification Actions</h2>
          <p className="text-on-surface-variant text-sm">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {VERIFICATION_CARDS.map((card) => {
            const status = getStatusForStep(card.stepId, stepsMap);
            const badge = STATUS_BADGE[status] ?? STATUS_BADGE["not_started"];
            const isInsurance = card.stepId === "insurance";
            const showExpiring = isInsurance && INSURANCE_EXPIRING;
            const displayBadge = showExpiring
              ? { label: "Expiring Soon", className: "bg-error-container text-on-error-container", actionLabel: "Update Now", actionClass: "text-error" }
              : badge;

            return (
              <div
                key={card.stepId}
                className="bg-surface-container-lowest rounded-xl p-6 flex flex-col gap-6 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(26,28,28,0.05)] group"
              >
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-white transition-colors">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  </div>
                  <span
                    className={[
                      "text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full",
                      displayBadge.className,
                    ].join(" ")}
                  >
                    {displayBadge.label}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">{card.title}</h3>
                  <p className="text-on-surface-variant text-sm">{card.description}</p>
                </div>
                <div className="pt-4 border-t border-surface-container">
                  <Link
                    href={card.href}
                    className={[
                      "text-xs font-bold uppercase tracking-widest flex items-center gap-2",
                      displayBadge.actionClass,
                    ].join(" ")}
                  >
                    {displayBadge.actionLabel}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Add new credential CTA */}
          <Link
            href="/dashboard/provider/verification/credentials"
            className="border-2 border-dashed border-outline-variant/50 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-4 hover:border-primary-container hover:bg-surface-container-low transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-lg">Add New Credential</h3>
              <p className="text-on-surface-variant text-sm">Upload further proof of excellence</p>
            </div>
          </Link>
        </div>
      </section>

      {/* What's Next stepper */}
      <section className="bg-surface-container-low rounded-2xl p-12">
        <div className="mb-12">
          <h2 className="text-2xl font-headline font-bold mb-2">What&apos;s Next?</h2>
          <p className="text-on-surface-variant">
            Your roadmap to reaching{" "}
            <span className="text-primary font-semibold">{nextTier ?? "Gold"} Status</span>{" "}
            by end of Q3.
          </p>
        </div>

        <div className="relative">
          {/* Vertical connector */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-outline-variant/30" />

          <div className="space-y-12">
            {steps.map((step, idx) => {
              const isDone = step.status === "approved";
              const isActive = step.status === "in_progress" || step.status === "submitted";

              return (
                <div key={step.stepId} className="relative flex gap-8">
                  <div
                    className={[
                      "w-8 h-8 rounded-full flex items-center justify-center text-white z-10 shrink-0",
                      isDone
                        ? "bg-success"
                        : isActive
                          ? "bg-primary ring-4 ring-white"
                          : "bg-outline-variant",
                    ].join(" ")}
                  >
                    {isDone ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <span className="text-xs font-bold">{String(idx + 1).padStart(2, "0")}</span>
                    )}
                  </div>

                  <div className={isDone || isActive ? "" : "opacity-50"}>
                    <h4
                      className={[
                        "font-bold text-lg",
                        isDone ? "text-brand-primary" : "text-on-surface",
                      ].join(" ")}
                    >
                      {step.label}
                    </h4>
                    <p className="text-on-surface-variant text-sm mt-1">{step.description}</p>
                    {isActive && (
                      <div className="mt-4 flex gap-4">
                        <Link
                          href={`/dashboard/provider/verification/credentials`}
                          className="bg-primary text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-primary-container transition-colors"
                        >
                          Upload Docs
                        </Link>
                        <Link
                          href="/help?topic=verification"
                          className="border border-outline-variant px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-surface-container transition-colors"
                        >
                          Contact Agent
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
    );
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error;
    return (
      <div className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-4xl font-extrabold font-headline text-on-surface">Verification Centre</h1>
        <p className="mt-4 text-on-surface-variant">Unable to load verification data. Please try refreshing the page.</p>
      </div>
    );
  }
}
