import { CreateListingWizard } from "@/components/dashboard/agent/listings/CreateListingWizard";

export default function CreateListingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Listing</h1>
        <p className="text-muted-foreground">
          Add a new property to the market in 8 simple steps.
        </p>
      </div>
      <CreateListingWizard />
    </div>
  );
}
