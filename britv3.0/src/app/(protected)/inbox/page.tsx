import type { Metadata } from "next";
import InboxList from "@/components/messaging/InboxList";

export const metadata: Metadata = {
  title: "Inbox | Britestate",
  description: "Your conversations",
};

export default function InboxPage() {
  return (
    <div className="container max-w-3xl mx-auto py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Inbox</h1>
      </div>
      <div className="border rounded-lg bg-card min-h-[400px]">
        <InboxList />
      </div>
    </div>
  );
}
