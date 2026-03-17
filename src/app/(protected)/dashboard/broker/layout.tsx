import { BrokerSidebar } from "@/components/dashboard/broker/BrokerSidebar";

export default function BrokerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-screen">
      <BrokerSidebar />
      <main className="flex-1 overflow-auto lg:pl-64">
        {children}
      </main>
    </div>
  );
}
