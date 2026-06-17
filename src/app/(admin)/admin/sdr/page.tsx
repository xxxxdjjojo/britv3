// src/app/(admin)/admin/sdr/page.tsx — Memo Pivot v2: admin SDR dashboard.

import type { Metadata } from "next";

import { SdrCampaignBoard } from "@/components/admin/SdrCampaignBoard";
import { createClient } from "@/lib/supabase/server";
import { snapshotQueue } from "@/services/acquisition/sdr-campaign-service";

export const metadata: Metadata = {
  title: "SDR Campaigns | Britestate Admin",
};

async function requireAdmin(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not signed in");
  }
  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (data?.is_admin !== true) {
    throw new Error("Forbidden");
  }
}

export default async function SdrAdminPage() {
  try {
    await requireAdmin();
  } catch {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-heading text-3xl font-bold">SDR Campaigns</h1>
        <p className="mt-4 text-neutral-700">Admin access required.</p>
      </div>
    );
  }

  const initialJobs = snapshotQueue();
  const counts = {
    total: initialJobs.length,
    queued: initialJobs.filter((j) => j.status === "queued").length,
    sent: initialJobs.filter((j) => j.status === "sent").length,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <header>
        <h1 className="font-heading text-3xl font-bold text-neutral-900">
          SDR Campaigns
        </h1>
        <p className="mt-2 text-neutral-700">
          Queue outbound batches for the memo&apos;s three priority audiences:
          trades, agents and developers.
        </p>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Total jobs" value={counts.total} />
        <Stat label="Queued" value={counts.queued} />
        <Stat label="Sent" value={counts.sent} />
      </section>

      <section className="mt-10">
        <SdrCampaignBoard initialJobs={initialJobs} />
      </section>
    </div>
  );
}

function Stat({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold text-neutral-900">{value}</p>
    </div>
  );
}
