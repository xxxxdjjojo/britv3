import type { Metadata } from "next";
import InboxPageClient from "./InboxPageClient";

export const metadata: Metadata = {
  title: "Inbox | Britestate",
  description: "Your conversations",
};

export default function InboxPage() {
  return <InboxPageClient />;
}
