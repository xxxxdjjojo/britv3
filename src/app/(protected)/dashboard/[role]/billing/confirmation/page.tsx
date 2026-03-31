"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, Home, Loader2 } from "lucide-react";

export default function PaymentConfirmationPage() {
  const searchParams = useSearchParams();
  const params = useParams<{ role: string }>();
  const confettiFired = useRef(false);

  const plan = searchParams.get("plan") ?? "Britestate Plan";
  const amount = searchParams.get("amount");
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState<"polling" | "success" | "timeout">(
    sessionId ? "polling" : "success"
  );

  const formattedAmount = amount
    ? new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        minimumFractionDigits: 0,
      }).format(Number(amount) / 100)
    : null;

  // Poll the session status endpoint until the webhook has processed
  useEffect(() => {
    if (!sessionId || status !== "polling") return;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/billing/session/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "complete") {
            setStatus("success");
            clearInterval(interval);
          }
        }
      } catch { /* ignore network errors during polling */ }
      if (attempts >= 10) {
        setStatus("timeout");
        clearInterval(interval);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [sessionId, status]);

  // Fire confetti only once the subscription is confirmed active
  useEffect(() => {
    if (status !== "success") return;
    if (confettiFired.current) return;
    confettiFired.current = true;

    // Dynamically import canvas-confetti (lazy, 3KB)
    void import("canvas-confetti").then(({ default: confetti }) => {
      void confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#1B4D3E", "#2D7A5F", "#D4A853", "#2563EB", "#E8F5EE"],
      });
    });
  }, [status]);

  const dashboardPath = `/dashboard/${params.role}`;
  const billingPath = `/dashboard/${params.role}/billing`;

  // Polling state — waiting for webhook to confirm subscription
  if (status === "polling") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-primary/10 dark:bg-brand-primary/20">
            <Loader2
              className="animate-spin text-brand-primary"
              size={44}
            />
          </div>
          <div>
            <h1 className="font-heading text-xl font-semibold text-foreground">
              Processing your payment…
            </h1>
            <p className="mt-2 font-body text-sm text-neutral-500">
              Please wait while we confirm your subscription. This usually takes
              a few seconds.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Timeout state — webhook took too long, show a softer message
  if (status === "timeout") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
            <CheckCircle2 className="text-amber-700 dark:text-amber-300" size={44} />
          </div>
          <div>
            <h1 className="font-heading text-xl font-semibold text-foreground">
              Payment confirmed
            </h1>
            <p className="mt-2 font-body text-sm text-neutral-500">
              Payment confirmed but activation is taking longer than expected.
              Your dashboard will be ready shortly.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={dashboardPath}
              className="rounded-lg bg-brand-primary px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-brand-primary/90 inline-flex items-center gap-2"
            >
              Go to Dashboard
              <ArrowRight size={16} />
            </Link>
            <Button variant="outline" asChild>
              <Link href={billingPath}>
                <Home size={16} className="mr-2" />
                Billing Overview
              </Link>
            </Button>
          </div>
          <p className="font-body text-xs text-neutral-500">
            Questions? Contact us at{" "}
            <a href="mailto:support@britestate.co.uk" className="underline">
              support@britestate.co.uk
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Success state — webhook confirmed, subscription is active
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Success icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20">
          <CheckCircle2 className="text-green-700 dark:text-green-300" size={44} />
        </div>

        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">
            You&apos;re all set!
          </h1>
          <p className="mt-2 font-body text-sm text-neutral-500">
            Welcome to{" "}
            <span className="font-semibold text-foreground">
              {decodeURIComponent(plan)}
            </span>
            .
            {formattedAmount ? ` ${formattedAmount} has been charged.` : ""}
          </p>
        </div>

        <Card className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
          <CardContent className="py-5">
            <div className="space-y-3 text-sm text-left">
              <div className="flex items-center gap-2 font-body text-sm text-foreground">
                <CheckCircle2 size={16} className="text-green-600 dark:text-green-400 shrink-0" />
                <span>Subscription activated</span>
              </div>
              <div className="flex items-center gap-2 font-body text-sm text-foreground">
                <CheckCircle2 size={16} className="text-green-600 dark:text-green-400 shrink-0" />
                <span>Confirmation email sent</span>
              </div>
              <div className="flex items-center gap-2 font-body text-sm text-foreground">
                <CheckCircle2 size={16} className="text-green-600 dark:text-green-400 shrink-0" />
                <span>All features unlocked</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={dashboardPath}
            className="rounded-lg bg-brand-primary px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-brand-primary/90 inline-flex items-center gap-2"
          >
            Go to Dashboard
            <ArrowRight size={16} />
          </Link>
          <Button variant="outline" asChild>
            <Link href={billingPath}>
              <Home size={16} className="mr-2" />
              Billing Overview
            </Link>
          </Button>
        </div>

        {sessionId && (
          <p className="font-body text-xs text-neutral-500">
            Session: {sessionId.slice(0, 16)}…
          </p>
        )}

        <p className="font-body text-xs text-neutral-500">
          Questions? Contact us at{" "}
          <a href="mailto:support@britestate.co.uk" className="underline">
            support@britestate.co.uk
          </a>
        </p>
      </div>
    </div>
  );
}
