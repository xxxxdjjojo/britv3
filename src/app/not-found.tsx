import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-brand-primary-lighter">
          <FileQuestion className="size-10 text-brand-primary" />
        </div>
        <h1 className="mt-6 font-heading text-4xl font-bold text-neutral-900">
          Page Not Found
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base text-neutral-500">
          Sorry, the page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-8">
          <Button render={<Link href="/" />}>Go Back Home</Button>
        </div>
        <p className="mt-8 text-xs text-neutral-400">
          Britestate | UK Property Portal
        </p>
      </div>
    </div>
  );
}
