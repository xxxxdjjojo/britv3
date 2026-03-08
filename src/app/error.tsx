"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    // Log to error reporting service in production
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-error-light">
          <AlertTriangle className="size-10 text-error" />
        </div>
        <h1 className="mt-6 font-heading text-4xl font-bold text-neutral-900">
          Something Went Wrong
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base text-neutral-500">
          An unexpected error occurred. Please try again or contact support if
          the problem persists.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-neutral-400">
            Error reference: {error.digest}
          </p>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={reset}>Try Again</Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Go Home
          </Button>
        </div>
        <p className="mt-8 text-xs text-neutral-400">
          Britestate | UK Property Portal
        </p>
      </div>
    </div>
  );
}
