import { redirect } from "next/navigation";

export default function SettingsPage() {
    // Redirect to account settings as default
    redirect("/settings/account");
}
