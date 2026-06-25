import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getApplicationById } from "@/services/landlord/tenant-application-service";
import { Button } from "@/components/ui/button";
import { DecisionForm } from "@/components/landlord/DecisionForm";

type Props = {
  params: Promise<{ applicationId: string }>;
};

export default async function DecisionPage({ params }: Props) {
  const { applicationId } = await params;
  const supabase = await createClient();

  let application;
  try {
    application = await getApplicationById(supabase, applicationId);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href={`/dashboard/landlord/tenants/${applicationId}`}>
          <ArrowLeft className="mr-1 size-4" />
          Back to Application
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Application Decision</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Accept or reject {application.applicant_name}&rsquo;s rental application.
        </p>
      </div>

      <DecisionForm
        applicationId={applicationId}
        status={application.status}
        applicantName={application.applicant_name}
      />
    </div>
  );
}
