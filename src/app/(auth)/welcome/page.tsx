import { redirect } from "next/navigation";

export default function WelcomePage() {
  redirect("/verify-email/confirmed");
}
