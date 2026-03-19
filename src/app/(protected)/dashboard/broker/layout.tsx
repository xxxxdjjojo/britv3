import { BrokerSidebar } from "@/components/dashboard/broker/BrokerSidebar";

export default function BrokerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen">
      <BrokerSidebar />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:pl-72 lg:pr-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
