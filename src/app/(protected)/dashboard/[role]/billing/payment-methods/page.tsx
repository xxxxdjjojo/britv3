"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Trash2,
  Star,
  ArrowLeft,
  Loader2,
} from "lucide-react";

type PaymentMethod = {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
};

function brandIcon(brand: string) {
  // Return the brand name capitalised for now — in production swap for SVG logos
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

export default function PaymentMethodsPage() {
  const params = useParams<{ role: string }>();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  useEffect(() => {
    void fetchMethods();
  }, []);

  async function fetchMethods() {
    try {
      const res = await fetch("/api/billing/methods");
      const data = (await res.json()) as { methods?: PaymentMethod[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to load payment methods");
      setMethods(data.methods ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load payment methods");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSetDefault(pmId: string) {
    setSettingDefaultId(pmId);
    try {
      const res = await fetch("/api/billing/methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pm_id: pmId }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to update default");
      toast.success("Default payment method updated");
      setMethods((prev) =>
        prev.map((m) => ({ ...m, isDefault: m.id === pmId })),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update default");
    } finally {
      setSettingDefaultId(null);
    }
  }

  async function handleDelete(pmId: string) {
    setDeletingId(pmId);
    try {
      const res = await fetch(`/api/billing/methods?id=${pmId}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to remove card");
      toast.success("Card removed");
      setMethods((prev) => prev.filter((m) => m.id !== pmId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove card");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/${params.role}/billing`}>
            <ArrowLeft size={16} />
          </Link>
        </Button>
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">
            Payment Methods
          </h1>
          <p className="font-body text-sm text-neutral-500">
            Manage your saved cards
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
        <div className="flex items-center gap-2 border-b border-neutral-100/60 p-6 dark:border-neutral-700/60">
          <CreditCard size={16} className="text-neutral-400" />
          <span className="font-heading text-base font-semibold text-foreground">Saved Cards</span>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-neutral-400" size={24} />
            </div>
          ) : methods.length === 0 ? (
            <div className="py-12 text-center">
              <CreditCard className="mx-auto mb-3 text-neutral-300" size={40} />
              <p className="font-body text-sm text-muted-foreground">No saved payment methods.</p>
              <p className="mt-1 font-body text-xs text-muted-foreground">
                Payment methods are added automatically when you subscribe.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {methods.map((method) => (
                <div key={method.id} className="flex items-center justify-between py-4 transition-colors hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-14 items-center justify-center rounded-md font-body text-xs font-semibold ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
                      {brandIcon(method.brand)}
                    </div>
                    <div>
                      <p className="font-body text-sm font-medium text-foreground">
                        •••• {method.last4}
                        {method.isDefault && (
                          <Badge className="ml-2 inline-flex items-center rounded-full bg-brand-primary-lighter px-2.5 py-0.5 text-xs font-medium text-brand-primary">
                            Default
                          </Badge>
                        )}
                      </p>
                      <p className="font-body text-xs text-neutral-500">
                        Expires {String(method.expMonth).padStart(2, "0")}/{method.expYear}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!method.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 font-body text-xs"
                        onClick={() => void handleSetDefault(method.id)}
                        disabled={settingDefaultId !== null}
                      >
                        {settingDefaultId === method.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Star size={12} />
                        )}
                        Set default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 border-destructive/30 text-destructive hover:bg-destructive/5"
                      onClick={() => void handleDelete(method.id)}
                      disabled={deletingId !== null}
                    >
                      {deletingId === method.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="font-body text-xs text-neutral-500">
        To add a new payment method, manage your subscription via the Stripe portal. Your card details are stored securely by Stripe — never on Britestate servers.
      </p>
    </div>
  );
}
