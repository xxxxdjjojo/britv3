import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getMaintenanceRequest } from "@/services/landlord/maintenance-service";
import { getValidNextStatuses } from "@/services/landlord/maintenance-service";
import { MaintenanceStatusBadge } from "@/components/landlord/MaintenanceStatusBadge";
import { ProviderAssignment } from "@/components/landlord/ProviderAssignment";
import { StatusUpdateForm } from "./StatusUpdateForm";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";


function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-48 mt-2" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent(
  props: Readonly<{
    params: Promise<{ id: string; requestId: string }>;
  }>,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { id: propertyId, requestId } = await props.params;

  let request;
  try {
    request = await getMaintenanceRequest(supabase, requestId);
  } catch {
    notFound();
  }

  const validTransitions = getValidNextStatuses(request.status);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/landlord/properties/${propertyId}/maintenance`}
          className="text-sm text-neutral-500 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-200"
        >
          &larr; Back
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {request.title}
        </h1>
        <MaintenanceStatusBadge status={request.status} />
      </div>

      {/* Details */}
      <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-600">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="font-medium text-neutral-500 dark:text-neutral-500">
              Priority
            </dt>
            <dd className="mt-1 capitalize text-neutral-900 dark:text-neutral-100">
              {request.priority}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-500 dark:text-neutral-500">
              Created
            </dt>
            <dd className="mt-1 text-neutral-900 dark:text-neutral-100">
              {new Date(request.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </dd>
          </div>
        </dl>

        <div className="mt-4">
          <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-500">
            Description
          </h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-900 dark:text-neutral-100">
            {request.description}
          </p>
        </div>

        {/* Photos */}
        {request.photo_urls.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-500">
              Photos
            </h3>
            <div className="mt-2 flex flex-wrap gap-3">
              {request.photo_urls.map((url, index) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={url}
                    alt={`Maintenance photo ${index + 1}`}
                    className="h-32 w-32 rounded-md border object-cover dark:border-neutral-600"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Resolution */}
        {request.resolution_notes && (
          <div className="mt-4 rounded-md bg-success-light p-3 dark:bg-success/10">
            <h3 className="text-sm font-medium text-success dark:text-success">
              Resolution
            </h3>
            <p className="mt-1 text-sm text-success dark:text-success">
              {request.resolution_notes}
            </p>
            {request.resolved_at && (
              <p className="mt-1 text-xs text-success dark:text-success">
                Resolved:{" "}
                {new Date(request.resolved_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Provider Assignment */}
      <ProviderAssignment
        requestId={request.id}
        currentProviderId={request.assigned_provider_id}
        currentProviderName={request.assigned_provider_name}
      />

      {/* Status Update */}
      {validTransitions.length > 0 && (
        <StatusUpdateForm
          requestId={request.id}
          currentStatus={request.status}
          validTransitions={validTransitions}
        />
      )}
    </div>
  );
}

export default function MaintenanceDetailPage(
  props: Readonly<{
    params: Promise<{ id: string; requestId: string }>;
  }>,
) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent {...props} />
    </Suspense>
  );
}
