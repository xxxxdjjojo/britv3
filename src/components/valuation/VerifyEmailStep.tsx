"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OTPInput } from "@/components/auth/OTPInput";
import { trackEvent } from "@/lib/analytics/track-event";

export function VerifyEmailStep() {
  const router = useRouter();
  const [stage, setStage] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/email-code/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok && res.status !== 200) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't send a code. Please try again.");
        return;
      }
      trackEvent("otp_requested", {});
      setStage("code");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/email-code/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "That code is invalid or has expired.");
        return;
      }
      trackEvent("otp_verified", {});
      if (data.resultId) {
        router.push(`/value-my-property/result/${data.resultId}`);
      } else {
        router.push("/dashboard/seller");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand-primary" aria-hidden="true" />
        <p>
          {/* TODO(legal): privacy copy to be reviewed by qualified counsel. */}
          We use your email to create or access a free passwordless account and to save this
          valuation. We won&apos;t share your details with an estate agent unless you ask us to, and
          we won&apos;t add you to marketing. See our{" "}
          <Link href="/legal/privacy" className="font-medium text-brand-primary underline">
            privacy notice
          </Link>
          .
        </p>
      </div>

      {stage === "email" ? (
        <form onSubmit={requestCode} className="space-y-3">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={loading || !email.includes("@")} className="w-full">
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Send my code
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="space-y-4">
          <div>
            <Label>Enter the 6-digit code sent to {email}</Label>
            <div className="mt-3">
              <OTPInput value={code} onChange={setCode} autoFocus />
            </div>
          </div>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={loading || code.length !== 6} className="w-full">
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Verify & view my estimate
          </Button>
          <button
            type="button"
            onClick={requestCode}
            className="w-full text-center text-sm text-brand-primary underline"
          >
            Resend code or change email
          </button>
        </form>
      )}
    </div>
  );
}
