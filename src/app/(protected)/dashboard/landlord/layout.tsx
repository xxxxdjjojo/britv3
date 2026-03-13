import { LandlordSidebar } from "@/components/landlord/LandlordSidebar";

export default function LandlordLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-screen">
      <LandlordSidebar />
      <main className="flex-1 overflow-auto lg:pl-64">
        {children}
      </main>
    </div>
  );
}
