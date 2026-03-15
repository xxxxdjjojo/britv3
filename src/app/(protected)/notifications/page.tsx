import type { Metadata } from "next";
import NotificationCentreClient from "./NotificationCentreClient";

export const metadata: Metadata = {
  title: "Notification Centre | Britestate",
};

export default function NotificationsPage() {
  return <NotificationCentreClient />;
}
