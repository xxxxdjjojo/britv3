import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function PropertyNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md px-4">
        <Search className="size-12 text-muted-foreground mx-auto" />
        <h1 className="text-2xl font-bold">Property not found</h1>
        <p className="text-muted-foreground">
          This property listing may have been removed or the link may be
          incorrect.
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild>
            <Link href="/properties">Search properties</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
