import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NotificationPreferences } from "@/components/profile/NotificationPreferences";

export const metadata: Metadata = {
  title: "Notification Settings | Britestate",
  description: "Configure your notification preferences.",
};

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Profile
        </Link>
      </div>

      <h1 className="text-2xl font-bold">Notification Settings</h1>
      <NotificationPreferences />
    </div>
  );
}
