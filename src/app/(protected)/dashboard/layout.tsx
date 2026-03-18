import { Sidebar } from "@/components/layout/Sidebar";
import { DeletionPendingBanner } from "@/components/auth/DeletionPendingBanner";

export default function DashboardLayout(
  props: Readonly<{
    children: React.ReactNode;
  }>,
) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-neutral-50 p-6">
        <DeletionPendingBanner />
        {props.children}
      </main>
    </div>
  );
}
