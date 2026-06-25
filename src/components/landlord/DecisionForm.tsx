"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { TenantApplicationStatus } from "@/types/landlord";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TERMINAL_STATUSES: ReadonlySet<TenantApplicationStatus> = new Set([
  "approved",
  "rejected",
  "withdrawn",
]);

const STATUS_VERB: Record<TenantApplicationStatus, string> = {
  received: "received",
  shortlisted: "shortlisted",
  referencing: "in referencing",
  approved: "approved",
  rejected: "rejected",
  withdrawn: "withdrawn",
};

type Props = Readonly<{
  applicationId: string;
  status: TenantApplicationStatus;
  applicantName: string;
}>;

export function DecisionForm({ applicationId, status, applicantName }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"accept" | "reject">("accept");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const isTerminal = TERMINAL_STATUSES.has(status);

  async function submitDecision(body: { action: "accept" } | { action: "reject"; reason: string }) {
    setLoading(true);
    try {
      const res = await fetch(`/api/landlord/applications/${applicationId}/decision`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Failed to record decision");
      }
      toast.success(
        body.action === "accept"
          ? "Application accepted — email sent to applicant"
          : "Application rejected — email sent to applicant",
      );
      router.push("/dashboard/landlord/tenants");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record decision");
    } finally {
      setLoading(false);
    }
  }

  if (isTerminal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Decision recorded</CardTitle>
          <CardDescription>
            {applicantName}&rsquo;s application has already been {STATUS_VERB[status]}. No further
            action is needed.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as "accept" | "reject")}>
      <TabsList className="grid grid-cols-2 w-full">
        <TabsTrigger value="accept" className="flex items-center gap-2">
          <CheckCircle className="size-4 text-green-600" />
          Accept
        </TabsTrigger>
        <TabsTrigger value="reject" className="flex items-center gap-2">
          <XCircle className="size-4 text-red-500" />
          Reject
        </TabsTrigger>
      </TabsList>

      {/* Accept tab */}
      <TabsContent value="accept">
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-green-700 dark:text-green-400">
              Accept Application
            </CardTitle>
            <CardDescription>
              This will approve {applicantName} and send them a confirmation email via TrueDeed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 p-4 text-sm text-green-800 dark:text-green-300">
              <p>
                The applicant will be emailed that their application has been approved. Follow up
                with next steps (deposit, tenancy agreement) directly.
              </p>
            </div>
            <Button
              onClick={() => submitDecision({ action: "accept" })}
              disabled={loading}
              className="w-full"
              style={{ backgroundColor: "#1B4D3E" }}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 size-4" />
                  Accept Application
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Reject tab */}
      <TabsContent value="reject">
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-red-700 dark:text-red-400">
              Reject Application
            </CardTitle>
            <CardDescription>
              The applicant will receive a notification email. You must provide a reason.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection_reason">
                Rejection Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="rejection_reason"
                rows={4}
                placeholder="Please provide a reason for rejection (minimum 10 characters)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={reason.length > 0 && reason.trim().length < 10 ? "border-destructive" : ""}
              />
              {reason.length > 0 && reason.trim().length < 10 && (
                <p className="text-xs text-destructive">
                  Reason must be at least 10 characters ({reason.trim().length}/10)
                </p>
              )}
            </div>
            <div className="rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/20 p-4 text-sm text-red-700 dark:text-red-300">
              <p>This will send a rejection email to the applicant. This action cannot be undone.</p>
            </div>
            <Button
              onClick={() => submitDecision({ action: "reject", reason: reason.trim() })}
              disabled={loading || reason.trim().length < 10}
              variant="destructive"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 size-4" />
                  Reject Application
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
