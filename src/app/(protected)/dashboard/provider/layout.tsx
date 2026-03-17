import { ProviderSidebar } from "@/components/dashboard/provider/ProviderSidebar";

export default function ProviderLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-screen">
      <ProviderSidebar />
      <main className="flex-1 overflow-auto lg:pl-64">
        {children}
      </main>
    </div>
  );
}
