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
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/${params.role}/billing`}>
            <ArrowLeft size={16} />
          </Link>
        </Button>
        <div>
          <h1
            className="text-2xl font-semibold text-gray-900 dark:text-gray-100"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            Payment Methods
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your saved cards
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <CreditCard size={16} className="text-gray-400" />
              Saved Cards
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-gray-400" size={24} />
            </div>
          ) : methods.length === 0 ? (
            <div className="py-12 text-center">
              <CreditCard className="mx-auto mb-3 text-gray-300" size={40} />
              <p className="text-sm text-gray-500">No saved payment methods.</p>
              <p className="mt-1 text-xs text-gray-400">
                Payment methods are added automatically when you subscribe.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {methods.map((method) => (
                <div key={method.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-14 items-center justify-center rounded-md border border-border bg-surface text-xs font-semibold dark:border-gray-700 dark:bg-gray-800">
                      {brandIcon(method.brand)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        •••• {method.last4}
                        {method.isDefault && (
                          <Badge className="ml-2 bg-brand-primary-lighter text-brand-primary text-xs dark:bg-brand-primary/20 dark:text-emerald-400">
                            Default
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Expires {String(method.expMonth).padStart(2, "0")}/{method.expYear}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!method.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
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
                      className="h-8 text-red-500 hover:text-red-600"
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
        </CardContent>
      </Card>

      <p className="text-xs text-gray-400 dark:text-gray-600">
        To add a new payment method, manage your subscription via the Stripe portal. Your card details are stored securely by Stripe — never on Britestate servers.
      </p>
    </div>
  );
}
