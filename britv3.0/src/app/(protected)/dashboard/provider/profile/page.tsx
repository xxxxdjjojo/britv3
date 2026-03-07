"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProviderProfileForm } from "@/components/provider/ProviderProfileForm";
import type { ProviderVerificationStatus } from "@/types/marketplace";

const VERIFICATION_LABELS: Record<
  ProviderVerificationStatus,
  { label: string; className: string }
> = {
  unverified: {
    label: "Unverified",
    className: "bg-neutral-100 text-neutral-600",
  },
  pending_review: {
    label: "Pending Review",
    className: "bg-yellow-100 text-yellow-800",
  },
  verified: {
    label: "Verified",
    className: "bg-green-100 text-green-800",
  },
  suspended: {
    label: "Suspended",
    className: "bg-red-100 text-red-800",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-800",
  },
};

export default function ProviderProfilePage() {
  const [verificationStatus, setVerificationStatus] =
    useState<ProviderVerificationStatus>("unverified");
  const [existingProfile, setExistingProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/providers/profile");
        if (res.ok) {
          const data = await res.json();
          setExistingProfile(data);
          setVerificationStatus(
            (data.verification_status as ProviderVerificationStatus) ??
              "unverified",
          );
        }
      } catch {
        // no existing profile
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const statusConfig = VERIFICATION_LABELS[verificationStatus];

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          Provider Profile
        </h1>
        <Badge
          variant="outline"
          className={`border-transparent ${statusConfig.className}`}
        >
          {statusConfig.label}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {existingProfile ? "Edit Profile" : "Create Profile"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProviderProfileForm
            defaultValues={existingProfile as Record<string, unknown> | undefined}
            isEdit={!!existingProfile}
            onSuccess={() => window.location.reload()}
          />
        </CardContent>
      </Card>
    </div>
  );
}
