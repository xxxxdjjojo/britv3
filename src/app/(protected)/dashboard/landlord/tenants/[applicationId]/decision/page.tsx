"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, Loader2 } from "lucide-react";
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
      {/* Back link */}
      <Button asChild variant="ghost" size="sm">
        <Link href={`/dashboard/landlord/tenants/${applicationId}`}>
          <ArrowLeft className="mr-1 size-4" />
          Back to Application
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Application Decision</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Accept or reject this rental application.
        </p>
      </div>

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
                This will approve the applicant and send them a confirmation email via TrueDeed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 p-4 text-sm text-green-800 dark:text-green-300">
                <p>
                  The applicant will receive an email informing them that their application has been
                  approved. You should follow up with next steps (deposit, tenancy agreement) directly.
                </p>
              </div>

              <Button
                onClick={handleAccept}
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
                onClick={handleReject}
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
    </div>
  );
}
