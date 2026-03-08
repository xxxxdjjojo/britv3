import { redirect } from "next/navigation";

export default function SettingsPage() {
    // Redirect to security settings as default
    redirect("/settings/security");
}
