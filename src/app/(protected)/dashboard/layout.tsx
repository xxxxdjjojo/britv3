import { Sidebar } from "@/components/layout/Sidebar";
import { DeletionPendingBanner } from "@/components/auth/DeletionPendingBanner";

export default function DashboardLayout(
  props: Readonly<{
    children: React.ReactNode;
  }>,
) {
  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] bg-surface">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-surface p-4 md:p-6 lg:p-8">
        <DeletionPendingBanner />
        {props.children}
      </main>
    </div>
  );
}
