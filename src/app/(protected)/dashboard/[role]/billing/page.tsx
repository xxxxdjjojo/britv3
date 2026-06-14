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
      return { label: "Active", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" };
    case "trialing":
      return { label: "Trial", icon: Clock, color: "text-blue-600", bg: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800" };
    case "past_due":
      return { label: "Past due", icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800" };
    default:
      return { label: "No plan", icon: AlertCircle, color: "text-gray-500", bg: "bg-surface border-border dark:bg-gray-900 dark:border-gray-800" };
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
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
          Billing & Payments
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your subscription, invoices, and payment details
        </p>
      </div>

      {/* Subscription status card */}
      <Card className={`border ${cfg.bg}`}>
        <CardContent className="flex items-start justify-between gap-4 py-5">
          <div className="flex items-start gap-3">
            <StatusIcon className={`mt-0.5 shrink-0 ${cfg.color}`} size={20} />
            <div>
              {hasActivePlan ? (
                <>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {subscription!.plan_name ?? "Britestate Plan"}{" "}
                    <Badge className="ml-1 text-xs font-medium">{cfg.label}</Badge>
                  </p>
                  <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
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
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    No active plan
                  </p>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                    Subscribe to start listing properties and managing clients on Britestate.
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="shrink-0">
            {hasActivePlan ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`${basePath}/subscription`}>
                  Manage
                  <ArrowRight size={14} className="ml-1" />
                </Link>
              </Button>
            ) : (
              <Button size="sm" asChild style={{ backgroundColor: "#1B4D3E" }}>
                <Link href={`${basePath}/checkout/subscription`}>
                  Subscribe now
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick actions grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="flex items-start gap-4 py-5">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary-lighter dark:bg-brand-primary/20">
                    <Icon className="text-brand-primary dark:text-emerald-400" size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{action.label}</p>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{action.description}</p>
                  </div>
                  <ArrowRight className="ml-auto mt-1 shrink-0 text-gray-400" size={16} />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-600">
        A 2.5% platform commission applies on sales transactions. All payments are processed securely via Stripe.
      </p>
    </div>
  );
}
