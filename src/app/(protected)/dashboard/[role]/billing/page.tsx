// src/app/(protected)/dashboard/[role]/billing/page.tsx
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  FileText,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { formatGBP, formatDate } from "@/lib/formatters";

type SubscriptionRow = {
  status: string;
  plan_name: string | null;
  price_amount: number | null;
  currency: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

function statusConfig(status: string) {
  switch (status) {
    case "active":
      return { label: "Active", icon: CheckCircle2, color: "text-success", bg: "bg-success-light ring-1 ring-success/20 dark:bg-success/10 dark:ring-success/30" };
    case "trialing":
      return { label: "Trial", icon: Clock, color: "text-brand-accent", bg: "bg-brand-accent-light ring-1 ring-brand-accent/20 dark:bg-brand-accent/10 dark:ring-brand-accent/30" };
    case "past_due":
      return { label: "Past due", icon: AlertCircle, color: "text-warning", bg: "bg-warning-light ring-1 ring-warning/20 dark:bg-warning/10 dark:ring-warning/30" };
    default:
      return { label: "No plan", icon: AlertCircle, color: "text-neutral-500", bg: "bg-muted/40 ring-1 ring-neutral-200/60 dark:ring-neutral-700/60" };
  }
}

export default async function BillingPage({
  params,
}: Readonly<{ params: Promise<{ role: string }> }>) {
  const { role } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, plan_name, price_amount, currency, current_period_end, cancel_at_period_end")
    .eq("user_id", user.id)
    .maybeSingle<SubscriptionRow>();

  const basePath = `/dashboard/${role}/billing`;
  const hasActivePlan = subscription && (subscription.status === "active" || subscription.status === "trialing");

  const quickActions = [
    {
      href: `${basePath}/subscription`,
      icon: CreditCard,
      label: "Manage Subscription",
      description: "Upgrade, downgrade, or cancel your plan",
    },
    {
      href: `${basePath}/invoices`,
      icon: FileText,
      label: "Invoices",
      description: "Download receipts and payment history",
    },
    {
      href: `${basePath}/payment-methods`,
      icon: CreditCard,
      label: "Payment Methods",
      description: "Manage your saved cards",
    },
    {
      href: `${basePath}/refund`,
      icon: RotateCcw,
      label: "Request a Refund",
      description: "Submit a refund request within 14 days",
    },
  ];

  const cfg = statusConfig(subscription?.status ?? "none");
  const StatusIcon = cfg.icon;

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="font-heading text-xl font-semibold text-foreground">
          Billing & Payments
        </h1>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Manage your subscription, invoices, and payment details
        </p>
      </div>

      {/* Subscription status card */}
      <div className={`rounded-xl p-5 ${cfg.bg}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <StatusIcon className={`mt-0.5 shrink-0 ${cfg.color}`} size={20} />
            <div>
              {hasActivePlan ? (
                <>
                  <p className="font-heading text-base font-semibold text-foreground">
                    {subscription!.plan_name ?? "Britestate Plan"}{" "}
                    <Badge className="ml-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-brand-primary-lighter text-brand-primary">
                      {cfg.label}
                    </Badge>
                  </p>
                  <p className="mt-0.5 font-body text-sm text-neutral-500">
                    {subscription!.price_amount
                      ? `${formatGBP(subscription!.price_amount, subscription!.currency)}/month`
                      : null}
                    {subscription!.current_period_end
                      ? ` · Renews ${formatDate(subscription!.current_period_end)}`
                      : null}
                    {subscription!.cancel_at_period_end
                      ? " · Cancels at period end"
                      : null}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-heading text-base font-semibold text-foreground">
                    No active plan
                  </p>
                  <p className="mt-0.5 font-body text-sm text-neutral-500">
                    Subscribe to start listing properties and managing clients on Britestate.
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="shrink-0">
            {hasActivePlan ? (
              <Button variant="outline" size="sm" asChild className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                <Link href={`${basePath}/subscription`}>
                  Manage
                  <ArrowRight size={14} className="ml-1" />
                </Link>
              </Button>
            ) : (
              <Button size="sm" asChild className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90">
                <Link href={`${basePath}/checkout/subscription`}>
                  Subscribe now
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <div className="h-full cursor-pointer rounded-xl bg-card p-4 shadow-sm ring-1 ring-neutral-200/60 transition-all hover:shadow-md dark:ring-neutral-700/60">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary-lighter p-2 dark:bg-brand-primary/10">
                    <Icon className="text-brand-primary dark:text-brand-primary-light" size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-heading text-sm font-semibold text-foreground">{action.label}</p>
                    <p className="mt-0.5 font-body text-sm text-neutral-500">{action.description}</p>
                  </div>
                  <ArrowRight className="ml-auto mt-1 shrink-0 text-neutral-400" size={16} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <p className="font-body text-xs text-neutral-500">
        A 2.5% platform commission applies on sales transactions. All payments are processed securely via Stripe.
      </p>
    </div>
  );
}
