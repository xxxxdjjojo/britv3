import { Suspense } from "react";
import { Shield, ShieldCheck } from "lucide-react";
import { TwoFactorForm } from "@/components/auth/TwoFactorForm";
import { AuthDecorativeBackground } from "@/components/auth/AuthDecorativeBackground";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthFooter } from "@/components/auth/AuthFooter";

export const metadata = {
  title: "Two-Factor Authentication - Britestate",
};

export default function TwoFactorPage() {
  return (
    <div className="fixed inset-0 z-50 flex min-h-screen flex-col overflow-hidden bg-surface overflow-y-auto">
      <AuthDecorativeBackground />

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-[440px] space-y-8">
          {/* Shield icon + heading */}
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="flex size-16 items-center justify-center rounded-xl bg-brand-primary">
                <ShieldCheck className="size-8 text-white" aria-hidden="true" />
              </div>
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-neutral-900">
                Two-factor authentication
              </h1>
              <p className="mt-2 font-sans text-sm text-neutral-500">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
          </div>

          {/* Card with form */}
          <AuthCard>
            <Suspense>
              <TwoFactorForm />
            </Suspense>
          </AuthCard>

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-3">
              <Shield className="size-5 text-brand-primary" aria-hidden="true" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400">
                Encryption
              </span>
              <span className="text-xs font-medium text-neutral-700">End-to-end</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-3">
              <ShieldCheck className="size-5 text-brand-primary" aria-hidden="true" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400">
                Device
              </span>
              <span className="text-xs font-medium text-neutral-700">Trusted Secure</span>
            </div>
          </div>

          {/* Help text */}
          <p className="text-center font-sans text-sm text-neutral-500">
            Having trouble?{" "}
            <a
              href="/help"
              className="font-semibold text-brand-primary hover:underline underline-offset-2 transition-colors"
            >
              Contact Britestate support
            </a>
          </p>
        </div>
      </main>

      <footer className="relative z-10 flex shrink-0 justify-center px-6 pb-10">
        <AuthFooter variant="centered" />
      </footer>
    </div>
  );
}
