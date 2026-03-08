import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/auth";
import { getListing } from "@/services/listings/listing-service";
import { ListingForm } from "@/components/listings/ListingForm";
import type { ListingWithProperty } from "@/types/property";

const ALLOWED_ROLES: UserRole[] = ["agent", "seller"];

export const metadata = {
  title: "Edit Listing - Britestate",
  description: "Edit your property listing",
};

export default async function EditListingPage(
  props: Readonly<{ params: Promise<{ role: string; id: string }> }>,
) {
  const { role, id } = await props.params;

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

  const result = await getListing(supabase, id);

  if (!result) {
    notFound();
  }

  // Verify ownership
  if (result.listing.user_id !== user.id) {
    redirect(`/dashboard/${role}/listings`);
  }

  const initialData: ListingWithProperty = {
    listing: result.listing,
    property: result.property,
    media: result.media ?? [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Edit Listing</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Update your property listing details.
        </p>
      </div>

      <ListingForm mode="edit" initialData={initialData} role={role} />
    </div>
  );
}
