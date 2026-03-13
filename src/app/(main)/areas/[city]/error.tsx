"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CityAreaGuideError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  const router = useRouter();
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="bg-white border border-primary/10 rounded-2xl shadow-sm p-10 max-w-md w-full text-center">
        <p className="text-4xl font-black text-primary font-heading mb-2">Britestate</p>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Something went wrong loading this page</h2>
        <p className="text-sm text-neutral-500 mb-8">{error.message}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => { reset(); router.refresh(); }}
            className="bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/areas"
            className="border border-primary/20 text-primary font-bold px-6 py-3 rounded-xl hover:bg-primary/5 transition-colors"
          >
            Back to area guides
          </Link>
        </div>
      </div>
    </div>
  );
}
