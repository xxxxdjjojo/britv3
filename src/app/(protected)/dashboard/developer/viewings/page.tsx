import type { Metadata } from "next";
import {
  getDeveloperDashboardData,
  resolveCurrentDeveloper,
} from "@/services/new-homes/dashboard-service";
import { DeveloperGate } from "@/components/new-homes/dashboard/DeveloperGate";
import { ViewingsList } from "@/components/new-homes/dashboard/DashboardPanels";

export const metadata: Metadata = {
  title: "Viewings | Developer dashboard | TrueDeed",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DeveloperViewingsPage() {
  const developer = await resolveCurrentDeveloper();
  if (!developer) return <DeveloperGate />;

  const data = await getDeveloperDashboardData(developer.developerId);
  const leadNameByViewing = new Map(
    data.leads.map((l) => [l.id, l.name] as const),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">
          {developer.developerName}
        </p>
        <h1 className="font-heading text-3xl font-bold text-neutral-900">Viewings</h1>
        <p className="mt-1 max-w-xl text-sm text-neutral-500">
          {data.metrics.viewingBookings} confirmed viewings ·{" "}
          {data.viewings.length} requested in total.
        </p>
      </header>

      {data.viewings.length === 0 ? (
        <ViewingsList viewings={data.viewings} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Date</th>
                <th className="px-4 py-2.5 font-semibold">Buyer</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data.viewings.map((v) => (
                <tr key={v.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {v.scheduledFor
                      ? new Date(v.scheduledFor).toLocaleDateString("en-GB", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Date to confirm"}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {(v.leadId && leadNameByViewing.get(v.leadId)) || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize text-neutral-600">
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{v.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
