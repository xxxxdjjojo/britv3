import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/auth";
import { ListingForm } from "@/components/listings/ListingForm";

const ALLOWED_ROLES: UserRole[] = ["agent", "seller"];

export const metadata = {
  title: "Create New Listing - TrueDeed",
  description: "Create a new property listing",
};

export default async function NewListingPage(
  props: Readonly<{ params: Promise<{ role: string }> }>,
) {
  const { role } = await props.params;

  if (!ALLOWED_ROLES.includes(role as UserRole)) {
    redirect(`/dashboard/${role}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Create New Listing
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Fill in the details to list a property on TrueDeed.
        </p>
      </div>

      <ListingForm mode="create" role={role} />
    </div>
  );
}
