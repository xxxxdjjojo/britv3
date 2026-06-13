import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { DeletionPendingBanner } from "@/components/auth/DeletionPendingBanner";

export default function DashboardLayout(
  props: Readonly<{
    children: React.ReactNode;
  }>,
) {
  return (
    <div className="flex h-screen flex-col bg-surface">
      <DashboardTopbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-surface p-4 md:p-6 lg:p-8">
          <DeletionPendingBanner />
          {props.children}
        </main>
      </div>
    </div>
  );
}
