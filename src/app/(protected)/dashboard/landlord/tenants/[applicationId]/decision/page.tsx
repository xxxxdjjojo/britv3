"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, Loader2, Info } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { acceptApplication, rejectApplication } from "@/services/landlord/tenant-application-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// -- Page ---------------------------------------------------------------------

type Props = {
  params: Promise<{ applicationId: string }>;
};

export default function DecisionPage({ params }: Props) {
  const { applicationId } = use(params);
  const router = useRouter();

  const [tab, setTab] = useState<"accept" | "reject">("accept");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAccept() {
    setLoading(true);
    try {
      const supabase = createClient();
      await acceptApplication(supabase, applicationId);
      toast.success("Application accepted — email sent to applicant");
      router.push("/dashboard/landlord/tenants");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to accept application");
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    if (reason.trim().length < 10) {
      toast.error("Please provide a rejection reason of at least 10 characters");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      await rejectApplication(supabase, applicationId, reason.trim());
      toast.success("Application rejected — email sent to applicant");
      router.push("/dashboard/landlord/tenants");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject application");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Back navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={`/dashboard/landlord/tenants/${applicationId}`}
          className="hover:text-foreground transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="size-3.5" />
          Back to Application
        </Link>
      </div>

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold font-heading tracking-tight">Application Decision</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Accept or reject this rental application. The applicant will be notified by email.
        </p>
      </div>

      {/* Decision tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "accept" | "reject")}>
        <TabsList className="grid grid-cols-2 w-full rounded-xl h-11">
          <TabsTrigger value="accept" className="rounded-lg flex items-center gap-2 font-medium">
            <CheckCircle className="size-4 text-emerald-600" />
            Accept
          </TabsTrigger>
          <TabsTrigger value="reject" className="rounded-lg flex items-center gap-2 font-medium">
            <XCircle className="size-4 text-red-500" />
            Reject
          </TabsTrigger>
        </TabsList>

        {/* Accept tab */}
        <TabsContent value="accept" className="mt-4">
          <Card className="rounded-2xl border-emerald-200 dark:border-emerald-800/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle className="size-4" />
                Accept Application
              </CardTitle>
              <CardDescription>
                This will approve the applicant and send them a confirmation email via Britestate.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Info block */}
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 p-4">
                <div className="flex gap-3">
                  <Info className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-emerald-800 dark:text-emerald-300 space-y-1">
                    <p className="font-medium">What happens next?</p>
                    <ul className="space-y-1 text-emerald-700 dark:text-emerald-400">
                      <li>• The applicant receives an approval email</li>
                      <li>• Follow up with deposit and tenancy agreement details</li>
                      <li>• You can generate a tenancy agreement from the dashboard</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleAccept}
                disabled={loading}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
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
        <TabsContent value="reject" className="mt-4">
          <Card className="rounded-2xl border-red-200 dark:border-red-800/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading text-red-700 dark:text-red-400 flex items-center gap-2">
                <XCircle className="size-4" />
                Reject Application
              </CardTitle>
              <CardDescription>
                The applicant will receive a notification email. You must provide a reason.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rejection_reason" className="text-sm font-medium">
                  Rejection Reason <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="rejection_reason"
                  rows={4}
                  placeholder="Please provide a clear reason for the rejection (minimum 10 characters)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={`rounded-xl resize-none ${
                    reason.length > 0 && reason.trim().length < 10
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }`}
                />
                {reason.length > 0 && reason.trim().length < 10 && (
                  <p className="text-xs text-destructive">
                    Reason must be at least 10 characters ({reason.trim().length}/10)
                  </p>
                )}
              </div>

              {/* Warning block */}
              <div className="rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/20 p-4">
                <div className="flex gap-3">
                  <Info className="size-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-300">
                    This will send a rejection email to the applicant. This action cannot be undone.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleReject}
                disabled={loading || reason.trim().length < 10}
                variant="destructive"
                className="w-full h-11 font-medium"
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
    </div>
  );
}
