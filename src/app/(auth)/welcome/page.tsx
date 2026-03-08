import Link from "next/link";
import { CheckCircle, ShieldCheck, Lock, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";

export const metadata = {
  title: "Welcome to Britestate",
  description: "Your account is ready. Start searching for your perfect property.",
};

export default function WelcomePage() {
  return (
    <div className="space-y-8 text-center">
      {/* Logo */}
      <div className="flex justify-center">
        <Logo size="lg" />
      </div>

      {/* Animated check icon */}
      <div className="flex justify-center">
        <CheckCircle className="size-20 animate-bounce text-green-500" />
      </div>

      {/* Heading + subtitle */}
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-bold text-neutral-900">
          Welcome to Britestate!
        </h1>
        <p className="font-body text-base text-neutral-500">
          Your account is ready. Let&apos;s find your perfect property.
        </p>
      </div>

      {/* CTA buttons */}
      <div className="flex flex-col gap-3">
        <Button asChild size="lg" className="w-full">
          <Link href="/search">Start Searching</Link>
        </Button>
        <Button asChild variant="ghost" size="lg" className="w-full">
          <Link href="/dashboard">Complete Your Profile</Link>
        </Button>
      </div>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-4 text-xs text-neutral-400">
        <span className="flex items-center gap-1">
          <Lock className="size-3" aria-hidden="true" />
          256-bit Encrypted
        </span>
        <span className="text-neutral-300" aria-hidden="true">•</span>
        <span className="flex items-center gap-1">
          <ShieldCheck className="size-3" aria-hidden="true" />
          GDPR Compliant
        </span>
        <span className="text-neutral-300" aria-hidden="true">•</span>
        <span className="flex items-center gap-1">
          <MailCheck className="size-3" aria-hidden="true" />
          No Spam
        </span>
      </div>

      {/* Browse without account */}
      <p className="font-body text-sm text-neutral-400">
        Already exploring?{" "}
        <Link
          href="/search"
          className="font-medium text-brand-accent hover:underline"
        >
          Browse properties without an account
        </Link>
      </p>
    </div>
  );
}
